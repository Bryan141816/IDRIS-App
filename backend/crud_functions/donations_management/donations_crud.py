from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import NoResultFound, SQLAlchemyError
from sqlalchemy import extract, func, case, and_
from typing import Optional, Sequence, Union
from decimal import Decimal
from datetime import datetime, date, timezone, timedelta
from calendar import monthrange
from crud_functions.utils import random_suffix, uid_from_string, _to_enum, uid_from_string, rand_alnum

from crud_functions.finance_management.finance_crud import FinanceRecordCRUD
from data_schemas.donation_schema import DonationHistoryResponse
from models import (
    Donor,
    Donation,
    DonationStatus,
    DonationFrequency,
    DonationType,
    Donation_Cash,
    Donation_InKind,
    FinanceRecord,
    BudgetAllocation,
    RecordStatus,
    TransactionType,
)

from data_schemas.donation_schema import (
    RecurringDonationCreate,
    InKindDonationCreate,
)

# -------------------- CRUD ---------------------------------------------------
class DonationCRUD:
    # --- CREATE ---
    def create_donation(db: Session, donation_data) -> Donation:
        frequency = _to_enum(
            DonationFrequency,
            getattr(donation_data, "frequency", None),
            default=DonationFrequency.ONE_TIME,
        )
        if frequency == DonationFrequency.ONE_TIME:
            return DonationCRUD.create_one_time_pending_donation(db, donation_data)
        else:
            return DonationCRUD.create_recurring_donation(db, donation_data)
    
    @staticmethod
    def create_one_time_pending_donation(db: Session, donation_data) -> Donation:
        # Resolve enums with defaults
        frequency = _to_enum(
            DonationFrequency,
            getattr(donation_data, "frequency", None),
            default=DonationFrequency.ONE_TIME,
        )
        donation_type = _to_enum(
            DonationType,
            getattr(donation_data, "donation_type", None),
            default=DonationType.CASH,
        )

        donor_id = getattr(donation_data, "donor_id", None)
        if not donor_id:
            raise HTTPException(status_code=422, detail="donor_id is required")

        try:
            # --- Parent donation ---
            donation = Donation(
                donor_id=donor_id,
                funding_id=getattr(donation_data, "funding_id", None),
                frequency=frequency,
                status=DonationStatus.PENDING,
                donation_type=donation_type,
                next_donation_date=None,
                end_date=None,
                is_active=False,
            )
            donation.donation_id = uid_from_string(f"{rand_alnum()}")
            db.add(donation)
            db.flush()  # ensure donation_id available

            # --- Child row + capture amount/desc for FinanceRecord ---
            amount_for_finance: Decimal = Decimal("0")
            desc_for_finance: str = "Donation"

            if donation_type == DonationType.CASH:
                raw_amount = getattr(donation_data, "amount", None)
                cash = Donation_Cash(
                    donation_id=donation.donation_id,
                    cash_id=uid_from_string(f"{donation.donation_id}{random_suffix(6)}"),
                    amount=raw_amount,
                    payment_method=getattr(donation_data, "payment_method", None),
                )
                db.add(cash)
                amount_for_finance = Decimal(str(raw_amount or 0))
                desc_for_finance = "Cash donation"
            else:
                item_desc = getattr(donation_data, "item_description", None) \
                            or getattr(donation_data, "description", None)
                est_val = getattr(donation_data, "estimated_value", None)
                if est_val is None:
                    est_val = getattr(donation_data, "amount", None)  # legacy fallback

                inkind = Donation_InKind(
                    donation_id=donation.donation_id,
                    inkind_id=uid_from_string(f"{donation.donation_id}{random_suffix(6)}"),
                    item_description=item_desc,
                    estimated_value=est_val,
                    quantity=getattr(donation_data, "quantity", None),
                )
                db.add(inkind)
                amount_for_finance = Decimal(str(est_val or 0))
                desc_for_finance = f"In-kind donation: {item_desc or 'items'}"

            # --- Donor name (relationship if available; fallback fetch) ---
            donor_name = None
            try:
                donor_name = donation.donor.donor_name  # type: ignore[attr-defined]
            except Exception:
                pass
            if not donor_name:
                donor = db.get(Donor, donor_id)
                donor_name = getattr(donor, "donor_name", None) or "Unknown Donor"

            # --- FinanceRecord in the SAME transaction, NO extra commit ---
            # try:
            #     budget_for_value = BudgetAllocation.DONATION
            # except Exception:
            #     budget_for_value = BudgetAllocation("DONATION")

            # FinanceRecord.date is a DATE in your Pydantic model; use today() to match
            finance_date: date = getattr(donation, "date", None) or datetime.now(timezone.utc).date()

            finance = FinanceRecord(
                # let DB default or your model factory generate if possible; otherwise:
                finance_id=uid_from_string(f"DON{random_suffix(8)}"),
                counterparty=donor_name,
                transaction_type=TransactionType.INFLOW,
                amount=amount_for_finance,    # Decimal
                date=finance_date,            # date, not datetime
                description=desc_for_finance,
                status=RecordStatus.PENDING,
                budget_for=BudgetAllocation.DONATIONS,
            )
            db.add(finance)

            # --- Commit all together ---
            db.commit()
            db.refresh(donation)
            return donation

        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error creating donation: {e}")
        
    @staticmethod
    def create_recurring_donation(db: Session, donation_data: RecurringDonationCreate) -> Donation:
        frequency = _to_enum(
            DonationFrequency,
            getattr(donation_data, "frequency", None),
            default=DonationFrequency.MONTHLY,
        )

        # compute next_donation_date (similar logic as we discussed)
        today = datetime.now(timezone.utc).date()
        provided_next = getattr(donation_data, "next_donation_date", None)
        start_date = provided_next or getattr(donation_data, "start_date", None) or today

        computed_next: Optional[date] = None
        if frequency == DonationFrequency.ONE_TIME:
            computed_next = None
        else:
            months_delta = 1 if frequency == DonationFrequency.MONTHLY else (
                3 if frequency == DonationFrequency.QUARTERLY else (
                    12 if frequency == DonationFrequency.YEARLY else 1
                )
            )
            seed = provided_next or start_date
            if hasattr(seed, "date") and not isinstance(seed, date):
                seed = seed.date()
            try:
                next_dt = _add_months(seed, months_delta)
            except Exception:
                next_dt = _add_months(today, months_delta)
            while next_dt <= today:
                next_dt = _add_months(next_dt, months_delta)
            computed_next = next_dt

        # --- Create parent Donation WITHOUT 'amount' / 'payment_method' ---
        donation = Donation(
            donor_id=getattr(donation_data, "donor_id", None),
            funding_id=getattr(donation_data, "funding_id", None),
            frequency=frequency,
            status=DonationStatus.PENDING,
            # adjust field names to match your model (you used 'kind' earlier)
            next_donation_date=computed_next,
            end_date=getattr(donation_data, "recurring_end_date", None),
            is_active=True,
        )
        donation.donation_id = uid_from_string(f"{rand_alnum()}")
        db.add(donation)
        db.flush()  # ensure donation_id available for child rows

        # --- Create child row that actually stores amount/payment_method or in-kind fields ---
        donation_type = _to_enum(
            DonationType,
            getattr(donation_data, "donation_type", None),
            default=DonationType.CASH,
        )

        if donation_type == DonationType.CASH:
            raw_amount = getattr(donation_data, "amount", None)
            cash = Donation_Cash(
                donation_id=donation.donation_id,
                cash_id=uid_from_string(f"{donation.donation_id}{random_suffix(6)}"),
                amount=Decimal(str(raw_amount or 0)),
                payment_method=getattr(donation_data, "payment_method", None),
            )
            db.add(cash)
            amount_for_finance = Decimal(str(raw_amount or 0))
            desc_for_finance = "Cash donation"
        else:
            item_desc = getattr(donation_data, "item_description", None) or getattr(donation_data, "description", None)
            est_val = getattr(donation_data, "estimated_value", None) or getattr(donation_data, "amount", None)
            inkind = Donation_InKind(
                donation_id=donation.donation_id,
                inkind_id=uid_from_string(f"{donation.donation_id}{random_suffix(6)}"),
                item_description=item_desc,
                estimated_value=est_val,
                quantity=getattr(donation_data, "quantity", None),
            )
            db.add(inkind)
            amount_for_finance = Decimal(str(est_val or 0))
            desc_for_finance = f"In-kind donation: {item_desc or 'items'}"

        # --- (optional) Create FinanceRecord if your system needs it ---
        donor_name = None
        try:
            donor_name = donation.donor.donor_name  # may work if relationship populated
        except Exception:
            pass
        if not donor_name:
            donor = db.get(Donor, getattr(donation_data, "donor_id", None))
            donor_name = getattr(donor, "donor_name", None) or "Unknown Donor"

        finance_date: date = getattr(donation, "date", None) or datetime.now(timezone.utc).date()
        finance = FinanceRecord(
            finance_id=uid_from_string(f"RDON{random_suffix(8)}"),
            counterparty=donor_name,
            transaction_type=TransactionType.INFLOW,
            amount=amount_for_finance,
            date=finance_date,
            description=desc_for_finance,
            status=RecordStatus.PENDING,
            budget_for=BudgetAllocation.DONATIONS,
        )
        db.add(finance)

        db.commit()
        db.refresh(donation)
        return donation

    @staticmethod
    def cancel_donation_status(db: Session, donation_id: str) -> Donation:
        try:
            donation = db.query(Donation).filter(Donation.donation_id == donation_id).one()
            donation.status = DonationStatus.CANCELLED
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")

    @staticmethod
    def completed_donation_status(db: Session, donation_id: str) -> Donation:
        try:
            donation = db.query(Donation).filter(Donation.donation_id == donation_id).one()
            donation.status = DonationStatus.COMPLETED
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")

    @staticmethod
    def failed_donation_status(db: Session, donation_id: str) -> Donation:
        try:
            donation = db.query(Donation).filter(Donation.donation_id == donation_id).one()
            donation.status = DonationStatus.FAILED
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")

    # --- AGGREGATIONS / REPORTS ---
    @staticmethod
    def get_total_donations(db: Session, year: int, month: int | None = None):
        """
        Total value (cash + estimated in-kind) for COMPLETED donations in a given year (and optional month).
        Returns a Decimal (or 0 if none).
        """
        filters = [
            extract("year", Donation.donation_date) == year,
            Donation.status == DonationStatus.COMPLETED,
        ]
        if month is not None:
            filters.append(extract("month", Donation.donation_date) == month)

        # Outer join to avoid dropping rows that don't have a cash/inkind record
        cash_sum_expr = func.coalesce(func.sum(Donation_Cash.amount), 0)
        inkind_sum_expr = func.coalesce(func.sum(Donation_InKind.estimated_value), 0)

        total_expr = (cash_sum_expr + inkind_sum_expr).label("total")

        total = (
            db.query(total_expr)
            .select_from(Donation)
            .outerjoin(Donation_Cash, Donation_Cash.donation_id == Donation.donation_id)
            .outerjoin(Donation_InKind, Donation_InKind.donation_id == Donation.donation_id)
            .filter(*filters)
            .scalar()
        )

        return total or 0

    @staticmethod
    def get_donor_retention_by_year(db: Session, year: int):
        """
        Donor retention: % of donors from (year - 1) who donated again in `year`.
        Counts COMPLETED donations only.
        """
        prev_year = year - 1

        prev_year_donors_subq = (
            db.query(Donation.donor_id)
            .filter(
                extract("year", Donation.donation_date) == prev_year,
                Donation.status == DonationStatus.COMPLETED,
            )
            .distinct()
            .subquery()
        )

        retained_donors = (
            db.query(Donation.donor_id)
            .filter(
                extract("year", Donation.donation_date) == year,
                Donation.status == DonationStatus.COMPLETED,
                Donation.donor_id.in_(db.query(prev_year_donors_subq.c.donor_id)),
            )
            .distinct()
            .count()
        )

        total_prev_donors = db.query(prev_year_donors_subq).count()

        return {
            "total_donors_last_year": total_prev_donors,
            "retained_donors": retained_donors,
            "retention_rate": round((retained_donors / total_prev_donors) * 100, 2) if total_prev_donors else 0.0,
        }

    @staticmethod
    def get_donations_with_details(db: Session, limit: int = 10):
        """
        Recent COMPLETED donations with donor name & proposal title,
        including cash / in-kind detail pulled from related tables.
        """
        results = (
            db.query(Donation)
            .options(
                joinedload(Donation.donor),
                joinedload(Donation.proposal),
                joinedload(Donation.cash),
                joinedload(Donation.inkind),
            )
            .filter(Donation.status == DonationStatus.COMPLETED)
            .order_by(Donation.donation_date.desc())
            .limit(limit)
            .all()
        )

        out = []
        for d in results:
            # Determine type; prefer explicit column but fall back to relationship presence
            donation_type = (
                DonationType(d.donation_type.upper()) 
                if d.donation_type 
                else DonationType.CASH if getattr(d, "CASH", None) else DonationType.INKIND if getattr(d, "INKIND", None) else None
            )

            # Cash details
            cash_amount = d.cash.amount if d.cash else None
            payment_method = d.cash.payment_method if d.cash else None

            # In-kind details
            estimated_value = d.inkind.estimated_value if d.inkind else None
            item_description = (d.inkind.item_description or d.inkind.description) if d.inkind else None
            quantity = d.inkind.quantity if d.inkind else None

            out.append({
                "donation_id": d.donation_id,
                "donation_date": d.donation_date,
                "donor_name": getattr(d.donor, "donor_name", None),
                "funding_title": getattr(d.proposal, "title", None),

                # Unified type + values
                "donation_type": donation_type,
                "amount": cash_amount if donation_type == DonationType.CASH else estimated_value,
                "payment_method": payment_method if donation_type == DonationType.CASH else None,
                "estimated_value": estimated_value if donation_type == DonationType.INKIND else None,
                "item_description": item_description if donation_type == DonationType.INKIND else None,
                "quantity": quantity if donation_type == DonationType.INKIND else None,

                # Enums: return name if present, else raw value/string
                "frequency": d.frequency.name if hasattr(d.frequency, "name") else d.frequency,
                "status": d.status.name if hasattr(d.status, "name") else d.status,
            })
        return out  
    
    @staticmethod
    def get_donor_aggregates(
        db: Session,
        donor_id: int,
        *,
        date_from: Optional[datetime] = None,
        date_to: Optional[datetime] = None,
        status: Optional[Union[DonationStatus, str, Sequence[Union[DonationStatus, str]]]] = None,
    ) -> dict:
        """
        Returns:
        {
            "total_cash": float,
            "total_inkind": float,
            "donation_count": int,
            "active_recurring_count": int
        }
        """

        # Normalize/coerce status -> list of DonationStatus (case-insensitive if strings are passed)
        def _coerce_status_list(s):
            if s is None:
                return None
            items = s if isinstance(s, (list, tuple, set)) else [s]
            out = []
            for it in items:
                if isinstance(it, DonationStatus):
                    out.append(it)
                else:
                    key = str(it).upper()
                    try:
                        out.append(DonationStatus[key])  # by name
                    except KeyError:
                        out.append(DonationStatus(str(it)))  # by value
            return out

        status_vals = _coerce_status_list(status)

        q = (
            db.query(
                # Sum cash amounts when type is CASH
                func.coalesce(
                    func.sum(
                        case(
                            (Donation.cash != None, Donation_Cash.amount),  # noqa: E711
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_cash"),
                # Sum estimated in-kind values when type is INKIND
                func.coalesce(
                    func.sum(
                        case(
                            (Donation.inkind != None, Donation_InKind.estimated_value),  # noqa: E711
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_inkind"),
                # Count donations after filters
                func.count(Donation.donation_id).label("donation_count"),
                # Active recurring = freq != ONE_TIME AND is_active = true
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    Donation.frequency != DonationFrequency.ONE_TIME,
                                    Donation.is_active.is_(True),
                                ),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("active_recurring_count"),
            )
            .outerjoin(Donation_Cash, Donation_Cash.donation_id == Donation.donation_id)
            .outerjoin(Donation_InKind, Donation_InKind.donation_id == Donation.donation_id)
            .filter(Donation.donor_id == donor_id)
        )

        if date_from is not None:
            q = q.filter(Donation.donation_date >= date_from)
        if date_to is not None:
            q = q.filter(Donation.donation_date <= date_to)
        if status_vals:
            q = q.filter(Donation.status.in_(status_vals))

        total_cash, total_inkind, donation_count, active_recurring_count = q.one()

        def _to_float(x):
            try:
                return float(x) if x is not None else 0.0
            except Exception:
                return 0.0

        return {
            "total_cash": _to_float(total_cash),
            "total_inkind": _to_float(total_inkind),
            "donation_count": int(donation_count or 0),
            "active_recurring_count": int(active_recurring_count or 0),
        }

    @staticmethod
    def get_donations_by_donor_id(
        db: Session,
        donor_id: str,
        limit: int = 100,
        page: int = 1,
        *,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        status: Optional[Sequence[DonationStatus]] = None,
        dtype: Optional[Sequence[DonationType]] = None,
    ):
        """
        Donation history for a single donor, with filters.
        """
        q = (
            db.query(Donation)
            .options(
                joinedload(Donation.cash),
                joinedload(Donation.inkind),
                joinedload(Donation.proposal),
            )
            .filter(Donation.donor_id == donor_id)
        )
                
        if date_from:
            q = q.filter(Donation.donation_date >= date_from)
        if date_to:
            adjusted_date_to = date_to + timedelta(days=1)
            q = q.filter(Donation.donation_date < adjusted_date_to)
        if status:
            q = q.filter(Donation.status.in_(status))
        if dtype:
            q = q.filter(Donation.donation_type.in_(dtype))

        offset = (page - 1) * limit

        db_donations = q.order_by(Donation.donation_date.desc()).limit(limit).offset(offset).all()
        responses = []
        for db_donation in db_donations:
            try:
                # Pydantic v2: read attributes from ORM object
                resp = DonationHistoryResponse.model_validate(db_donation, from_attributes=True)
            except AttributeError:
                # Fallback: older Pydantic v1 API
                resp = DonationHistoryResponse.from_orm(db_donation)
            responses.append(resp)

        return responses
    

def _add_months(orig: date, months: int) -> date:
    """Return date after adding `months` calendar months, clamping day to month length."""
    year = orig.year + (orig.month - 1 + months) // 12
    month = (orig.month - 1 + months) % 12 + 1
    day = min(orig.day, monthrange(year, month)[1])
    return date(year, month, day)
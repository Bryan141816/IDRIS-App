from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import NoResultFound, SQLAlchemyError
from sqlalchemy import extract, func, case, and_
from typing import Optional, Sequence, Union
from decimal import Decimal
from datetime import datetime, date, timezone, timedelta
from calendar import monthrange
from crud_functions.utils import random_suffix, uid_from_string, _to_enum, uid_from_string, rand_alnum
from crud_functions.donations_management.helpers import generate_donation_receipt
from crud_functions.finance_management.finance_crud import FinanceRecordCRUD
from data_schemas.donation_schema import DonationHistoryResponse
from pathlib import Path

from models import (
    Donor,
    Donation,
    DonationStatus,
    DonationFrequency,
    DonationType,
    Donation_Cash,
    Donation_InKind,
    FinanceRecord,
    InflowSource,
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
                est_val = getattr(donation_data, "amount", None)

                inkind = Donation_InKind(
                    donation_id=donation.donation_id,
                    inkind_id=uid_from_string(f"{donation.donation_id}{random_suffix(6)}"),
                    item_description=item_desc,
                )
                db.add(inkind)
                amount_for_finance = Decimal(str(est_val or 0)) if est_val is not None else Decimal("0")
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
            est_val = getattr(donation_data, "amount", None)
            inkind = Donation_InKind(
                donation_id=donation.donation_id,
                inkind_id=uid_from_string(f"{donation.donation_id}{random_suffix(6)}"),
                item_description=item_desc,
            )
            db.add(inkind)
            amount_for_finance = Decimal(str(est_val or 0))
            desc_for_finance = f"In-kind donation: {item_desc or 'items'}"

        db.commit()
        db.refresh(donation)
        return donation

    @staticmethod
    def cancel_donation_status(db: Session, donation_id: str) -> Donation:
        try:
            donation = (
                db.query(Donation)
                .options(joinedload(Donation.finance_record))
                .filter(Donation.donation_id == donation_id)
                .one()
            )

            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")

    @staticmethod
    def completed_donation_status(db: Session, donation_id: str) -> Donation:
        try:
            donation = (
                db.query(Donation)
                .options(
                    joinedload(Donation.finance_record),
                    joinedload(Donation.donor).joinedload(Donor.user),
                    joinedload(Donation.cash),
                )
                .filter(Donation.donation_id == donation_id)
                .one()
            )
            donation.status = DonationStatus.COMPLETED

            # Create Finance Record if not exists and not InKind
            if not donation.finance_record and donation.donation_type != DonationType.INKIND:
                amount_for_finance = Decimal("0")
                desc_for_finance = "Donation"

                if donation.donation_type == DonationType.CASH and donation.cash:
                    amount_for_finance = donation.cash.amount
                    desc_for_finance = "Cash donation"
                else:
                    # Handle cases where cash record might be missing or standard amount is used
                    # Fallback to checking 'amount' if it existed on Donation, but since it doesn't,
                    # we rely on donation.cash.amount.
                    # If donation type is CASH but donation.cash is None, amount is effectively 0.
                    pass

                donor_name = "Unknown Donor"
                if donation.donor:
                    donor_name = donation.donor.donor_name

                finance_date = (
                    donation.donation_date.date()
                    if donation.donation_date
                    else datetime.now(timezone.utc).date()
                )

                prefix = "RDON" if donation.frequency != DonationFrequency.ONE_TIME else "DON"

                finance = FinanceRecord(
                    finance_id=uid_from_string(f"{prefix}{random_suffix(8)}"),
                    counterparty=donor_name,
                    transaction_type=TransactionType.INFLOW,
                    donation_id=donation.donation_id,
                    amount=amount_for_finance,
                    date=finance_date,
                    purpose=desc_for_finance,
                    inflow_source=InflowSource.MONETARY_DONATIONS,
                )
                db.add(finance)
                db.flush()

                # Generate and attach receipt
                donation_details = {
                    "donation_id": donation.donation_id,
                    "donor_name": donor_name,
                    "amount": amount_for_finance,
                    "date": finance_date.strftime("%Y-%m-%d"),
                }
                receipt_path = generate_donation_receipt(donation_details)
                finance.attachment = receipt_path

            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error updating donation: {e}")

    @staticmethod
    def failed_donation_status(db: Session, donation_id: str) -> Donation:
        try:
            donation = (
                db.query(Donation)
                .options(joinedload(Donation.finance_record))
                .filter(Donation.donation_id == donation_id)
                .one()
            )
            donation.status = DonationStatus.FAILED

            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")
        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error updating donation: {e}")

    @staticmethod
    def get_donation_by_checkout_id(db: Session, checkout_id: str) -> Optional[Donation]:
        """
        Retrieves a donation record based on the PayMongo checkout session ID.
        """
        try:
            return db.query(Donation).filter(Donation.checkout_id == checkout_id).one_or_none()
        except SQLAlchemyError as e:
            # Log the error for debugging
            # logger.error(f"Database error fetching donation by checkout_id {checkout_id}: {e}")
            raise HTTPException(status_code=500, detail="Database error while fetching donation.")

    @staticmethod
    def get_donation_with_details_by_id(db: Session, donation_id: str) -> Optional[Donation]:
        """
        Retrieves a single donation with all its details, including donor and
        cash/inkind information, by its ID.
        """
        try:
            return (
                db.query(Donation)
                .options(
                    joinedload(Donation.donor).joinedload(Donor.user),
                    joinedload(Donation.cash),
                    joinedload(Donation.inkind),
                    joinedload(Donation.proposal),
                )
                .filter(Donation.donation_id == donation_id)
                .one_or_none()
            )
        except SQLAlchemyError as e:
            # logger.error(f"Database error fetching donation by id {donation_id}: {e}")
            raise HTTPException(status_code=500, detail="Database error while fetching donation.")

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

        total_expr = (cash_sum_expr).label("total")

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
    def get_donor_aggregates(
        db: Session,
        donor_id: str,
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

        total_cash, donation_count, active_recurring_count = q.one()

        def _to_float(x):
            try:
                return float(x) if x is not None else 0.0
            except Exception:
                return 0.0

        return {
            "total_cash": _to_float(total_cash),
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

    @staticmethod
    def get_all_donations(
        db: Session,
        limit: int = 100,
        page: int = 1,
        *,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        sort_by: str = "donation_date",
        order: str = "desc",
    ):
        """
        Donation history for all donors, with filters and pagination.
        """
        q = (
            db.query(Donation)
            .options(
                joinedload(Donation.cash),
                joinedload(Donation.inkind),
                joinedload(Donation.proposal),
                joinedload(Donation.donor),
            )
        )

        if date_from:
            q = q.filter(Donation.donation_date >= date_from)
        if date_to:
            adjusted_date_to = date_to + timedelta(days=1)
            q = q.filter(Donation.donation_date < adjusted_date_to)

        # Get total count before pagination
        total_count = q.count()

        # Sorting
        sort_column = getattr(Donation, sort_by, Donation.donation_date)
        if order == "asc":
            q = q.order_by(sort_column.asc())
        else:
            q = q.order_by(sort_column.desc())

        offset = (page - 1) * limit

        db_donations = q.limit(limit).offset(offset).all()

        responses = []

        for db_donation in db_donations:
            resp_dict = None

            # Try pydantic v2 style
            try:
                resp_model = DonationHistoryResponse.model_validate(
                    db_donation, from_attributes=True
                )
                resp_dict = resp_model.model_dump()
            except Exception:
                # Fallback to pydantic v1 / from_orm
                try:
                    resp_model = DonationHistoryResponse.from_orm(db_donation)
                    resp_dict = resp_model.dict()
                except Exception:
                    # Ultimate manual fallback: build a plain dict (helpful for debugging)
                    cash_obj = getattr(db_donation, "cash", None)
                    donor_obj = getattr(db_donation, "donor", None)

                    cash = None
                    if cash_obj is not None:
                        cash = {
                            "cash_id": getattr(cash_obj, "cash_id", None),
                            "amount": getattr(cash_obj, "amount", None),
                            "payment_method": getattr(cash_obj, "payment_method", None),
                        }

                    donor = None
                    if donor_obj is not None:
                        donor = {
                            "donor_id": getattr(donor_obj, "donor_id", None),
                            "donor_name": getattr(donor_obj, "donor_name", None),
                        }

                    resp_dict = {
                        "donation_id": getattr(db_donation, "donation_id", None),
                        "donor_id": getattr(db_donation, "donor_id", None),
                        "frequency": getattr(db_donation, "frequency", None),
                        "status": getattr(db_donation, "status", None),
                        "proposal_id": getattr(db_donation, "proposal_id", None),
                        "donation_date": getattr(db_donation, "donation_date", None),
                        "donation_type": getattr(db_donation, "donation_type", None),
                        "next_donation_date": getattr(db_donation, "next_donation_date", None),
                        "end_date": getattr(db_donation, "end_date", None),
                        "is_active": getattr(db_donation, "is_active", None),
                        "cash": cash,
                        "inkind": getattr(db_donation, "inkind", None),
                        "donor": donor,
                    }

            responses.append(resp_dict)

        # debug: optional
        print("Returning donation count:", len(responses), "total_count:", total_count)

        return {"donations": responses, "total": total_count}

    @staticmethod
    def get_donation_by_id(db: Session, donation_id: str):
        """
        Get a single donation by its ID, with related details.
        """
        try:
            donation = (
                db.query(Donation)
                .options(
                    joinedload(Donation.cash),
                    joinedload(Donation.inkind),
                    joinedload(Donation.proposal),
                    joinedload(Donation.donor),
                )
                .filter(Donation.donation_id == donation_id)
                .one()
            )
            return donation
        except NoResultFound:
            raise HTTPException(status_code=404, detail="Donation not found")

def _add_months(orig: date, months: int) -> date:
    """Return date after adding `months` calendar months, clamping day to month length."""
    year = orig.year + (orig.month - 1 + months) // 12
    month = (orig.month - 1 + months) % 12 + 1
    day = min(orig.day, monthrange(year, month)[1])
    return date(year, month, day)
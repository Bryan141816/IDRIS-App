from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import NoResultFound, SQLAlchemyError
from sqlalchemy import extract, func

from crud_functions.utils import _to_enum, uid_from_string, rand_alnum

from models import (
    Donation,
    DonationStatus,
    DonationFrequency,
    Donation_Cash,
    Donation_InKind
)

from data_schemas.donation_schema import (
    DonationCreate,
    RecurringDonationCreate,
    InKindDonationCreate,
)

# --- CRUD --------------------------------------------------------------------
class DonationCRUD:
    # --- CREATE ---
    @staticmethod
    def create_one_time_pending_donation(db: Session, donation_data) -> Donation:
        # Create a ONE_TIME PENDING donation and its child record:
        
        # 1) Resolve frequency (default ONE_TIME)
        frequency = _to_enum(
            DonationFrequency,
            getattr(donation_data, "frequency", None) or getattr(donation_data, "donation_type", None),
            default=DonationFrequency.ONE_TIME,
        )

        # 2) Resolve donation_type string (cash | inkind)
        raw_kind = (
            getattr(donation_data, "donation_kind", None)
            or getattr(donation_data, "donation_type", None)
            or "cash"
        )
        donation_type = str(raw_kind).lower().strip()
        if donation_type not in {"cash", "inkind"}:
            donation_type = "cash"

        # Basic presence checks (optional; keep or remove as you like)
        if not getattr(donation_data, "donor_id", None):
            raise HTTPException(status_code=422, detail="donor_id is required")
        # proposal_id can be None if donation not tied to a proposal
        # else validate it exists if that’s a rule in your app.

        try:
            # 3) Create parent Donation (no amount/description/payment_method on parent)
            donation = Donation(
                donor_id=donation_data.donor_id,
                proposal_id=getattr(donation_data, "proposal_id", None),
                frequency=frequency,
                status=DonationStatus.PENDING,
                donation_type=donation_type,
                # one-time has no schedule
                next_donation_date=None,
                end_date=None,
                is_active=False,
                # donation_date server_default=now() on the model; omit here
            )

            custom_id = uid_from_string(f"{rand_alnum()}")
            donation.donation_id = custom_id
            
            db.add(donation)
            db.flush()  # get donation.donation_id for child rows

            # 4) Create child row based on donation_type
            if donation_type == "cash":
                cash = Donation_Cash(
                    donation_id=donation.donation_id,
                    amount=getattr(donation_data, "amount", None),                # Decimal/float OK; DB column is Numeric
                    payment_method=getattr(donation_data, "payment_method", None)
                )
                db.add(cash)
            else:  # "inkind"
                # Map fields robustly:
                item_desc = getattr(donation_data, "item_description", None) or getattr(donation_data, "description", None)
                est_val = getattr(donation_data, "estimated_value", None)
                if est_val is None:
                    # allow legacy `amount` for inkind estimated value
                    est_val = getattr(donation_data, "amount", None)

                inkind = Donation_InKind(
                    donation_id=donation.donation_id,
                    item_description=item_desc,
                    description=getattr(donation_data, "description", None),
                    estimated_value=est_val,
                    quantity=getattr(donation_data, "quantity", None),
                )
                db.add(inkind)

            # 5) Commit and refresh with children
            db.commit()
            db.refresh(donation)  # relationships lazy-load; refresh parent state

            return donation

        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Database error creating donation: {e}")
    
    @staticmethod
    def create_recurring_donation(db: Session, donation_data: RecurringDonationCreate) -> Donation:
        """
        Maps:
          - donation_type/recurring_frequency -> frequency
          - recurring_end_date -> end_date
        Forces 'kind' = "cash".
        """
        # Prefer explicit recurring_frequency; fall back to donation_type; else MONTHLY
        freq_source = (
            getattr(donation_data, "recurring_frequency", None)
            or getattr(donation_data, "donation_type", None)
            or DonationFrequency.MONTHLY
        )
        frequency = _to_enum(DonationFrequency, freq_source, default=DonationFrequency.MONTHLY)

        donation = Donation(
            donor_id=donation_data.donor_id,
            proposal_id=donation_data.proposal_id,
            frequency=frequency,
            amount=donation_data.amount,
            description=donation_data.description,
            status=DonationStatus.PENDING,
            kind="cash",
            next_donation_date=donation_data.next_donation_date,
            end_date=getattr(donation_data, "recurring_end_date", None),
            is_active=True,
            payment_method=donation_data.payment_method,
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        return donation

    @staticmethod
    def create_inkind_donation(db: Session, donation_data: InKindDonationCreate) -> Donation:
        """
        Maps:
          - donation_type -> frequency (default ONE_TIME)
        Forces 'kind' = "inkind".
        """
        frequency = _to_enum(
            DonationFrequency,
            getattr(donation_data, "donation_type", None),
            default=DonationFrequency.ONE_TIME,
        )

        donation = Donation(
            donor_id=donation_data.donor_id,
            proposal_id=donation_data.proposal_id,
            frequency=frequency,
            amount=None,  # in-kind has no direct cash amount
            description=donation_data.description,
            status=DonationStatus.PENDING,
            kind="inkind",
            item_description=donation_data.item_description,
            estimated_value=donation_data.estimated_value,
            quantity=donation_data.quantity,
            # in-kind not recurring by default; adjust if you support recurring in-kind
            next_donation_date=None,
            end_date=None,
            is_active=False,
            payment_method=None,
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        return donation

    # --- STATUS UPDATES ---

    @staticmethod
    def cancel_donation_status(db: Session, donation_id: int) -> Donation:
        try:
            donation = db.query(Donation).filter(Donation.id == donation_id).one()
            donation.status = DonationStatus.CANCELLED
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")

    @staticmethod
    def completed_donation_status(db: Session, donation_id: int) -> Donation:
        try:
            donation = db.query(Donation).filter(Donation.id == donation_id).one()
            donation.status = DonationStatus.COMPLETED
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError("Donation record does not exist")

    @staticmethod
    def failed_donation_status(db: Session, donation_id: int) -> Donation:
        try:
            donation = db.query(Donation).filter(Donation.id == donation_id).one()
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
            donation_type = d.donation_type or ("cash" if d.cash else "inkind" if d.inkind else None)

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
                "amount": cash_amount if donation_type == "cash" else estimated_value,
                "payment_method": payment_method if donation_type == "cash" else None,
                "estimated_value": estimated_value if donation_type == "inkind" else None,
                "item_description": item_description if donation_type == "inkind" else None,
                "quantity": quantity if donation_type == "inkind" else None,

                # Enums: return name if present, else raw value/string
                "frequency": d.frequency.name if hasattr(d.frequency, "name") else d.frequency,
                "status": d.status.name if hasattr(d.status, "name") else d.status,
            })
        return out  
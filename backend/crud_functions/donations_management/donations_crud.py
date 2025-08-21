from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from sqlalchemy import extract, func

from models import (
    Donation,
    DonationStatus,
    DonationFrequency,
)

from data_schemas.donation_schema import (
    DonationCreate,
    RecurringDonationCreate,
    InKindDonationCreate,
)


# --- helpers -----------------------------------------------------------------

def _to_enum(enum_cls, value, default=None):
    """
    Safely coerce strings/Enums/None into the target Enum type.
    - Accepts actual Enum instances, their .name/.value strings, or None.
    """
    if value is None:
        return default
    if isinstance(value, enum_cls):
        return value
    # try by name
    try:
        return enum_cls[value]  # e.g. "ONE_TIME" -> DonationFrequency.ONE_TIME
    except Exception:
        pass
    # try by value (e.g. passing "ONE_TIME" when value==name)
    try:
        return enum_cls(value)
    except Exception:
        pass
    if default is not None:
        return default
    raise ValueError(f"Invalid enum value '{value}' for {enum_cls.__name__}")


# --- CRUD --------------------------------------------------------------------

class DonationCRUD:
    # --- CREATE ---

    @staticmethod
    def create_one_time_pending_donation(db: Session, donation_data: DonationCreate) -> Donation:
        """
        Maps:
          - donation_type -> frequency (force ONE_TIME if not provided)
          - donation_kind -> kind ("cash" | "inkind")
        """
        frequency = _to_enum(
            DonationFrequency,
            getattr(donation_data, "donation_type", None),
            default=DonationFrequency.ONE_TIME,
        )

        kind = getattr(donation_data, "donation_kind", "cash") or "cash"

        donation = Donation(
            donor_id=donation_data.donor_id,
            proposal_id=donation_data.proposal_id,
            frequency=frequency,
            amount=(donation_data.amount if kind == "cash" else None),
            description=donation_data.description,
            status=DonationStatus.PENDING,   # Enum (not string)
            kind=kind,
            # one-time has no schedule
            next_donation_date=None,
            end_date=None,
            is_active=False,
            payment_method=donation_data.payment_method,
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        return donation

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
        Returns total value (cash + estimated in-kind) filtered by year/month for COMPLETED donations.
        """
        filters = [
            extract("year", Donation.donation_date) == year,
            Donation.status == DonationStatus.COMPLETED,
        ]
        if month is not None:
            filters.append(extract("month", Donation.donation_date) == month)

        total = db.query(
            func.coalesce(func.sum(Donation.amount), 0) +
            func.coalesce(func.sum(Donation.estimated_value), 0)
        ).filter(*filters).scalar()

        return total

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
        Recent COMPLETED donations with donor name & proposal title.
        """
        results = (
            db.query(Donation)
            .join(Donation.donor)
            .join(Donation.proposal, isouter=True)
            .filter(Donation.status == DonationStatus.COMPLETED)
            .order_by(Donation.donation_date.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "donation_date": r.donation_date,
                "donor_name": (r.donor.donor_name if getattr(r, "donor", None) else None),
                "funding_title": (r.proposal.title if getattr(r, "proposal", None) else None),
                "kind": r.kind,
                "amount": (r.amount if r.kind == "cash" else r.estimated_value),
                "item_description": (r.item_description if r.kind == "inkind" else None),
                "frequency": r.frequency.name if hasattr(r.frequency, "name") else r.frequency,
                "status": r.status.name if hasattr(r.status, "name") else r.status,
            }
            for r in results
        ]

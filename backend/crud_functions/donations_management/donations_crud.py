from sqlalchemy.orm import Session
from sqlalchemy.exc import NoResultFound
from sqlalchemy import extract, func
from models import DonationRecords, DonationStatus
from data_schemas.donation_schema import DonationCreate, RecurringDonationCreate, InKindDonationCreate

class DonationCRUD:
    @staticmethod
    def create_one_time_pending_donation(db: Session, donation_data: DonationCreate) -> DonationRecords:
        donation = DonationRecords(
            donor_id=donation_data.donor_id,
            donation_type=donation_data.donation_type,
            amount=donation_data.amount,
            description=donation_data.description,
            proposal_id=donation_data.proposal_id,
            donation_kind=donation_data.donation_kind,
            payment_method=donation_data.payment_method,
            status=DonationStatus.PENDING.value,
            is_active_recurring=False  # One-time only
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        return donation

    @staticmethod
    def create_recurring_donation(db: Session, donation_data: RecurringDonationCreate) -> DonationRecords:
        new_donation = DonationRecords(
            donor_id=donation_data.donor_id,
            proposal_id = donation_data.proposal_id,
            donation_type=donation_data.donation_type,
            amount=donation_data.amount,
            description=donation_data.description,
            status=DonationStatus.PENDING,
            donation_kind="cash",  # force "cash"
            recurring_frequency=donation_data.recurring_frequency,
            next_donation_date=donation_data.next_donation_date,
            recurring_end_date=donation_data.recurring_end_date,
            is_active_recurring=True,
            payment_method=donation_data.payment_method
        )
        db.add(new_donation)
        db.commit()
        db.refresh(new_donation)
        return new_donation

    @staticmethod
    def create_inkind_donation(db: Session, donation_data: InKindDonationCreate) -> DonationRecords:
        new_donation = DonationRecords(
            donor_id=donation_data.donor_id,
            proposal_id = donation_data.proposal_id,
            donation_type=donation_data.donation_type,
            amount=None,  # In-kind has no direct amount
            description=donation_data.description,
            status=DonationStatus.PENDING,
            donation_kind="inkind",  # force inkind type
            item_description=donation_data.item_description,
            estimated_value=donation_data.estimated_value,
            quantity=donation_data.quantity,
            is_active_recurring=False  # Not applicable to in-kind
        )
        db.add(new_donation)
        db.commit()
        db.refresh(new_donation)
        return new_donation

    @staticmethod
    def cancel_donation_status(db: Session, donation_id: int) -> DonationRecords:
        try:
            donation = db.query(DonationRecords).filter(DonationRecords.donationRecordId == donation_id).one()
            donation.status = DonationStatus.CANCELLED.value
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError(f"Donation record does not exist")
    
    @staticmethod
    def completed_donation_status(db: Session, donation_id: int) -> DonationRecords:
        try:
            donation = db.query(DonationRecords).filter(DonationRecords.donationRecordId == donation_id).one()
            donation.status = DonationStatus.COMPLETED.value
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError(f"Donation record does not exist")

    @staticmethod
    def failed_donation_status(db: Session, donation_id: int) -> DonationRecords:
        try:
            donation = db.query(DonationRecords).filter(DonationRecords.donationRecordId == donation_id).one()
            donation.status = DonationStatus.FAILED.value
            db.commit()
            db.refresh(donation)
            return donation
        except NoResultFound:
            raise ValueError(f"Donation record does not exist")
        
    @staticmethod
    def get_total_donations(db: Session, year: int, month: int | None = None):
        """Returns total donation amount filtered by year and optionally by month."""
        query = db.query(func.coalesce(func.sum(DonationRecords.amount), 0)).filter(
            extract('year', DonationRecords.donation_date) == year,
            DonationRecords.status == 'COMPLETED'
        )            

        filters = [
            extract('year', DonationRecords.donation_date) == year,
            DonationRecords.status == 'COMPLETED'
        ]
        
        if month is not None:
            filters.append(extract('month', DonationRecords.donation_date) == month)

        total = db.query(
            func.coalesce(func.sum(DonationRecords.amount), 0) +
            func.coalesce(func.sum(DonationRecords.estimated_value), 0)
        ).filter(*filters).scalar()
        
        return total

    @staticmethod
    def get_donor_retention_by_year(db: Session, year: int):
        """
        Calculate donor retention: % of donors from (year - 1) who donated again in `year`.
        """
        prev_year = year - 1

        # Donors who gave in previous year
        prev_year_donors = db.query(DonationRecords.donor_id).filter(
            func.extract('year', DonationRecords.donation_date) == prev_year,
            DonationRecords.status == 'COMPLETED'
        ).distinct().subquery()

        # Donors from previous year who also gave in current year
        retained_donors = db.query(DonationRecords.donor_id).filter(
            func.extract('year', DonationRecords.donation_date) == year,
            DonationRecords.status == 'COMPLETED',
            DonationRecords.donor_id.in_(db.query(prev_year_donors.c.donor_id))
        ).distinct().count()

        total_prev_donors = db.query(prev_year_donors).count()

        return {
            "total_donors_last_year": total_prev_donors,
            "retained_donors": retained_donors,
            "retention_rate": round((retained_donors / total_prev_donors) * 100, 2) if total_prev_donors else 0.0
        }

    @staticmethod
    def get_donations_with_details(db: Session, limit: int = 10):
        """
        Get recent donations with donation_date, donor name, and funding proposal title.
        """
        results = (
            db.query(DonationRecords)
            .join(DonationRecords.donor)
            .join(DonationRecords.proposal, isouter=True)
            .filter(DonationRecords.status == DonationStatus.COMPLETED)
            .order_by(DonationRecords.donation_date.desc())
            .limit(limit)
            .all()
        )

        return [
            {
                "donation_date": r.donation_date,
                "donor_name": r.donor.donor_name,
                "funding_title": r.proposal.title if r.proposal else None,
                "donation_kind": r.donation_kind,
                "amount": r.amount if r.donation_kind == "cash" else r.estimated_value,
                "item_description": r.item_description if r.donation_kind == "inkind" else None,
            }
            for r in results
        ]

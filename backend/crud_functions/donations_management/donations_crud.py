from sqlalchemy.orm import Session
from sqlalchemy import extract, func
from models import DonationRecords, DonationStatus
from data_schemas.donation_schema import DonationCreate
from datetime import datetime, timedelta

class DonationCRUD:
    @staticmethod
    def create_one_time_donation(db: Session, donation_data: DonationCreate) -> DonationRecords:
        donation = DonationRecords(
            donor_id=donation_data.donor_id,
            donation_type=donation_data.donation_type,
            amount=donation_data.amount,
            description=donation_data.description,
            proposal_id=donation_data.proposal_id,
            donation_kind=donation_data.donation_kind,
            payment_method=donation_data.payment_method,
            status=DonationStatus.COMPLETED.value,
            is_active_recurring=False  # One-time only
        )
        db.add(donation)
        db.commit()
        db.refresh(donation)
        return donation

    @staticmethod
    def get_total_donations(db: Session, year: int, month: int | None = None):
        """Returns total donation amount filtered by year and optionally by month."""
        query = db.query(func.coalesce(func.sum(DonationRecords.amount), 0)).filter(
            extract('year', DonationRecords.donation_date) == year,
            DonationRecords.status == 'COMPLETED'
        )

        if month is not None:
            query = query.filter(extract('month', DonationRecords.donation_date) == month)

        total = query.scalar()
        return total

    @staticmethod
    def get_donor_retention_by_year(db: Session, year: int):
        """
        Calculate donor retention: % of donors from (year - 1) who donated again in `year`.
        """
        prev_year = year - 1

        # Donors who gave in previous year
        prev_year_donors = db.query(DonationRecords.donor_id).filter(
            func.extract('year', DonationRecords.donation_date) == prev_year
        ).distinct().subquery()

        # Donors from previous year who also gave in current year
        retained_donors = db.query(DonationRecords.donor_id).filter(
            func.extract('year', DonationRecords.donation_date) == year,
            DonationRecords.donor_id.in_(db.query(prev_year_donors.c.donor_id))
        ).distinct().count()

        total_prev_donors = db.query(prev_year_donors).count()

        return {
            "total_donors_last_year": total_prev_donors,
            "retained_donors": retained_donors,
            "retention_rate": round((retained_donors / total_prev_donors) * 100, 2) if total_prev_donors else 0.0
        }

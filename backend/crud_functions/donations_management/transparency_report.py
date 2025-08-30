from sqlalchemy import extract
from sqlalchemy.orm import Session
from models import Donation, Donation_Cash, Donation_InKind, Donor, DonationType
from data_schemas.transparency_report_schema import (
    CashTransparencyResponseSchema,
)
from pathlib import Path
from typing import List

UPLOAD_DIR = Path("media/transparency_reports")


class TransparencyReportCRUD:
    @staticmethod
    def get_inkind_monthly_donations(db: Session, month: int, year: int) -> List[CashTransparencyResponseSchema]:
        # Query donations and join related tables, including the Donation_Cash amount
        donations = db.query(
            Donation,
        ).filter(
            extract('month', Donation.donation_date) == month,
            extract('year', Donation.donation_date) == year,
            Donation.donation_type == DonationType.CASH
        ).join(Donation_InKind, Donation_InKind.donation_id == Donation.donation_id, isouter=True) \
        .join(Donor, Donor.donor_id == Donation.donor_id) \
        .all()

        # Map results into the response model (CashTransparencyResponseSchema)
        donation_responses = []
        for donation in donations:
            
            donation_date = donation.donation_date.date() if donation.donation_date else None
            # Create a response schema for each donation, combining donation details and cash_amount
            donation_responses.append(
                CashTransparencyResponseSchema(
                    id=donation.donation_id,
                    donation_date=donation_date,
                    amount=float(donation.inkind.estimated_value or 0),  # Ensure amount is a float and defaults to 0 if None
                    donor_name=donation.donor.donor_name if donation.donor.donor_name else "Anonymous",
                    status=donation.status,
                    donation_type=donation.donation_type,
                )
            )

        return donation_responses
        
    def get_cash_monthly_donations(db: Session, month: int, year: int) -> List[CashTransparencyResponseSchema]:
        # Query donations and join related tables, including the Donation_Cash amount
        donations = db.query(
            Donation,
        ).filter(
            extract('month', Donation.donation_date) == month,
            extract('year', Donation.donation_date) == year,
            Donation.donation_type == DonationType.CASH
        ).join(Donation_Cash, Donation_Cash.donation_id == Donation.donation_id, isouter=True) \
        .join(Donor, Donor.donor_id == Donation.donor_id) \
        .all()

        # Map results into the response model (CashTransparencyResponseSchema)
        donation_responses = []
        for donation in donations:
            
            donation_date = donation.donation_date.date() if donation.donation_date else None
            # Create a response schema for each donation, combining donation details and cash_amount
            donation_responses.append(
                CashTransparencyResponseSchema(
                    id=donation.donation_id,
                    donation_date=donation_date,
                    amount=float(donation.cash.amount or 0),  # Ensure amount is a float and defaults to 0 if None
                    donor_name=donation.donor.donor_name if donation.donor.donor_name else "Anonymous",
                    status=donation.status,
                    donation_type=donation.donation_type,
                )
            )

        return donation_responses

from sqlalchemy.orm import Session, joinedload
import models
from data_schemas.donation_receipt_schema import DonationReceiptSchema, DonorDetailsSchema, DonationDetailsSchema

from sqlalchemy.orm import joinedload
from sqlalchemy import select
from typing import Optional

from data_schemas.donation_receipt_schema import DonationReceiptSchema, DonationDetailsSchema, DonorDetailsSchema
from sqlalchemy.orm import Session

def _extract_amount_from_donation(donation: models.Donation) -> Optional[float]:
    if getattr(donation, "cash", None) is not None:
        amt = getattr(donation.cash, "amount", None)
        if amt is not None:
            return float(amt)

    if getattr(donation, "finance_record", None) is not None:
        amt = getattr(donation.finance_record, "amount", None)
        if amt is not None:
            return float(amt)

    if hasattr(donation, "amount"):
        amt = getattr(donation, "amount")
        if amt is not None:
            return float(amt)

    return None


def _extract_names_from_donor(donor: models.Donor):
    first_name = None
    last_name = None
    email = None

    user = getattr(donor, "user", None)
    if user is not None:
        email = getattr(user, "email", None)
        user_profile = getattr(user, "user_profile", None)
        if user_profile is not None:
            first_name = getattr(user_profile, "first_name", None)
            last_name = getattr(user_profile, "last_name", None)

        if not first_name and getattr(user, "username", None):
            username = user.username.strip()
            parts = username.split(None, 1)
            if len(parts) == 1:
                first_name = parts[0]
            else:
                first_name, last_name = parts[0], parts[1]

    return first_name, last_name, email


def get_donation_receipt_data(db: Session, donation_id: str) -> Optional[DonationReceiptSchema]:
    donation = (
        db.query(models.Donation)
        .options(
            joinedload(models.Donation.donor)
            .joinedload(models.Donor.user)
            .joinedload(getattr(models.User, "user_profile", None)),
            joinedload(models.Donation.cash),
            joinedload(models.Donation.finance_record),
        )
        .filter(models.Donation.donation_id == donation_id)
        .first()
    )

    if not donation:
        return None

    amount = _extract_amount_from_donation(donation)

    donation_payload = {
        "donation_id": getattr(donation, "donation_id"),
        "donor_id": getattr(donation, "donor_id", None),
        "amount": amount,
        "donation_type": getattr(donation, "donation_type", None),
        "status": getattr(donation, "status", None),
        "created_at": getattr(donation, "donation_date", getattr(donation, "created_at", None)),
    }

    donation_details = DonationDetailsSchema(**donation_payload)

    donor = getattr(donation, "donor", None)
    if donor is None:
        donor_details = DonorDetailsSchema(donor_id=None, first_name=None, last_name=None, email=None)
    else:
        first_name, last_name, email = _extract_names_from_donor(donor)
        donor_payload = {
            "donor_id": getattr(donor, "donor_id", None),
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
        }
        donor_details = DonorDetailsSchema(**donor_payload)

    return DonationReceiptSchema(donation=donation_details, donor=donor_details)
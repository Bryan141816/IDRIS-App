from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import date

class CashTransparencyResponseSchema(BaseModel):
    id: int
    donation_date: date
    amount: float
    donor_name: str
    status: str
    donation_type: str

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    def set_attributes(cls, values):
        # Check if the values contain a SQLAlchemy model or just a dict
        if isinstance(values, dict):
            return values  # If it's a dict, it’s probably from Pydantic's normal parsing
        
        donation = values  # This will be the SQLAlchemy model (Donation)

        # Manually assign values from the SQLAlchemy object
        return {
            "id": donation.donation_id,
            "donation_date": donation.donation_date.date() if donation.donation_date else None,
            "amount": (
                donation.cash.amount if donation.donation_type == "cash" and donation.cash else
                donation.inkind.estimated_value if donation.donation_type == "inkind" and donation.inkind else 0.0
            ),
            "donor_name": (
                donation.donor.donor_name if donation.donor else "Anonymous"
            ),
            "status": donation.status,
            "donation_type": donation.donation_type,
        }

# Assuming TransparencyCashSchema is defined somewhere as:
class TransparencyCashSchema(BaseModel):
    amount: float
    payment_method: str  # Example field
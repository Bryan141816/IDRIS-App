from sqlalchemy.orm import Session, joinedload
import models
from data_schemas.finance_receipt_schema import FinanceReceiptSchema, DonorDetailsSchema, FinanceRecordDetailsSchema
from typing import Optional

def get_finance_receipt_data(db: Session, finance_id: str) -> Optional[FinanceReceiptSchema]:
    finance_record = (
        db.query(models.FinanceRecord)
        .options(
            joinedload(models.FinanceRecord.donation)
            .joinedload(models.Donation.donor)
            .joinedload(models.Donor.user)
            .joinedload(models.User.user_profile)
        )
        .filter(models.FinanceRecord.finance_id == finance_id)
        .first()
    )

    if not finance_record:
        return None

    donation = finance_record.donation
    donor = donation.donor if donation else None
    user = donor.user if donor else None
    user_profile = user.user_profile if user else None

    donor_details = DonorDetailsSchema(
        donor_id=donor.donor_id if donor else None,
        first_name=user_profile.first_name if user_profile else None,
        last_name=user_profile.last_name if user_profile else None,
        email=user.email if user else None,
    )

    finance_record_details = FinanceRecordDetailsSchema(
        finance_id=finance_record.finance_id,
        amount=finance_record.amount,
        inflow_source=finance_record.inflow_source.value if finance_record.inflow_source else None,
        date=finance_record.date,
    )

    return FinanceReceiptSchema(finance_record=finance_record_details, donor=donor_details)

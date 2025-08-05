from datetime import timezone
from enum import unique
from typing import Counter
from sqlalchemy import (
    Column,
    Boolean,
    Integer,
    String,
    DateTime,
    ForeignKey,
    CheckConstraint,
    func,
    Enum as SqlEnum,
    Numeric,
    Date,
    Text,
    Float,
)
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
from sqlalchemy.ext.hybrid import hybrid_property
from database import Base
import enum


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_type = Column(String)
    roles = Column(JSON, default=[])

    # Fixed relationship - should reference the correct foreign key
    donor_profile = relationship("Donors", back_populates="user")


# LGU Profiling
class EvacuationCenter(Base):
    __tablename__ = "evacuation_center"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)


class ResponseReport(Base):
    __tablename__ = "response_reports"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    report_type = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)


class DemandAndResponse(Base):
    __tablename__ = "demand_and_response"

    id = Column(Integer, primary_key=True, index=True)
    title_lable = Column(String(255), nullable=False)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String(255), nullable=False)
    needs = Column(JSON, default=[])
    priority = Column(String(255), nullable=False)
    submitted_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_updated = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class ModalityDistribution(Base):
    __tablename__ = "modality_distribution"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    modality_type = Column(String(255), nullable=False)


class InKindMonitoring(Base):
    __tablename__ = "inkind_monitoring"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    quantity = Column(Integer, default=0, nullable=False)
    record_type = Column(String(255), nullable=False)


class ResponseReportBudget(Base):
    __tablename__ = "response_report_budget"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    budget_record_type = Column(String(255), nullable=False)
    total_amount = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)


# ------------------ DONATIONS MANAGEMENT MODELS


class FundingProposals(Base):
    __tablename__ = "funding_proposals"

    proposalId = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    progress = Column(Integer, default=0, nullable=False)  # UNUSED
    budgetRequired = Column(Integer, nullable=False)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    status = Column(String(50), nullable=False)
    image = Column(String, nullable=True)

    # Added missing relationship
    donations = relationship("DonationRecords", back_populates="proposal")


class Donors(Base):
    __tablename__ = "donors"

    donorId = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    donor_type = Column(String(20), nullable=False)
    organization_name = Column(
        String(255), nullable=True
    )  # Nullable for individual donors
    is_verified = Column(Boolean, nullable=False, default=False)

    # Updated relationships
    donations = relationship("DonationRecords", back_populates="donor")

    date_joined = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_updated = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user = relationship("User", back_populates="donor_profile")

    @property
    def donor_name(self):
        if self.donor_type == "organization" and self.organization_name:
            return self.organization_name
        elif self.user:
            return self.user.username
        return "Unknown Donor"


class TransparencyReports(Base):
    __tablename__ = "transparency_report"

    transparency_id = Column(Integer, primary_key=True, index=True)
    file = Column(String, nullable=False)
    file_name = Column(String(50), nullable=False)
    date_issued = Column(DateTime(timezone=True), nullable=False)

    date_uploaded = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    date_updated = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class DonationType(enum.Enum):
    ONE_TIME = "ONE_TIME"
    RECURRING = "RECURRING"


class DonationStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class DonationRecords(Base):
    __tablename__ = "donation_records"

    # Primary key should come first
    donationRecordId = Column(Integer, primary_key=True, index=True)

    # Core attributes - FIXED
    donor_id = Column(Integer, ForeignKey("donors.donorId"), nullable=False)
    donation_type = Column(SqlEnum(DonationType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)  # Nullable for in-kind donations
    description = Column(String(255), nullable=True)
    status = Column(
        SqlEnum(DonationStatus), nullable=False, default=DonationStatus.PENDING
    )

    # Additional fields
    proposal_id = Column(
        Integer, ForeignKey("funding_proposals.proposalId"), nullable=True
    )
    donation_date = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    donation_kind = Column(
        String(20), nullable=False, default="cash"
    )  # "cash" or "inkind"

    # In-kind donation fields
    item_description = Column(
        String, nullable=True
    )  # Description of donated items/services
    estimated_value = Column(
        Numeric(10, 2), nullable=True
    )  # Estimated monetary value of in-kind donation
    quantity = Column(String(50), nullable=True)  # Quantity/units of donated items

    # Recurring donation fields
    recurring_frequency = Column(
        String(20), nullable=True
    )  # "monthly", "quarterly", "yearly"
    next_donation_date = Column(DateTime(timezone=True), nullable=True)
    recurring_end_date = Column(DateTime(timezone=True), nullable=True)
    is_active_recurring = Column(Boolean, nullable=True, default=True)

    payment_method = Column(String(50), nullable=True)

    # Fixed relationships
    donor = relationship("Donors", back_populates="donations")
    proposal = relationship("FundingProposals", back_populates="donations")

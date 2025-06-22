from datetime import timezone
from enum import unique
from sqlalchemy import Column, Boolean, Integer, String, DateTime, ForeignKey, CheckConstraint, func, Enum, Numeric, Date, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
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
    donor_profile = relationship("Donors", back_populates="user_profile")
    
class ResponseReport(Base):
    __tablename__ = "response_reports"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    report_type = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)

class ModalityDistribution(Base):
    __tablename__ = "modality_distribution"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    modality_type = Column(String(255), nullable=False)

class ResponseReportBudget(Base):
    __tablename__ = "response_report_budget"

    id = Column(Integer, primary_key=True, index=True)
    date_time = Column(DateTime(timezone=True),server_default=func.now(), nullable=False)
    budget_record_type = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)

class FundingProposals(Base):
    __tablename__ = "funding_proposals"

    proposalId = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    progress = Column(Integer, default=0, nullable=False) 
    budgetRequired = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    status = Column(String(50), nullable=False)
    image = Column(String, nullable=True)
    
    # Added missing relationship
    donations = relationship("DonationRecords", back_populates="proposal")

class Organization(Base):
    __tablename__ = "organizations"

    organizationId = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    phone_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    
    date_created = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Fixed relationship name and reference
    donor_profile = relationship("Donors", back_populates="organization_profile")
    
class Donors(Base):
    __tablename__ = "donors" 
        
    donorId = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    organization_id = Column(Integer, ForeignKey("organizations.organizationId"), nullable=True)
    name = Column(String(255))
    donor_type = Column(String(20), nullable=False)
    is_verified = Column(Boolean, nullable=False, default=False)
    
    # Fixed relationships
    user_profile = relationship("User", back_populates="donor_profile")
    organization_profile = relationship("Organization", back_populates="donor_profile")
    donations = relationship("DonationRecords", back_populates="donor")
    
    date_joined = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    

class DonationType(enum.Enum):
    ONE_TIME = "one-time"
    RECURRING = "recurring"

class DonationStatus(enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class DonationRecords(Base):
    __tablename__ = "donation_records"
    
    # Primary key should come first
    donationRecordId = Column(Integer, primary_key=True, index=True)
    
    # Core attributes - FIXED: Changed to match actual column name in Donors table
    donor_id = Column(Integer, ForeignKey("donors.donorId"), nullable=False)
    donation_type = Column(Enum(DonationType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=True)  # Nullable for in-kind donations
    description = Column(Text, nullable=True)
    date_received = Column(Date, nullable=False)
    status = Column(Enum(DonationStatus), nullable=False, default=DonationStatus.PENDING)
    
    # Additional fields
    proposal_id = Column(Integer, ForeignKey("funding_proposals.proposalId"), nullable=True)
    donation_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    donation_kind = Column(String(20), nullable=False, default="cash")  # "cash" or "inkind"
    
    # In-kind donation fields
    item_description = Column(String, nullable=True)  # Description of donated items/services
    estimated_value = Column(Numeric(10, 2), nullable=True)  # Estimated monetary value of in-kind donation
    quantity = Column(String(50), nullable=True)  # Quantity/units of donated items
    
    # Recurring donation fields
    recurring_frequency = Column(String(20), nullable=True)  # "monthly", "quarterly", "yearly"
    next_donation_date = Column(DateTime(timezone=True), nullable=True)
    recurring_end_date = Column(DateTime(timezone=True), nullable=True)
    is_active_recurring = Column(Boolean, nullable=True, default=True)
    
    payment_method = Column(String(50), nullable=True)
    notes = Column(String, nullable=True)
    
    # Fixed relationships
    donor = relationship("Donors", back_populates="donations")
    proposal = relationship("FundingProposals", back_populates="donations")

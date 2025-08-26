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
    func,
    Enum as SqlEnum,
    Numeric,
    Date,
    Float,
    Identity,
    Identity,
)
from sqlalchemy import event, func, case, literal, select
from sqlalchemy.orm import relationship, Session
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.hybrid import hybrid_property
from database import Base
import enum, random



class User(Base):
    __tablename__ = "users"
    __random_pk_field__ = "user_id"


    id = Column(Integer, index=True, server_default=Identity())
    user_id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_type = Column(String)
    roles = Column(JSON, default=[])

    # Fixed relationship - should reference the correct foreign key
    donor_profile = relationship("Donor", back_populates="user")
    user_profile = relationship("UserProfile", back_populates="user")
    volunteers = relationship("IndividualVolunteer",back_populates="user")
    OrganizationVolunteer = relationship("OrganizationVolunteer",back_populates="user")

    procurement_request = relationship("ProcurementRequest", back_populates="requester")


class UserProfile(Base):
    __tablename__ = "user_profile"
    __random_pk_field__ = "user_profile_id"
    id = Column(Integer, index=True, server_default=Identity())


    user_profile_id = Column(Integer, primary_key=True)


    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    profile_image = Column(String(255), nullable=True)  # URL or path
    phone_number = Column(String(20), nullable=True)
    bday = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)  # e.g., "Male", "Female", "Other"
    address = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    user_id = Column(
        Integer, ForeignKey("users.user_id"), nullable=False, unique=True
    )  # Foreign key to User

    # Relationship
    user = relationship("User", back_populates="user_profile")

    user = relationship("User", back_populates="user_profile")


# LGU Profiling
class RAFIInfrastructure(Base):
    __tablename__ = "rafi_infrastructure"
    __random_pk_field__ = "infastructure_id"
    id = Column(Integer, index=True, server_default=Identity())


    infastructure_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    description = Column(String(255), nullable=False)


class EvacuationCenter(Base):
    __tablename__ = "evacuation_center"
    __random_pk_field__ = "evacuation_id"
    id = Column(Integer, index=True, server_default=Identity())


    evacuation_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)

    barangay = relationship("BaranggayRecords", back_populates="evacucation_center")


class LGURecords(Base):
    __tablename__ = "lgu_records"
    id = Column(Integer, index=True, primary_key=True, server_default=Identity())
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    classification = Column(String(255), nullable=False)
    population = Column(Integer, nullable=False)
    contact_info = Column(String(255), nullable=False)
    risk_level = Column(String(50), nullable=False)

    # relationship to Barangay
    baranggays = relationship("BaranggayRecords", back_populates="lgu")


class BaranggayRecords(Base):
    __tablename__ = "baranggay_records"
    id = Column(Integer, index=True, primary_key=True, server_default=Identity())
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # foreign key to LGU
    lgu_id = Column(Integer, ForeignKey("lgu_records.id"), nullable=False)
    evacucation_center_id = Column(
        Integer, ForeignKey("evacuation_center.evacuation_id"), nullable=False
    )

    population = Column(Integer, nullable=False)
    contact_info = Column(String(255), nullable=False)
    risk_level = Column(String(50), nullable=False)

    # relationship back to LGU
    lgu = relationship("LGURecords", back_populates="baranggays")
    evacucation_center = relationship("EvacuationCenter", back_populates="barangay")


class ResponseReport(Base):
    __tablename__ = "response_reports"
    __random_pk_field__ = "response_id"
    id = Column(Integer, index=True, server_default=Identity())


    response_id = Column(Integer, primary_key=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    report_type = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)


class DemandAndResponse(Base):
    __tablename__ = "demand_and_response"
    __random_pk_field__ = "demand_id"
    id = Column(Integer, index=True, server_default=Identity())


    demand_id = Column(Integer, primary_key=True)
    title_label = Column(String(255), nullable=False)
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
    __random_pk_field__ = "modality_id"

    id = Column(Integer, index=True, server_default=Identity())


    modality_id = Column(Integer, primary_key=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    modality_type = Column(String(255), nullable=False)


class InKindMonitoring(Base):
    __tablename__ = "inkind_monitoring"
    __random_pk_field__ = "in_kind_monitoring_id"

    id = Column(Integer, index=True, server_default=Identity())


    in_kind_monitoring_id = Column(Integer, primary_key=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    quantity = Column(Integer, default=0, nullable=False)
    record_type = Column(String(255), nullable=False)


class ResponseReportBudget(Base):
    __tablename__ = "response_report_budget"
    __random_pk_field__ = "response_budget_id"
    id = Column(Integer, index=True, server_default=Identity())


    response_budget_id = Column(Integer, primary_key=True)
    date_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    budget_record_type = Column(String(255), nullable=False)
    total_amount = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)


# ------------------ DONATIONS MANAGEMENT MODELS


class FundingProposal(Base):
    __tablename__ = "funding_proposals"
    __random_pk_field__ = "funding_id"
    id = Column(Integer, index=True, server_default=Identity())


    funding_id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    description = Column(String, nullable=False)
    budget_required = Column(Integer, nullable=False)
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

    donations = relationship("Donation", back_populates="proposal")


class Donor(Base):
    __tablename__ = "donors"
    __random_pk_field__ = "donor_id"
    id = Column(Integer, index=True, server_default=Identity())


    donor_id = Column(Integer, primary_key=True)


    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)

    donor_type = Column(String(20), nullable=False)
    organization_name = Column(
        String(255), nullable=True
    )  # Nullable for individual donors


    is_verified = Column(Boolean, nullable=False, default=False)

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
    donations = relationship("Donation", back_populates="donor")

    @hybrid_property
    def donor_name(self):
        if self.donor_type == "organization" and self.organization_name:
            return self.organization_name
        elif self.user:
            return self.user.username
        return "Unknown Donor"



    @donor_name.expression      # Queryable with donor_name
    def donor_name(cls):
        username_sq = (
            select(User.username)
            .where(User.user_id == cls.user_id)
            .correlate(cls)
            .scalar_subquery()
        )
        return func.coalesce(
            case(
                (cls.donor_type == "organization", cls.organization_name),
                else_=username_sq,
            ),
            literal("Unknown Donor"),
        )

class TransparencyReport(Base):
    __tablename__ = "transparency_report"
    __random_pk_field__ = "transparency_report_id"
    id = Column(Integer, index=True, server_default=Identity())


    transparency_report_id = Column(Integer, primary_key=True)

    file = Column(String, nullable = False)

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


class DonationFrequency(enum.Enum):
    ONE_TIME = "ONE_TIME"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    YEARLY = "YEARLY"


class DonationStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class Donation(Base):
    __tablename__ = "donation_records"
    __random_pk_field__ = "donation_id"
    id = Column(Integer, index=True, server_default=Identity())

    # Core attributes

    # Core attributes
    donation_id = Column(Integer, primary_key=True)
    donor_id = Column(Integer, ForeignKey("donors.donor_id"), nullable=False)
    frequency = Column(SqlEnum(DonationFrequency, name="donation_frequency"), nullable=False, server_default=DonationFrequency.ONE_TIME.value)
    frequency = Column(
        SqlEnum(DonationFrequency, name="donation_frequency"),
        nullable=False,
        server_default=DonationFrequency.ONE_TIME.value,
    )
    status = Column(
        SqlEnum(DonationStatus, name="donation_status"),
        nullable=False,
        server_default=DonationStatus.PENDING.value,
    )
    # Additional fields
    proposal_id = Column(
        Integer, ForeignKey("funding_proposals.funding_id"), nullable=True
    )
    donation_date = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    donation_type = Column(
        String(20), nullable=False, default="cash"
    )  # "cash" or "inkind" etc.

    # # Recurring donation fields
    next_donation_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, nullable=True, default=True)

    # Fixed relationships
    donor = relationship("Donor", back_populates="donations")
    proposal = relationship("FundingProposal", back_populates="donations")



    cash = relationship(
        "Donation_Cash",
        back_populates="donation",
        uselist=False,
        cascade="all, delete-orphan",
    )
    inkind = relationship(
        "Donation_InKind",
        back_populates="donation",
        uselist=False,
        cascade="all, delete-orphan"
    )




class Donation_Cash(Base):
    __tablename__ = "donation_cash"
    __random_pk_field__ = "cash_id"
    id = Column(Integer, index=True, server_default=Identity())


    cash_id = Column(Integer, primary_key=True)
    amount = Column(Numeric(10, 2), nullable=True)
    payment_method = Column(String(50), nullable=True)

    donation_id = Column(
        Integer,
        ForeignKey("donation_records.donation_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    donation = relationship("Donation", back_populates="cash")


class Donation_InKind(Base):
    __tablename__ = "donation_inkind"
    id = Column(Integer, index=True, server_default=Identity())


    inkind_id = Column(Integer, primary_key=True)
    description = Column(String(255), nullable=True)
    # In-kind donation fields
    item_description = Column(
        String, nullable=True
    )  # Description of donated items/services


    estimated_value = Column(
        Numeric(10, 2), nullable=True
    )  # Estimated monetary value of in-kind donation


    donation_id = Column(
        Integer,
        ForeignKey("donation_records.donation_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )


    quantity = Column(String(50), nullable=True)  # Quantity/units of donated items
    donation = relationship("Donation", back_populates="inkind")


# ------------------ VOLUNTEER MANAGEMENT MODELS
class VolunteerStatus(enum.Enum):
    submitted = "submitted"
    verifying = "verifying"
    approved = "approved"
    rejected = "rejected"



# Please ko update ani mo base na sa profile para di mag balik2
class IndividualVolunteer(Base):
    __tablename__ = "individual_volunteer"
    __random_pk_field__ = "volunteer_id"
    id = Column(Integer, index=True, server_default=Identity())


    volunteer_id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    user = relationship("User", back_populates="volunteers")


    first_name = Column(String(50), nullable=False)
    middle_name = Column(String(50), nullable=True)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    birthday = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    age = Column(Integer, nullable=True)
    availability = Column(String(255), nullable=True)
    medical_conditions = Column(String(255), nullable=True)
    other_medical_conditions = Column(String(255), nullable=True)
    certification = Column(String(255), nullable=True)
    skills = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    volunteer_type = Column(String(50), nullable=False, default="individual")
    status = Column(SqlEnum(VolunteerStatus), default=VolunteerStatus.submitted)

class OrganizationVolunteer(Base):
    __tablename__ = "organization_volunteer"
    __random_pk_field__ = "volunteer_id"
    id = Column(Integer, index=True, server_default=Identity())

    volunteer_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    user = relationship("User", back_populates="OrganizationVolunteer")

    organization_name = Column(String(255), nullable=False)
    organization_type = Column(String(50), nullable=False)
    organization_email = Column(String(100), nullable=False)
    organization_phone_number = Column(String(20), nullable=True)
    organization_address = Column(String(255), nullable=True)
    contact_person_name = Column(String(100), nullable=False)
    contact_person_position = Column(String(100), nullable=False)
    contact_person_phone_number = Column(String(20), nullable=True)
    contact_person_email = Column(String(100), nullable=False)
    availability = Column(String(255), nullable=True)
    organization_picture = Column(String(255), nullable=True)  # URL or path to the picture
    organization_certificate = Column(String(255), nullable=True)  # URL or path to the certificate
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    volunteer_type = Column(String(50), nullable=False, default="organization")
    status = Column(SqlEnum(VolunteerStatus), default=VolunteerStatus.submitted)


# Procurement Request


class ProcurementRequest(Base):
    __tablename__ = "procurement_request"
    request_id = Column(Integer, index=True, primary_key=True, autoincrement=True)
    requester_id = Column(Integer, ForeignKey("users.user_id"))

    requester = relationship("User", back_populates="procurement_request")

    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    date = Column(Date, nullable=False)
    comment = Column(String(255), nullable=True)

    # ✅ should be plural (list of items)
    request_items = relationship("ProcurementRequestItem", back_populates="request")


class ProcurementRequestItem(Base):
    __tablename__ = "procurement_request_item"
    item_id = Column(Integer, index=True, primary_key=True, autoincrement=True)

    request_id = Column(Integer, ForeignKey("procurement_request.request_id"))
    item_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_p_each = Column(Float, nullable=False)

    # ✅ belongs to ONE request
    request = relationship("ProcurementRequest", back_populates="request_items")

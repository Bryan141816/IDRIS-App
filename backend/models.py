from datetime import datetime, timezone
from enum import unique
from asyncio.base_events import Server
from contextlib import nullcontext
from datetime import timezone
from enum import CONFORM, unique
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
    CheckConstraint,
    Index,
    ARRAY,
    Text,
    UniqueConstraint,
)
from sqlalchemy import event, func, case, literal, select
from sqlalchemy.orm import relationship, Session
from sqlalchemy.types import JSON
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.hybrid import hybrid_property
from database import Base
import enum, random
from datetime import datetime, UTC
from sqlalchemy import Column, DateTime
from datetime import datetime, timezone
import enum

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    DateTime,
    ForeignKey,
    Index,
    CheckConstraint,
    UniqueConstraint,
    Identity,
    func,
    case,
    literal,
    select,
    and_,
)
from sqlalchemy.orm import relationship, column_property
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy import Enum as SqlEnum

# for god sake ayaw e butang sa ubos ang import libog kaau


class User(Base):
    __tablename__ = "users"
    __random_pk_field__ = "user_id"

    id = Column(Integer, index=True, server_default=Identity())
    user_id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    user_type = Column(String)
    roles = Column(ARRAY(String), default=[])
    is_activated = Column(Boolean, default=False)

    sub = Column(String, nullable=True)  # for oauth

    # Fixed relationship - should reference the correct foreign key
    donor_profile = relationship(
        "Donor",
        back_populates="user",
    )
    user_profile = relationship(
        "UserProfile",
        uselist=False,
        back_populates="user",
        cascade="all, delete-orphan",
    )
    admin_user_profile = relationship(
        "AdminUserProfile",
        uselist=False,
        back_populates="adminuser",
        cascade="all, delete-orphan",
    )
    volunteers = relationship(
        "IndividualVolunteer", back_populates="user", cascade="all, delete-orphan"
    )
    OrganizationVolunteer = relationship(
        "OrganizationVolunteer", back_populates="user", cascade="all, delete-orphan"
    )

    procurement_request = relationship(
        "ProcurementRequest", back_populates="requester", cascade="all, delete-orphan"
    )


class UserProfile(Base):
    __tablename__ = "user_profile"
    __random_pk_field__ = "user_profile_id"
    id = Column(Integer, index=True, server_default=Identity())

    user_profile_id = Column(String, primary_key=True)

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    profile_image = Column(String(255), nullable=True)  # URL or path
    phone_number = Column(String(20), nullable=True)
    bday = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)  # e.g., "Male", "Female", "Other"
    address = Column(String(255), nullable=True)
    bio = Column(String(500), nullable=True)
    user_id = Column(
        String, ForeignKey("users.user_id"), nullable=False, unique=True
    )  # Foreign key to User

    # Relationship
    user = relationship("User", back_populates="user_profile")

    # user = relationship("User", back_populates="user_profile")


class AdminUserProfile(Base):
    __tablename__ = "admin_user_profile"
    __random_pk_field__ = "admin_user_profile_id"
    id = Column(Integer, index=True, server_default=Identity())

    admin_user_profile_id = Column(String, primary_key=True)

    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    employee_idNumber = Column(String(50), nullable=False, unique=True)
    department = Column(String(100), nullable=False)
    contact_number = Column(String(20), nullable=True)
    position = Column(String(100), nullable=True)
    employee_id = Column(String(300), nullable=True)  # URL or path
    lgu_location = Column(String(255), nullable=True)

    user_id = Column(
        String, ForeignKey("users.user_id"), nullable=False, unique=True
    )  # Foreign key to User

    # Relationship
    adminuser = relationship("User", back_populates="admin_user_profile")


class Notifications(Base):
    __tablename__ = "notifications_table"
    notification_id = Column(
        Integer, index=True, primary_key=True, server_default=Identity()
    )
    to = Column(String, nullable=False)

    from_origin = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(String(255), nullable=False)
    url_redirect = Column(String(255), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    isRead = Column(Boolean)


# LGU Profiling
class RAFIInfrastructure(Base):
    __tablename__ = "rafi_infrastructure"

    rafi_id = Column(Integer, primary_key=True, index=True, server_default=Identity())
    rafi_name = Column(String(255), nullable=False)  # <-- must exist
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    rafi_desc = Column(String(255), nullable=True)
    rafi_pic = Column(String, nullable=True)  # URL or file path


class Hazard(Base):
    __tablename__ = "hazards_record"

    id = Column(Integer, primary_key=True, index=True)
    lgu_id = Column(
        Integer, ForeignKey("lgu_records.lgu_id"), nullable=False
    )  # <-- add
    lgu = relationship("LGURecords")  # <-- add

    hazard_area = Column(String(255), nullable=False)  # LGU name text
    hazard_type = Column(String, nullable=False)
    image_url = Column(String, nullable=True)
    action = Column(String, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class EvacuationCenter(Base):
    __tablename__ = "evacuation_center"
    __random_pk_field__ = "evacuation_id"

    id = Column(Integer, index=True, server_default=Identity())
    evacuation_id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    capacity = Column(Integer, nullable=False)
    occupied = Column(Integer, nullable=False, server_default="0")

    # ✅ cascade delete to barangays
    barangay = relationship(
        "BaranggayRecords",
        back_populates="evacucation_center",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class LGURecords(Base):
    __tablename__ = "lgu_records"

    id = Column(
        "lgu_id", Integer, primary_key=True, index=True, server_default=Identity()
    )
    name = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    classification = Column(String(255), nullable=False)
    population = Column(Integer, nullable=False)
    contact_info = Column(String(255), nullable=False)
    risk_level = Column(String(50), nullable=False)

    lgu_picture = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    resources = Column(JSON, nullable=True)
    players = Column(JSON, nullable=True)
    schools = Column(JSON, nullable=True)
    gyms = Column(JSON, nullable=True)
    local_suppliers = Column(JSON, nullable=True)

    baranggays = relationship("BaranggayRecords", back_populates="lgu")

    # NEW: hazards under this LGU
    hazards = relationship(
        "Hazard",
        back_populates="lgu",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class BaranggayRecords(Base):
    __tablename__ = "baranggay_records"

    id = Column(Integer, index=True, primary_key=True, server_default=Identity())
    name = Column(String(255), nullable=False)

    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    baranggay_pic = Column(String, nullable=True)
    baranggay_desc = Column(Text, nullable=True)
    resources = Column(JSON, nullable=True)
    contact_info = Column(String(255), nullable=True)
    population = Column(JSON, nullable=True)

    risk_level = Column(String(50), nullable=True)  # ✅ added back

    lgu_id = Column(Integer, ForeignKey("lgu_records.lgu_id"), nullable=False)
    evacucation_center_id = Column(
        Integer,
        ForeignKey("evacuation_center.evacuation_id", ondelete="SET NULL"),
        nullable=True,
    )

    lgu = relationship("LGURecords", back_populates="baranggays")
    evacucation_center = relationship(
        "EvacuationCenter",
        back_populates="barangay",
        passive_deletes=True,
    )


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

    funding_id = Column(String, primary_key=True)
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
    starting_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=False)

    donations = relationship("Donation", back_populates="proposal")


class Donor(Base):
    __tablename__ = "donors"
    __random_pk_field__ = "donor_id"
    id = Column(Integer, index=True, server_default=Identity())

    donor_id = Column(String, primary_key=True)

    user_id = Column(String, ForeignKey("users.user_id"), nullable=True)

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
        elif self.user and self.user.user_profile:
            return f"{self.user.user_profile.first_name} {self.user.user_profile.last_name}"
        elif self.user:
            return self.user.username
        return "Unknown Donor"

    @donor_name.expression
    def donor_name(cls):
        # Subquery to get the full name from UserProfile
        fullname_sq = (
            select(func.concat(UserProfile.first_name, " ", UserProfile.last_name))
            .join(User, User.user_id == UserProfile.user_id)
            .where(User.user_id == cls.user_id)
            .correlate(cls)
            .scalar_subquery()
        )

        # Subquery to get the username as a fallback
        username_sq = (
            select(User.username)
            .where(User.user_id == cls.user_id)
            .correlate(cls)
            .scalar_subquery()
        )

        return case(
            (
                cls.donor_type == "organization",
                func.coalesce(cls.organization_name, "Unknown Organization"),
            ),
            (
                cls.donor_type == "individual",
                func.coalesce(fullname_sq, username_sq, "Unknown Donor"),
            ),
            else_=literal("Unknown Donor"),
        )


class TransparencyReport(Base):
    __tablename__ = "transparency_report"
    __random_pk_field__ = "transparency_report_id"
    id = Column(Integer, index=True, server_default=Identity())

    transparency_report_id = Column(Integer, primary_key=True)

    file = Column(String, nullable=False)

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


class DonationType(str, enum.Enum):
    CASH = "CASH"
    INKIND = "INKIND"


class Donation(Base):
    __tablename__ = "donation_records"
    __random_pk_field__ = "donation_id"
    id = Column(Integer, index=True, server_default=Identity())

    # Core attributes
    donation_id = Column(String, primary_key=True)
    donor_id = Column(String, ForeignKey("donors.donor_id"), nullable=False)
    frequency = Column(
        SqlEnum(DonationFrequency, name="donation_frequency"),
        nullable=False,
        server_default=DonationFrequency.ONE_TIME.value,
    )
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
    checkout_id = Column(String(255), nullable=True, index=True)
    # Additional fields
    funding_id = Column(
        String, ForeignKey("funding_proposals.funding_id"), nullable=True
    )
    donation_date = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    donation_type = Column(
        SqlEnum(DonationType, name="donation_type"),
        nullable=False,
        server_default=DonationType.CASH.value,
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

    finance_record = relationship(
        "FinanceRecord",
        back_populates="donation",
        uselist=False,
        cascade="all, delete-orphan",
    )
    inkind = relationship(
        "Donation_InKind",
        back_populates="donation",
        uselist=False,
        cascade="all, delete-orphan",
    )


class Donation_Cash(Base):
    __tablename__ = "donation_cash"
    __random_pk_field__ = "cash_id"
    id = Column(Integer, index=True, server_default=Identity())

    cash_id = Column(String, primary_key=True)
    amount = Column(Numeric(10, 2), nullable=True)
    payment_method = Column(String(50), nullable=True)

    donation_id = Column(
        String,
        ForeignKey("donation_records.donation_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    donation = relationship("Donation", back_populates="cash")


class Donation_InKind(Base):
    __tablename__ = "donation_inkind"
    id = Column(Integer, index=True, server_default=Identity())

    inkind_id = Column(String, primary_key=True)

    # In-kind donation fields
    item_description = Column(
        String, nullable=True
    )  # Description of donated items/services

    estimated_value = Column(
        Numeric(10, 2), nullable=True
    )  # Estimated monetary value of in-kind donation

    donation_id = Column(
        String,
        ForeignKey("donation_records.donation_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    quantity = Column(String(50), nullable=True)  # Quantity/units of donated items
    donation = relationship("Donation", back_populates="inkind")

    inventory_item = relationship(
        "InKindInventoryItem",
        back_populates="inkind",
        uselist=False,  # one-to-one
        cascade="all, delete-orphan",
    )


# imports (keep your own project Base import as-is)


# ------------------ VOLUNTEER MANAGEMENT MODELS


class VolunteerStatus(enum.Enum):
    submitted = "submitted"
    verifying = "verifying"
    approved = "approved"
    rejected = "rejected"
    available = "available"
    assigned = "assigned"
    unavailable = "unavailable"


class TaskLifecycle(str, enum.Enum):
    incoming = "incoming"
    ongoing = "ongoing"
    finished = "finished"
    cancelled = "cancelled"  # optional


class IndividualVolunteer(Base):
    __tablename__ = "individual_volunteer"
    __random_pk_field__ = "volunteer_id"
    id = Column(Integer, index=True, server_default=Identity())

    volunteer_id = Column(Integer, primary_key=True)

    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, unique=True)
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
    other_medical_conditions = Column(String(255), nullable=True, default="N/A")
    certification = Column(String(255), nullable=True)
    skills = Column(String(255), nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    volunteer_type = Column(String(50), nullable=False, default="individual")
    status = Column(SqlEnum(VolunteerStatus), default=VolunteerStatus.submitted)
    availability_status = Column(
        SqlEnum(VolunteerStatus), default=VolunteerStatus.unavailable
    )

    certificates = relationship(
        "VolunteerCertificate",
        back_populates="individual_volunteer",
        primaryjoin="VolunteerCertificate.individual_volunteer_id==IndividualVolunteer.volunteer_id",
        passive_deletes=True,
    )


class OrganizationVolunteer(Base):
    __tablename__ = "organization_volunteer"
    __random_pk_field__ = "volunteer_id"
    id = Column(Integer, index=True, server_default=Identity())

    volunteer_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.user_id"), nullable=False, unique=True)
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
    organization_picture = Column(
        String(255), nullable=True
    )  # URL or path to the picture
    organization_certificate = Column(
        String(255), nullable=True
    )  # URL or path to the certificate
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    volunteer_type = Column(String(50), nullable=False, default="organization")
    status = Column(SqlEnum(VolunteerStatus), default=VolunteerStatus.submitted)
    availability_status = Column(
        SqlEnum(VolunteerStatus), default=VolunteerStatus.unavailable
    )

    certificates = relationship(
        "VolunteerCertificate",
        back_populates="organization_volunteer",
        primaryjoin="VolunteerCertificate.organization_volunteer_id==OrganizationVolunteer.volunteer_id",
        passive_deletes=True,
    )


class VolunteerCertificate(Base):
    __tablename__ = "volunteer_certificate"

    id = Column(Integer, primary_key=True, index=True)

    # Exactly one of these must be set:
    individual_volunteer_id = Column(
        Integer,
        ForeignKey("individual_volunteer.volunteer_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    organization_volunteer_id = Column(
        Integer,
        ForeignKey("organization_volunteer.volunteer_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    file_name = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)  # normalized POSIX path
    mime_type = Column(String(100), nullable=True)
    uploaded_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Enforce XOR ownership at the DB level
    __table_args__ = (
        CheckConstraint(
            # works in Postgres; SQLite accepts CASE variant too
            "(CASE WHEN individual_volunteer_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN organization_volunteer_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_cert_exactly_one_owner",
        ),
        Index("ix_vol_cert_owner_i", "individual_volunteer_id"),
        Index("ix_vol_cert_owner_o", "organization_volunteer_id"),
    )

    # ORM relationships back to owners
    individual_volunteer = relationship(
        "IndividualVolunteer",
        back_populates="certificates",
        foreign_keys=[individual_volunteer_id],
    )
    organization_volunteer = relationship(
        "OrganizationVolunteer",
        back_populates="certificates",
        foreign_keys=[organization_volunteer_id],
    )


class Event(Base):
    __tablename__ = "event"

    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False, index=True)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    # Optional global date, but your UI sets date at task level—keep for future use
    event_date = Column(Date, nullable=True)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    tasks = relationship("Task", back_populates="event", cascade="all, delete-orphan")


class Task(Base):
    __tablename__ = "task"

    id = Column(Integer, primary_key=True)
    event_id = Column(
        Integer, ForeignKey("event.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title = Column(String(120), nullable=False)
    description = Column(Text)
    location = Column(String(255))

    start_at = Column(DateTime(timezone=True), nullable=False, index=True)
    end_at = Column(DateTime(timezone=True), nullable=False, index=True)

    max_volunteers = Column(Integer, nullable=False)
    required_skills = Column(String(500))
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    event = relationship("Event", back_populates="tasks")
    assignments = relationship(
        "Assignment", back_populates="task", cascade="all, delete-orphan"
    )

    # derive lifecycle from now
    @hybrid_property
    def lifecycle(self) -> "TaskLifecycle":
        now = datetime.now(timezone.utc)
        if now < self.start_at:
            return TaskLifecycle.incoming
        if self.start_at <= now < self.end_at:
            return TaskLifecycle.ongoing
        return TaskLifecycle.finished

    @lifecycle.expression
    def lifecycle(cls):
        # evaluated in SQL (Postgres NOW() is tz-aware under timestamptz)
        return case(
            (func.now() < cls.start_at, literal(TaskLifecycle.incoming.value)),
            (func.now() >= cls.end_at, literal(TaskLifecycle.finished.value)),
            else_=literal(TaskLifecycle.ongoing.value),
        )


class AssignmentStatus(str, enum.Enum):
    applied = "applied"
    invited = "invited"
    accepted = "accepted"
    declined = "declined"
    waitlisted = "waitlisted"
    checked_in = "checked_in"
    no_show = "no_show"
    completed = "completed"
    cancelled = "cancelled"


class Assignment(Base):
    __tablename__ = "assignment"

    id = Column(Integer, primary_key=True)
    task_id = Column(
        Integer, ForeignKey("task.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Assign EITHER an individual OR an organization (XOR)
    individual_volunteer_id = Column(
        Integer,
        ForeignKey("individual_volunteer.volunteer_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    organization_volunteer_id = Column(
        Integer,
        ForeignKey("organization_volunteer.volunteer_id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    status = Column(
        SqlEnum(AssignmentStatus),
        nullable=False,
        server_default=AssignmentStatus.applied.value,
    )
    notes = Column(Text)

    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    task = relationship("Task", back_populates="assignments")
    # string names avoid circular import
    individual_volunteer = relationship(
        "IndividualVolunteer", foreign_keys=[individual_volunteer_id]
    )
    organization_volunteer = relationship(
        "OrganizationVolunteer", foreign_keys=[organization_volunteer_id]
    )

    __table_args__ = (
        # exactly one owner
        CheckConstraint(
            "(CASE WHEN individual_volunteer_id IS NOT NULL THEN 1 ELSE 0 END) + "
            "(CASE WHEN organization_volunteer_id IS NOT NULL THEN 1 ELSE 0 END) = 1",
            name="ck_assignment_exactly_one_owner",
        ),
        # prevent duplicates on same task
        UniqueConstraint(
            "task_id", "individual_volunteer_id", name="uq_task_individual"
        ),
        UniqueConstraint(
            "task_id", "organization_volunteer_id", name="uq_task_organization"
        ),
        Index("ix_assignment_status", "status"),
    )


# ------------------ Computed counters (attach after classes to avoid forward-ref issues)

# Which statuses mean a volunteer actually "joined" a program/task
JOINED_STATUSES = (
    AssignmentStatus.accepted,
    AssignmentStatus.checked_in,
    AssignmentStatus.completed,
)

# IndividualVolunteer counters
IndividualVolunteer.tasks_joined = column_property(
    select(func.count(Assignment.id))
    .where(
        and_(
            Assignment.individual_volunteer_id == IndividualVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
        )
    )
    .correlate_except(Assignment)
    .scalar_subquery()
)

IndividualVolunteer.active_tasks_joined = column_property(
    select(func.count(Assignment.id))
    .join(Task, Task.id == Assignment.task_id)
    .where(
        and_(
            Assignment.individual_volunteer_id == IndividualVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
            Task.end_at >= func.now(),  # active if not yet finished
        )
    )
    .correlate_except(Assignment, Task)
    .scalar_subquery()
)

IndividualVolunteer.events_joined = column_property(
    select(func.count(func.distinct(Event.id)))
    .select_from(Assignment)
    .join(Task, Task.id == Assignment.task_id)
    .join(Event, Event.id == Task.event_id)
    .where(
        and_(
            Assignment.individual_volunteer_id == IndividualVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
        )
    )
    .correlate_except(Assignment, Task, Event)
    .scalar_subquery()
)

IndividualVolunteer.active_events_joined = column_property(
    select(func.count(func.distinct(Event.id)))
    .select_from(Assignment)
    .join(Task, Task.id == Assignment.task_id)
    .join(Event, Event.id == Task.event_id)
    .where(
        and_(
            Assignment.individual_volunteer_id == IndividualVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
            Task.end_at >= func.now(),
        )
    )
    .correlate_except(Assignment, Task, Event)
    .scalar_subquery()
)

# OrganizationVolunteer counters
OrganizationVolunteer.tasks_joined = column_property(
    select(func.count(Assignment.id))
    .where(
        and_(
            Assignment.organization_volunteer_id == OrganizationVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
        )
    )
    .correlate_except(Assignment)
    .scalar_subquery()
)

OrganizationVolunteer.active_tasks_joined = column_property(
    select(func.count(Assignment.id))
    .join(Task, Task.id == Assignment.task_id)
    .where(
        and_(
            Assignment.organization_volunteer_id == OrganizationVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
            Task.end_at >= func.now(),
        )
    )
    .correlate_except(Assignment, Task)
    .scalar_subquery()
)

OrganizationVolunteer.events_joined = column_property(
    select(func.count(func.distinct(Event.id)))
    .select_from(Assignment)
    .join(Task, Task.id == Assignment.task_id)
    .join(Event, Event.id == Task.event_id)
    .where(
        and_(
            Assignment.organization_volunteer_id == OrganizationVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
        )
    )
    .correlate_except(Assignment, Task, Event)
    .scalar_subquery()
)

OrganizationVolunteer.active_events_joined = column_property(
    select(func.count(func.distinct(Event.id)))
    .select_from(Assignment)
    .join(Task, Task.id == Assignment.task_id)
    .join(Event, Event.id == Task.event_id)
    .where(
        and_(
            Assignment.organization_volunteer_id == OrganizationVolunteer.volunteer_id,
            Assignment.status.in_(JOINED_STATUSES),
            Task.end_at >= func.now(),
        )
    )
    .correlate_except(Assignment, Task, Event)
    .scalar_subquery()
)


# Procurement Request


class ProcurementRequest(Base):
    __tablename__ = "procurement_request"
    request_id = Column(Integer, index=True, primary_key=True, autoincrement=True)
    requester_id = Column(String, ForeignKey("users.user_id"))

    requester = relationship("User", back_populates="procurement_request")

    title = Column(String(255), nullable=False)
    lgu_name = Column(String(255), nullable=False)
    priority = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    description = Column(String(255), nullable=False)
    justification = Column(String(255), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    comment = Column(String(255), nullable=True)
    reason_or_code = Column(String(255), nullable=True)

    # ✅ should be plural (list of items)
    request_items = relationship("ProcurementRequestItem", back_populates="request")


class ProcurementRequestItem(Base):
    __tablename__ = "procurement_request_item"
    item_id = Column(Integer, index=True, primary_key=True, autoincrement=True)

    request_id = Column(Integer, ForeignKey("procurement_request.request_id"))
    item_name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_p_each = Column(Float, nullable=False)

    # ✅ belongs to ONE request
    request = relationship("ProcurementRequest", back_populates="request_items")


class WarehouseZones(Base):
    __tablename__ = "warehouse_zones"

    warehouse_id = Column(Integer, index=True, primary_key=True, autoincrement=True)
    address = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    long = Column(Float, nullable=False)
    status = Column(String(255), nullable=False)
    zone_name = Column(String(255), nullable=False)

    zone_type = Column(String(255), nullable=False)
    capacity = Column(Integer, nullable=False)
    manager = Column(String(255), nullable=False)

    assigned_storages = relationship("AssignedStorage", back_populates="warehouse")
    routes = relationship(
        "DistributionRoute",
        back_populates="start_zone",
    )


class InventoryItems(Base):
    __tablename__ = "inventory_items"

    inventory_id = Column(Integer, index=True, primary_key=True, autoincrement=True)
    item_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    category = Column(String(255), nullable=False)
    batch = Column(String(255), nullable=False)
    expiry = Column(Date, nullable=True)
    status = Column(String(255), nullable=False)

    assigned_storages = relationship("AssignedStorage", back_populates="inventory_item")
    distributed_items = relationship("DistributedItems", back_populates="item_info")


class AssignedStorage(Base):
    __tablename__ = "assigned_storage"

    assigned_id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign keys
    warehouse_id = Column(
        Integer, ForeignKey("warehouse_zones.warehouse_id"), nullable=False
    )
    inventory_id = Column(
        Integer, ForeignKey("inventory_items.inventory_id"), nullable=False
    )

    # Additional field
    quantity = Column(Integer, nullable=False)
    unit_occupancy = Column(Float, nullable=False)

    # Relationships
    warehouse = relationship("WarehouseZones", back_populates="assigned_storages")
    inventory_item = relationship("InventoryItems", back_populates="assigned_storages")


class TeamMembers(Base):
    __tablename__ = "team_members"
    members_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_id = Column(Integer, ForeignKey("distribution_team.team_id"), nullable=False)
    member = Column(
        Integer, ForeignKey("individual_volunteer.volunteer_id"), nullable=False
    )
    role = Column(String(255), nullable=False)
    team = relationship("DistributionTeam", back_populates="team_members")
    volunteer = relationship("IndividualVolunteer")


class DistributionTeam(Base):
    __tablename__ = "distribution_team"
    team_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    team_name = Column(String(255), nullable=False)
    deployment_area = Column(String(255), nullable=False)
    assignment_duration = Column(Integer, nullable=False)
    starting_date = Column(Date)
    isActive = Column(Boolean, default=True)
    status = Column(String(255), default="unassigned")
    team_members = relationship("TeamMembers", back_populates="team")
    routes = relationship("DistributionRoute", back_populates="assigned_team")


class DistributionRouteLogs(Base):
    __tablename__ = "distribution_route_log"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    route_id = Column(
        Integer, ForeignKey("distribution_route.route_id"), nullable=False
    )
    log_message = Column(String(255))
    date = Column(DateTime)

    # Relationship back to DistributionRoute
    route = relationship("DistributionRoute", back_populates="logs")


class DistributionRoute(Base):
    __tablename__ = "distribution_route"

    route_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    route_name = Column(String(255), nullable=False)
    start_location = Column(
        Integer, ForeignKey("warehouse_zones.warehouse_id"), nullable=False
    )
    end_location_id = Column(Integer, nullable=False)
    end_location = Column(String(255), nullable=False)
    status = Column(String(255), default="Pending")
    schedule = Column(DateTime)
    team = Column(Integer, ForeignKey("distribution_team.team_id"), nullable=True)
    date_added = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    start_zone = relationship("WarehouseZones", back_populates="routes")
    distributed_items = relationship("DistributedItems", back_populates="route_info")
    assigned_team = relationship("DistributionTeam", back_populates="routes")

    # New relationship for logs
    logs = relationship("DistributionRouteLogs", back_populates="route")


class DistributedItems(Base):
    __tablename__ = "distributed_items"
    item_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    item = Column(Integer, ForeignKey("inventory_items.inventory_id"), nullable=False)
    route = Column(Integer, ForeignKey("distribution_route.route_id"), nullable=False)
    quantity = Column(Integer, nullable=False)

    item_info = relationship("InventoryItems", back_populates="distributed_items")
    route_info = relationship("DistributionRoute", back_populates="distributed_items")


class InKindInventoryItem(Base):
    __tablename__ = "inkind_inventory_item"

    id = Column(Integer, primary_key=True, index=True)
    item_id = Column(
        String,
        ForeignKey("donation_inkind.inkind_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status = Column(String(50), nullable=False, default="available")

    # Relationship back to Donation_InKind
    inkind = relationship("Donation_InKind", back_populates="inventory_item")


@event.listens_for(Donation_InKind, "after_insert")
def create_inventory_item(mapper, connection, target):
    """
    Automatically creates an InKindInventoryItem
    when a new Donation_InKind is inserted.
    """
    connection.execute(
        InKindInventoryItem.__table__.insert().values(
            item_id=target.inkind_id,
            status="available",
        )
    )


# ================================== FINANCE MODELS =====================================


class BudgetAllocation(enum.Enum):
    EMERGENCY = "EMERGENCY SUPPLIES"
    FOOD_WATER = "FOOD AND WATER"
    TRANSPORTATION = "TRANSPORTATION"
    EQUIPMENT = "EQUIPMENT"
    ADMINISTRATIVE = "ADMINISTRATIVE"
    DONATIONS = "DONATIONS"
    GENERAL = "GENERAL"


class TransactionType(enum.Enum):
    INFLOW = "INFLOW"
    OUTFLOW = "OUTFLOW"


class RecordStatus(enum.Enum):
    PENDING = "PENDING"  # recorded but not yet received/paid
    RECEIVED = "RECEIVED"  # for inflows

    PAID = "PAID"  # for outflows
    APPROVED = "APPROVED"  # approver ok (often outflow)
    DENIED = "DENIED"  # rejected
    RECONCILED = "RECONCILED"  # cleared in reconciliation


class FinanceRecord(Base):
    __tablename__ = "finance_records"
    id = Column(Integer, index=True, server_default=Identity())

    finance_id = Column(String, primary_key=True)
    counterparty = Column(String(255), nullable=False)
    transaction_type = Column(SqlEnum(TransactionType), nullable=False, index=True)
    amount = Column(Numeric(14, 2), nullable=False)
    date = Column(Date, nullable=False, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        SqlEnum(RecordStatus), nullable=False, index=True, default=RecordStatus.PENDING
    )
    created_at = Column(DateTime, nullable=False, default=func.now())
    updated_at = Column(
        DateTime, nullable=False, server_default=func.now(), onupdate=func.now()
    )

    budget_for = Column(
        SqlEnum(BudgetAllocation), nullable=False, default=BudgetAllocation.GENERAL
    )

    donation_id = Column(
        String, ForeignKey("donation_records.donation_id"), nullable=True, unique=True
    )
    donation = relationship("Donation", back_populates="finance_record", uselist=False)

    audits = relationship(
        "FinanceAudit", back_populates="record", cascade="all, delete-orphan"
    )

    __table_args__ = (Index("ix_finance_type_date", "transaction_type", "date"),)


class FinanceAudit(Base):
    __tablename__ = "finance_audits"
    id = Column(Integer, index=True, server_default=Identity())

    audit_id = Column(String, primary_key=True)
    record_id = Column(
        String,
        ForeignKey("finance_records.finance_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    action = Column(
        String(64), nullable=False
    )  # e.g., create, update, reconcile, export
    at = Column(DateTime, nullable=False, server_default=func.now())
    actor = Column(String(128), nullable=True)  # optional: username/email
    details = Column(Text, nullable=True)

    record = relationship("FinanceRecord", back_populates="audits")

from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from typing import List, Optional
from models import (
    EvacuationCenter,
    ResponseReport,
    AdminUserProfile,
    User,
    ModalityDistribution,
    ResponseReportBudget,
    InKindMonitoring,
    DemandAndResponse,
)
from auth import hash_password, verify_password
from schemas import (
    EvacuationCenterCreate,
    ResponseReportCreate,
    ModalityDistributionCreate,
    ResponseDashboardBudgetCreate,
    InKindMonitoringCreate,
    DemandAndResponseCreate,
    AdminUserProfileCreate,
    AdminUserProfileUpdate
)
from crud_functions.utils import uid_from_string
from sqlalchemy.orm import joinedload

# Generic CRUD functions
def get_by_id(db: Session, model, id):
    return db.query(model).filter(model.id == id).first()


def get_all(db: Session, model, skip: int = 0, limit: int = 100):
    return db.query(model).offset(skip).limit(limit).all()


def create(db: Session, model, obj_in: dict):
    obj = model(**obj_in)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update(db: Session, model, id, obj_in: dict):
    db_obj = get_by_id(db, model, id)
    if not db_obj:
        return None
    for key, value in obj_in.items():
        setattr(db_obj, key, value)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete(db: Session, model, id):
    obj = get_by_id(db, model, id)
    if not obj:
        return None
    db.delete(obj)
    db.commit()
    return obj


# User-specific functions


def get_user_by_email(db: Session, email: str):
    return (
        db.query(User)
        .options(joinedload(User.user_profile))
        .filter(User.email == email)
        .first()
    )


def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()


def create_user(
    db: Session,
    email: str,
    username: str,
    user_type: str,
    password: str | None = None,
    roles: list[str] = [],
    user_id: str | None = None,
    sub: str | None = None,
):
    if get_user_by_username(db, username):
        raise ValueError("Username already in use")
    if get_user_by_email(db, email):
        raise ValueError("Email already registered")
    hashed = None
    if password:

        hashed = hash_password(password)
    user_data = {
        "email": email,
        "user_id": user_id,
        "username": username,
        "user_type": user_type,
        "hashed_password": hashed,
        "roles": roles or [],
        "sub": sub,
    }
    user = User(**user_data)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

# Admin User Profile CRUD Functions

def create_admin_user_profile(
    db: Session,
    admin_profile: AdminUserProfileCreate,
    user_id: str
) -> AdminUserProfile:
    """
    Create an admin user profile linked to a user account
    """
    admin_profile_id = uid_from_string(
        f"{admin_profile.first_name}{admin_profile.last_name}{admin_profile.employee_idNumber}"
    )
    db_admin_profile = AdminUserProfile(
        admin_user_profile_id=admin_profile_id,
        first_name=admin_profile.first_name,
        last_name=admin_profile.last_name,
        employee_idNumber=admin_profile.employee_idNumber,
        department=admin_profile.department,
        contact_number=admin_profile.contact_number,
        position=admin_profile.position,
        employee_id=admin_profile.employee_id,
        lgu_location=admin_profile.lgu_location,
        user_id=user_id
    )
    db.add(db_admin_profile)
    db.commit()
    db.refresh(db_admin_profile)
    return db_admin_profile


def get_admin_user_profile_by_user_id(db: Session, user_id: str) -> Optional[AdminUserProfile]:
    """
    Get admin profile by user_id
    """
    return db.query(AdminUserProfile).filter(
        AdminUserProfile.user_id == user_id
    ).first()


def get_admin_user_profile_by_id(db: Session, admin_profile_id: str) -> Optional[AdminUserProfile]:
    """
    Get admin profile by admin_user_profile_id
    """
    return db.query(AdminUserProfile).filter(
        AdminUserProfile.admin_user_profile_id == admin_profile_id
    ).first()


def get_admin_user_profile_by_employee_id(db: Session, employee_id_number: str) -> Optional[AdminUserProfile]:
    """
    Get admin profile by employee ID number
    """
    return db.query(AdminUserProfile).filter(
        AdminUserProfile.employee_idNumber == employee_id_number
    ).first()


def get_all_admin_user_profiles(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[AdminUserProfile]:
    """
    Get all admin user profiles with pagination
    """
    return db.query(AdminUserProfile).offset(skip).limit(limit).all()


def update_admin_user_profile(
    db: Session,
    user_id: str,
    profile_update: AdminUserProfileUpdate
) -> Optional[AdminUserProfile]:
    """
    Update admin user profile
    """
    db_profile = get_admin_user_profile_by_user_id(db, user_id)
    if not db_profile:
        return None

    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_profile, key, value)

    db.commit()
    db.refresh(db_profile)
    return db_profile


def delete_admin_user_profile(db: Session, user_id: str) -> Optional[AdminUserProfile]:
    """
    Delete admin user profile by user_id
    """
    db_profile = get_admin_user_profile_by_user_id(db, user_id)
    if not db_profile:
        return None

    db.delete(db_profile)
    db.commit()
    return db_profile


def get_admin_user_with_profile(db: Session, user_id: str) -> Optional[User]:
    """
    Get admin user with their profile using joinedload for efficiency
    """
    return (
        db.query(User)
        .options(joinedload(User.admin_user_profile))
        .filter(User.user_id == user_id)
        .first()
    )


def get_all_admin_users_with_profiles(
    db: Session,
    skip: int = 0,
    limit: int = 100
) -> List[User]:
    """
    Get all admin users with their profiles
    """
    return (
        db.query(User)
        .options(joinedload(User.admin_user_profile))
        .filter(User.user_type == "admin")
        .offset(skip)
        .limit(limit)
        .all()
    )


def activate_admin_user(db: Session, user_id: str) -> Optional[User]:
    """
    Activate an admin user account
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None

    user.is_activated = True
    db.commit()
    db.refresh(user)
    return user


def deactivate_admin_user(db: Session, user_id: str) -> Optional[User]:
    """
    Deactivate an admin user account
    """
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return None

    user.is_activated = False
    db.commit()
    db.refresh(user)
    return user


def get_pending_admin_activations(db: Session) -> List[User]:
    """
    Get all admin users pending activation
    """
    return (
        db.query(User)
        .options(joinedload(User.admin_user_profile))
        .filter(User.user_type == "admin", User.is_activated == False)
        .all()
    )


def assign_roles(db: Session, user: User, role_names: list[str]):
    # Directly replace the user's roles with the provided list
    user.roles = role_names
    db.commit()
    db.refresh(user)
    return user


def create_evacuation_center(
    db: Session, record: EvacuationCenterCreate
) -> EvacuationCenter:
    db_record = EvacuationCenter(
        name=record.name, lat=record.lat, lng=record.lng, capacity=record.capacity
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def create_response_report(db: Session, report: ResponseReportCreate) -> ResponseReport:
    db_report = ResponseReport(
        date_time=datetime.now(timezone.utc),
        report_type=report.report_type,
        status=report.status,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def create_demand_and_response_record(
    db: Session, demand_and_response: DemandAndResponseCreate
) -> DemandAndResponse:
    json_needs = [need.dict() for need in demand_and_response.needs]
    db_record = DemandAndResponse(
        title_label=demand_and_response.title_label,
        address=demand_and_response.address,
        lat=demand_and_response.lat,
        lng=demand_and_response.lng,
        status=demand_and_response.status,
        needs=json_needs,
        priority=demand_and_response.priority,
        submitted_at=datetime.now(timezone.utc),
        last_updated=datetime.now(timezone.utc),
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)

    return db_record


def create_modality_distribution_record(
    db: Session, modality_report: ModalityDistributionCreate
) -> ModalityDistribution:
    db_record = ModalityDistribution(
        date_time=datetime.now(timezone.utc),
        modality_type=modality_report.modality_type,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def create_in_kind_monitoring_record(
    db: Session, inkind_record: InKindMonitoringCreate
) -> InKindMonitoring:
    db_record = InKindMonitoring(
        date_time=datetime.now(timezone.utc),
        record_type=inkind_record.record_type,
        quantity=inkind_record.quantity,
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


def create_response_dashboard_budget_create(
    db: Session, response_budget: ResponseDashboardBudgetCreate
) -> ResponseReportBudget:
    latest_record = (
        db.query(ResponseReportBudget)
        .order_by(desc(ResponseReportBudget.date_time))
        .first()
    )

    previous_total = latest_record.total_amount if latest_record else 0

    if response_budget.budget_record_type == "Add":
        new_total = previous_total + response_budget.amount
    else:
        new_total = previous_total - response_budget.amount

    db_record = ResponseReportBudget(
        date_time=datetime.now(timezone.utc),
        budget_record_type=response_budget.budget_record_type,
        amount=response_budget.amount,
        total_amount=new_total,
    )

    db.add(db_record)
    db.commit()
    return db_record

def get_superadmins(db: Session) -> List[User]:
    return db.query(User).filter(User.roles.contains(["superadmin"])).all()

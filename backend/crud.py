from datetime import datetime, timezone
from sqlalchemy.orm import Session
from typing import List, Optional
from models import ResponseReport, User, FundingProposals
from auth import hash_password, verify_password
from schemas import ResponseReportCreate, FundingProposalCreate, FundingProposalUpdate

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
    print("by email")
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, username: str, user_type: str, password: str, roles: list[str] = []):
    hashed = hash_password(password)
    user_data = {
        "email": email,
        "username": username,
        "user_type": user_type,
        "hashed_password": hashed,
        "roles": roles or []
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

def assign_roles(db: Session, user: User, role_names: list[str]):
    # Directly replace the user's roles with the provided list
    user.roles = role_names
    db.commit()
    db.refresh(user)
    return user

def create_response_report(db: Session, report:ResponseReportCreate) -> ResponseReport:
    db_report = ResponseReport(
        date_time = datetime.now(timezone.utc),
        report_type = report.report_type,
        status = report.status
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

# FUNDING PROPOSALS CRUD FUNCTIONS
# Create a new funding proposal
def create_proposal(db: Session, proposal: FundingProposalCreate) -> FundingProposals:
    db_proposal = FundingProposals(
        title=proposal.title,
        description=proposal.description,
        budgetRequired=proposal.budgetRequired,
        status=proposal.status,
        image=proposal.image
    )
    db.add(db_proposal)
    db.commit()
    db.refresh(db_proposal)
    return db_proposal

# Get all proposals
def get_all_proposals(db: Session, skip: int = 0, limit: int = 100) -> List[FundingProposals]:
    return db.query(FundingProposals).offset(skip).limit(limit).all()

# Get a single proposal by ID
def get_proposal_by_id(db: Session, proposal_id: int) -> Optional[FundingProposals]:
    return db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()

# Update a proposal
def update_proposal(db: Session, proposal_id: int, proposal_update: FundingProposalUpdate) -> Optional[FundingProposals]:
    db_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
    if not db_proposal:
        return None

    for field, value in proposal_update.dict(exclude_unset=True).items():
        setattr(db_proposal, field, value)

    db.commit()
    db.refresh(db_proposal)
    return db_proposal

# Delete a proposal
def delete_proposal(db: Session, proposal_id: int) -> bool:
    db_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
    if not db_proposal:
        return False

    db.delete(db_proposal)
    db.commit()
    return True
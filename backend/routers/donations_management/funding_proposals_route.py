from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from database import get_db
from routers.role_checker import RoleChecker
from datetime import date, datetime
from math import ceil
from models import FundingProposal, User
from schemas import Number
from crud_functions.donations_management.funding_proposals import FundingProposalCRUD as CRUD
from crud_functions.utils import uid_from_string
from data_schemas.funding_proposal_schema import (
    FundingProposalCreate, FundingProposalUpdate, FundingProposalGet,
    FundingProposalResponse , FundingProposalResponsePaginated, FundingPieChart
)
from routers.auth.authentication import get_current_user_from_access_token

router = APIRouter()

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin", "superadmin"]))],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin",  "superuser", "generic", "donor", "superadmin"]))],
)

UPLOAD_DIR = Path("media/fundingproposals")

@router_admin_or_donor.get("/")
def get_proposals_route():
    return {"message": "This is funding proposals"}

@router.get("/proposals/all_proposals/", response_model=FundingProposalResponsePaginated)
def read_all_proposals(
    search: Optional[str] = Query(None),
    sort: str = Query("created_at", pattern="^(created_at|title)$"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    limit: Optional[int] = Query(None, ge=1),
    page: Optional[int] = Query(1, ge=1),
    db: Session = Depends(get_db)
):
    try:
        return CRUD.get_all_proposals(
            db=db,
            search=search,
            sort=sort,
            order=order,
            limit=limit,
            page=page
        )
    except Exception as e:
        print(f"Router error: {e}")
        raise HTTPException(status_code=500, detail="Error fetching proposals")

@router.get("/proposals/get_proposal/{funding_id}", response_model=FundingProposalGet)
def read_one_proposal(funding_id: str, db: Session = Depends(get_db)):
    try:
        proposal = CRUD.get_proposal_by_id(db=db, funding_id=funding_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        # Donors should not be able to donate to inactive proposals
        if not proposal['is_active']:
             raise HTTPException(status_code=403, detail="This funding proposal is not active.")
        return proposal
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching proposal: {e}")
        raise HTTPException(status_code=500, detail="Error fetching proposal")

@router_admin.post("/proposals/create", response_model=FundingProposalResponse)
def create_proposal_endpoint(
    title: str = Form(...),
    description: str = Form(...),
    budgetRequired: int = Form(...),
    image: Optional[UploadFile] = File(None),
    starting_date: date = Form(...),
    end_date: date = Form(...),
    db: Session = Depends(get_db)
):
    proposal_data = FundingProposalCreate(
        funding_id=uid_from_string(f"{title}{description}"),
        title=title,
        description=description,
        budgetRequired=budgetRequired,
        starting_date=datetime.combine(starting_date, datetime.min.time()),
        end_date=datetime.combine(end_date, datetime.max.time())
    )
    return CRUD.create_funding_proposal(db=db, proposal_data=proposal_data, image=image)

@router_admin.put("/proposals/update_proposal/{funding_id}", response_model=FundingProposalResponse)
def update_proposal_endpoint(
    funding_id: str,
    title: str = Form(...),
    description: str = Form(...),
    budgetRequired: int = Form(...),
    is_active: Optional[bool] = Form(None),
    image: Optional[UploadFile] = File(None),
    starting_date: Optional[date] = Form(None),
    end_date: Optional[date] = Form(None),
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db)
):
    user_is_superadmin = "superadmin" in current_user.roles
    print("is_superadmin: ", user_is_superadmin, is_active)
    start_datetime = datetime.combine(starting_date, datetime.min.time()) if starting_date else None
    end_datetime = datetime.combine(end_date, datetime.max.time()) if end_date else None

    return CRUD.update_proposal(
        db=db,
        funding_id=funding_id,
        title=title,
        description=description,
        budget_required=budgetRequired,
        is_active=is_active,
        image=image,
        starting_date=start_datetime,
        end_date=end_datetime,
        user_is_superadmin=user_is_superadmin
    )

@router_admin.delete("/proposals/delete_proposal/{funding_id}")
def delete_proposal_endpoint(funding_id: str, db: Session = Depends(get_db)):
    try:
        if not CRUD.delete_proposal(db, funding_id):
            raise HTTPException(status_code=404, detail="Proposal not found")
        return {"detail": "Proposal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail="Error deleting proposal")

@router.get("/proposals/get_limit", response_model=Number)
def get_max_page_of_limit(limit: int, db: Session = Depends(get_db)) -> int:
    total_records = db.query(FundingProposal).count()
    pages = ceil(total_records / limit) if limit > 0 else 1
    return {"count": pages}

@router.get("/total_holding", response_model=List[FundingPieChart])
def get_total_holding(
    date_since: date = Query(default=date.today().replace(year=date.today().year - 1), description="Start date (default: 1 year ago)"),
    date_to: date = Query(default=date.today(), description="End date (default: today)"),
    db: Session = Depends(get_db)
):
    response = CRUD.total_holding(db, date_since, date_to)
    print(response)
    return response

router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)

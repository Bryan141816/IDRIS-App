from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from database import get_db
from routers.role_checker import RoleChecker
from datetime import date
from math import ceil
from models import FundingProposals
from schemas import Number  
from crud_functions.donations_management.funding_proposals import FundingProposalCRUD  as CRUD

from data_schemas.funding_proposal_schema import ( 
    FundingProposalCreate, FundingProposalUpdate, FundingProposalGet, 
    FundingProposalResponse , FundingProposalResponsePaginated, FundingPieChart
    )

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor", "volunteer", "contributor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "donor", "volunteer", "contributor"]))],
)


UPLOAD_DIR = Path("media/fundingproposals")

@router_admin_or_donor.get("/")
def get_proposals_route():
    return {"message": "This is funding proposals"}

@router_admin_or_donor.get("/proposals/all_proposals/", response_model=FundingProposalResponsePaginated)
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

@router_admin.get("/proposals/get_proposal/{proposal_id}", response_model=FundingProposalGet)
def read_one_proposal(proposal_id: int, db: Session = Depends(get_db)):
    try:
        proposal = CRUD.get_proposal_by_id(db=db, proposal_id=proposal_id)
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
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
    status: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    proposal_data = FundingProposalCreate(
        title=title,
        description=description,
        budgetRequired=budgetRequired,
        status=status
    )
    return CRUD.create_funding_proposal(db=db, proposal_data=proposal_data, image=image)

@router_admin.put("/proposals/update_proposal/{proposal_id}", response_model=FundingProposalResponse)
def update_proposal_endpoint(
    proposal_id: int,
    title: str = Form(...),
    description: str = Form(...),
    budgetRequired: int = Form(...),
    status: str = Form("Active"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    return CRUD.update_proposal(
        db=db,
        proposal_id=proposal_id,
        title=title,
        description=description,
        budgetRequired=budgetRequired,
        status=status,
        image=image
    )
    
@router_admin.delete("/proposals/delete_proposal/{proposal_id}")
def delete_proposal_endpoint(proposal_id: int, db: Session = Depends(get_db)):
    try:
        if not CRUD.delete_proposal(db, proposal_id):
            raise HTTPException(status_code=404, detail="Proposal not found")
        return {"detail": "Proposal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail="Error deleting proposal")

@router_admin_or_donor.get("/proposals/get_limit", response_model=Number)
def get_max_page_of_limit(limit: int, db: Session = Depends(get_db)) -> int:
    total_records = db.query(FundingProposals).count()
    pages = ceil(total_records / limit) if limit > 0 else 1
    return {"count": pages}

router = APIRouter()

@router.get("/total_holding", response_model=List[FundingPieChart])
def get_total_holding(
    date_since: date = Query(default=date.today().replace(year=date.today().year - 1), description="Start date (default: 1 year ago)"),
    date_to: date = Query(default=date.today(), description="End date (default: today)"),
    db: Session = Depends(get_db)
):
    return CRUD.total_holding(db, date_since, date_to)


# router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)

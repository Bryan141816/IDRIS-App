import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from database import get_db
from models import Donor, User
from schemas import Number
from routers.role_checker import RoleChecker

from routers.auth.authentication import get_current_user_from_access_token

from data_schemas.donors_schema import (
    DonorResponse, 
    DonorListResponse, 
    DonorStatsResponse,
    ListOfDonorsResponse,
    DonorAllAttributes,
    IndividualDonorProfile,
)

from crud_functions.donations_management.donors import donor_crud
from crud_functions.utils import uid_from_string

router = APIRouter()

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin", "superuser"]))],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin",  "superuser", "generic"]))],
)


@router_admin_or_donor.post("/create_donor", response_model=DonorResponse)  # mark used
def create_individual_donor_endpoint(
    user_id: str = Form(...),
    donor_type: Optional[str] = Form("Individual"),
    organization_name: Optional[str] = Form(None),
    date_joined: Optional[datetime.date] = Form(None),
    is_verified: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        existing = db.query(Donor).filter(Donor.user_id == user_id).first()
        
        if existing:
            if not user.roles:
                user.roles = []
            if "donor" not in user.roles:
                user.roles.append("donor")
                db.add(user)
                db.commit()
                db.refresh(user)
            return existing
 
        if donor_type.lower() == "individual":
            organization_name = None

        new_donor = donor_crud.create_donor(
            db=db,
            donor_id = uid_from_string(f"{user.username}{date_joined}"),
            user_id=user_id,
            donor_type = donor_type,
            organization_name=organization_name,
            date_joined=date_joined,
            is_verified=is_verified
        )
        
        db.refresh(user)  # ensure working with the latest row
        if not user.roles:
            user.roles = []
        if "donor" not in user.roles:
            user.roles = [*user.roles, "donor"]  # assign new list to ensure SQLAlchemy change tracking
            db.add(user)
            db.commit()
            db.refresh(user)

        return new_donor
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Server crashed: {str(e)}"
        )

# ============================================================================
# READ ENDPOINTS - SINGLE RECORDS
# ============================================================================

@router_admin.get("/get_by_id/{donor_id}", response_model=DonorResponse) 
def get_donor_endpoint(
    donor_id: int,
    db: Session = Depends(get_db)
):
    """Get a donor by their DONOR ID."""
    donor = donor_crud.get_donor_by_id(db, donor_id)
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    return donor

@router_admin.get("/user/{user_id}", response_model=DonorAllAttributes) 
def get_donor_by_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a donor by their associated USER ID."""
    donor = donor_crud.get_donor_by_user_id(db, user_id)
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found for this user"
        )
    return donor

@router_admin_or_donor.get("/user_profile", response_model=IndividualDonorProfile)
def get_donor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_from_access_token),
):
    donor_profile = donor_crud.get_donor_profile_by_user_id(db, current_user.user_id)
    if not donor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor profile not found for this user"
        )
    return donor_profile

# ============================================================================
# READ ENDPOINTS - MULTIPLE RECORDS & FILTERING
# ============================================================================

@router.get("/get_all_as_lists", response_model=ListOfDonorsResponse) # mark used
def get_donor_display_info_endpoint(
    search: Optional[str] = Query(None),    
    page: int = Query(1, ge=1),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all donors with pagination."""
    return donor_crud.get_donor_display_info(db, search=search, page=page, limit=limit)

@router_admin_or_donor.get("/count", response_model=Number) # mark used
def count_donors(
    search: Optional[str] = Query(None, description="email/username"),
    donor_type: Optional[str] = Query(None, description="Filter by Organization or Individual"),
    db: Session = Depends(get_db)
):
    count = donor_crud.count_donors(db, search=search, donor_type=donor_type)    
    return {"count": count}


@router_admin_or_donor.get("/verified/list", response_model=DonorListResponse) 
def get_verified_donors_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all verified donors."""
    donors = donor_crud.get_verified_donors(db, skip=skip, limit=limit)
    # Count verified donors
    total = sum(1 for d in donor_crud.get_all_donors(db, skip=0, limit=10000) if d.is_verified)
    
    return DonorListResponse(
        donors=donors,
        total=total,
        skip=skip,
        limit=limit
    )


@router_admin_or_donor.get("/search/name", response_model=List[DonorResponse]) # mark used
def search_donors_by_name_endpoint(
    name: str = Query(..., min_length=1),
    db: Session = Depends(get_db)
):
    """Search donors by name (case-insensitive partial match)."""
    donors = donor_crud.get_donors_by_name(db, name)
    return donors


# ============================================================================
# READ ENDPOINTS - STATISTICS
# ============================================================================

@router_admin_or_donor.get("/stats/overview", response_model=DonorStatsResponse)
def get_donor_stats_endpoint(db: Session = Depends(get_db)):
    """Get comprehensive donor statistics."""
    stats = donor_crud.get_donor_stats(db)
    return DonorStatsResponse(**stats)


# ============================================================================
# UPDATE ENDPOINTS
# ============================================================================

@router_admin.patch("/{donor_id}/verify", response_model=DonorResponse)
def verify_donor_endpoint(
    donor_id: int,
    db: Session = Depends(get_db)
):
    """Mark a donor as verified."""
    
    if not donor_crud.donor_exists(db, donor_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    
    try:
        verified_donor = donor_crud.verify_donor(db, donor_id)
        return verified_donor
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify donor: {str(e)}"
        )


@router_admin.patch("/{donor_id}/unverify", response_model=DonorResponse)
def unverify_donor_endpoint(
    donor_id: int,
    db: Session = Depends(get_db)
):
    """Mark a donor as unverified."""
    
    if not donor_crud.donor_exists(db, donor_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    
    try:
        unverified_donor = donor_crud.unverify_donor(db, donor_id)
        return unverified_donor
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unverify donor: {str(e)}"
        )

# ============================================================================
# DELETE ENDPOINTS
# ============================================================================

@router_admin.delete("/{donor_id}/delete")
def delete_donor_endpoint(
    donor_id: int,
    db: Session = Depends(get_db)
):
    """Delete a donor (hard delete)."""
    
    if not donor_crud.donor_exists(db, donor_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    
    try:
        success = donor_crud.delete_donor(db, donor_id)
        if success:
            return {"message": "Donor deleted successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete donor"
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete donor: {str(e)}"
        )

@router.get("/me/donor_id")
def fetch_donor_id(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    donor_id = donor_crud.get_donor_id_by_user_id(db, current_user.user_id)
    return donor_id

# router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)

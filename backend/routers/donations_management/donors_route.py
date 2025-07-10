import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List
from database import get_db  # Adjust import path
from models import Donors
from schemas import Number
from routers.role_checker import RoleChecker

from data_schemas.donors_schema import (
    DonorResponse, 
    DonorListResponse, 
    DonorStatsResponse,
    ListOfDonorsResponse,
    IndividualDonorCreate,
    DonorUpdate,
    DonorAllAttributes
)

from crud_functions.donations_management.donors import donor_crud

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor", "volunteer", "contributor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["operations admin", "superuser", "donor", "volunteer", "contributor"]))],
)


@router_admin.post("/create/", response_model=DonorResponse)  # mark used
def create_individual_donor_endpoint(
    user_id: int = Form(...),
    donor_type: Optional[str] = Form("Individual"),
    organization_name: Optional[str] = Form(None),
    date_joined: Optional[datetime.date] = Form(None),
    is_verified: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    try:
        print("Calling create_donor()...")
        new_donor = donor_crud.create_donor(
            db=db,
            user_id=user_id,
            donor_type = donor_type,
            organization_name=organization_name,
            date_joined=date_joined,
            is_verified=is_verified
        )
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


# ============================================================================
# READ ENDPOINTS - MULTIPLE RECORDS & FILTERING
# ============================================================================

@router_admin_or_donor.get("/get_all_as_lists", response_model=ListOfDonorsResponse) # mark used
def get_donor_display_info_endpoint(
    search: Optional[str] = Query(None),    
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all donors with pagination."""
    donors = donor_crud.get_donor_display_info(db, search=search, skip=skip, limit=limit)
    total = donor_crud.count_donors(db)
    
    return ListOfDonorsResponse(
        donors=donors,
        total=total,
        skip=skip,
        limit=limit
    )

@router_admin.get("/count", response_model=Number) # mark used
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

router = APIRouter()
router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)

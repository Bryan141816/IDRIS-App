
from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db  # Adjust import path
from data_schemas.donors_schema import (
    DonorResponse, 
    DonorListResponse, 
    DonorStatsResponse,
    ListOfDonorsResponse,
    IndividualDonorCreate,
    DonorUpdate,
    DonorAllAttributes
)

from crud_functions.donors import donor_crud

router = APIRouter()

@router.post("/create", response_model=DonorResponse)
def create_individual_donor_endpoint(
    user_id: int = Form(...),
    organization_name: Optional[str] = None,
    is_verified: Optional[bool] = Form(False),
    db: Session = Depends(get_db)
):
    """Create a new donor linked to a user."""
    
    # Check if user already has a donor profile
    if donor_crud.user_has_donor_profile(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a donor profile"
        )
    
    try:
        new_donor = donor_crud.create_individual_donor(
            db=db,
            user_id=user_id,
            organization_name = organization_name,
            is_verified=is_verified
        )
        return new_donor
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create individual donor: {str(e)}"
        )


@router.get("/get_donors_list/", response_model=DonorListResponse)
def get_donors_list(
    search: str = Query(None),
    order: str = Query("desc", regex="^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all donors with search, ordering, and pagination."""
    try:
        # Get donors with search, ordering, and pagination
        donors = donor_crud.get_all_donors(
            db, 
            search=search, 
            order=order, 
            skip=skip, 
            limit=limit
        )
        
        # Get total count (with search filter if provided)
        total = donor_crud.count_donors(db, search=search)
        
        return DonorListResponse(
            donors=donors,
            total=total,
            skip=skip,
            limit=limit
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving donors: {str(e)}"
        )
# ============================================================================
# READ ENDPOINTS - SINGLE RECORDS
# ============================================================================

@router.get("/get_by_id/{donor_id}", response_model=DonorResponse)
def get_donor_endpoint(
    donor_id: int,
    db: Session = Depends(get_db)
):
    """Get a donor by their ID."""
    donor = donor_crud.get_donor_by_id(db, donor_id)
    if not donor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    return donor


@router.get("/user/{user_id}", response_model=DonorAllAttributes)
def get_donor_by_user_endpoint(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Get a donor by their associated user ID."""
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

@router.get("/get_all", response_model=DonorListResponse)
def get_all_donors_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all donors with pagination."""
    donors = donor_crud.get_all_donors(db, skip=skip, limit=limit)
    total = donor_crud.count_donors(db)
    
    return DonorListResponse(
        donors=donors,
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/get_all_as_lists", response_model=ListOfDonorsResponse)
def get_donor_display_info_endpoint(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get all donors with pagination."""
    donors = donor_crud.get_donor_display_info(db, skip=skip, limit=limit)
    total = donor_crud.count_donors(db)
    
    return ListOfDonorsResponse(
        donors=donors,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/type/{donor_type}", response_model=DonorListResponse)
def get_donors_by_type_endpoint(
    donor_type: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db)
):
    """Get donors by type (Individual or Organization)."""
    if donor_type not in ["Individual", "Organization"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid donor type. Must be 'Individual' or 'Organization'"
        )
    
    donors = donor_crud.get_donors_by_type(db, donor_type, skip=skip, limit=limit)
    # Get count for this specific type
    total = len(donor_crud.get_donors_by_type(db, donor_type, skip=0, limit=10000))  # Or create a count method
    
    return DonorListResponse(
        donors=donors,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/verified/list", response_model=DonorListResponse)
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


@router.get("/search/name", response_model=List[DonorResponse])
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

@router.get("/stats/overview", response_model=DonorStatsResponse)
def get_donor_stats_endpoint(db: Session = Depends(get_db)):
    """Get comprehensive donor statistics."""
    stats = donor_crud.get_donor_stats(db)
    return DonorStatsResponse(**stats)


# ============================================================================
# UPDATE ENDPOINTS
# ============================================================================

@router.put("/{donor_id}/update", response_model=DonorResponse)
def update_donor_endpoint(
    donor_id: int,
    name: Optional[str] = Form(None),
    is_verified: Optional[bool] = Form(None),
    db: Session = Depends(get_db)
):
    """Update a donor's information."""
    
    # Check if donor exists
    if not donor_crud.donor_exists(db, donor_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donor not found"
        )
    
    # Prepare update data
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if is_verified is not None:
        update_data["is_verified"] = is_verified
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No update data provided"
        )
    
    try:
        updated_donor = donor_crud.update_donor(db, donor_id, update_data)
        return updated_donor
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update donor: {str(e)}"
        )


@router.patch("/{donor_id}/verify", response_model=DonorResponse)
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


@router.patch("/{donor_id}/unverify", response_model=DonorResponse)
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

@router.delete("/{donor_id}/delete")
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


# ============================================================================
# UTILITY ENDPOINTS
# ============================================================================

@router.get("/{donor_id}/exists")
def check_donor_exists_endpoint(
    donor_id: int,
    db: Session = Depends(get_db)
):
    """Check if a donor exists."""
    exists = donor_crud.donor_exists(db, donor_id)
    return {"exists": exists}


@router.get("/user/{user_id}/has-profile")
def check_user_has_donor_profile_endpoint(
    user_id: int,
    db: Session = Depends(get_db)
):
    """Check if a user has a donor profile."""
    has_profile = donor_crud.user_has_donor_profile(db, user_id)
    return {"has_donor_profile": has_profile}


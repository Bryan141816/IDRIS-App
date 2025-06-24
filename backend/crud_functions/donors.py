from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from models import Donors

# CREATE Operations
class DonorCRUD:
    def create_individual_donor(self, db: Session, user_id: int, name: str, is_verified: bool = False) -> Donors:
        """
        Create a new individual donor linked to a user.
        
        Args:
            db: Database session
            user_id: ID of the user
            name: Donor name
            is_verified: Verification status (default: False)
        
        Returns:
            Created Donors object
        
        Raises:
            HTTPException: If creation fails due to constraint violations
        """
        try:
            db_donor = Donors(
                user_id=user_id,
                organization_id=None,
                name=name,
                donor_type="Individual",
                is_verified=is_verified
            )
            db.add(db_donor)
            db.commit()
            db.refresh(db_donor)
            return db_donor
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create individual donor: {str(e)}"
            )


    def create_organization_donor(self, db: Session, organization_id: int, name: str, is_verified: bool = False) -> Donors:
        """
        Create a new organization donor linked to an organization.
        
        Args:
            db: Database session
            organization_id: ID of the organization
            name: Donor name
            is_verified: Verification status (default: False)
        
        Returns:
            Created Donors object
        
        Raises:
            HTTPException: If creation fails due to constraint violations
        """
        try:
            db_donor = Donors(
                user_id=None,
                organization_id=organization_id,
                name=name,
                donor_type="Organization",
                is_verified=is_verified
            )
            db.add(db_donor)
            db.commit()
            db.refresh(db_donor)
            return db_donor
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create organization donor: {str(e)}"
            )


    # READ Operations
    def get_donor_by_id(self, db: Session, donor_id: int) -> Optional[Donors]:
        """
        Retrieve a donor by their ID.
        
        Args:
            db: Database session
            donor_id: ID of the donor
        
        Returns:
            Donors object if found, None otherwise
        """
        return db.query(Donors).filter(Donors.donorId == donor_id).first()


    def get_donor_by_user_id(self, db: Session, user_id: int) -> Optional[Donors]:
        """
        Retrieve a donor by their associated user ID.
        
        Args:
            db: Database session
            user_id: ID of the user
        
        Returns:
            Donors object if found, None otherwise
        """
        return db.query(Donors).filter(
            Donors.user_id == user_id,
            Donors.donor_type == "Individual"
        ).first()


    def get_donor_by_organization_id(self, db: Session, organization_id: int) -> Optional[Donors]:
        """
        Retrieve a donor by their associated organization ID.
        
        Args:
            db: Database session
            organization_id: ID of the organization
        
        Returns:
            Donors object if found, None otherwise
        """
        return db.query(Donors).filter(
            Donors.organization_id == organization_id,
            Donors.donor_type == "Organization"
        ).first()


    def get_donors_by_type(self, db: Session, donor_type: str, skip: int = 0, limit: int = 100) -> List[Donors]:
        """
        Retrieve donors by their type with pagination.
        
        Args:
            db: Database session
            donor_type: Type of donor ("Individual" or "Organization")
            skip: Number of records to skip (default: 0)
            limit: Maximum number of records to return (default: 100)
        
        Returns:
            List of Donors objects
        """
        return db.query(Donors).filter(
            Donors.donor_type == donor_type
        ).offset(skip).limit(limit).all()


    def get_verified_donors(self, db: Session, skip: int = 0, limit: int = 100) -> List[Donors]:
        """
        Retrieve all verified donors with pagination.
        
        Args:
            db: Database session
            skip: Number of records to skip (default: 0)
            limit: Maximum number of records to return (default: 100)
        
        Returns:
            List of verified Donors objects
        """
        return db.query(Donors).filter(
            Donors.is_verified == True
        ).offset(skip).limit(limit).all()


    def get_donors_by_name(self, db: Session, name: str) -> List[Donors]:
        """
        Search donors by name (case-insensitive partial match).
        
        Args:
            db: Database session
            name: Name to search for
        
        Returns:
            List of matching Donors objects
        """
        return db.query(Donors).filter(
            Donors.name.ilike(f"%{name}%")
        ).all()


    def get_all_donors(
        self, 
        db: Session, 
        search: str = None, 
        order: str = "desc", 
        skip: int = 0, 
        limit: int = 100
    ) -> List[Donors]:
        """
        Retrieve all donors with search, ordering, and pagination.
        
        Args:
            db: Database session
            search: Search term to filter donors (optional)
            order: Sort order - 'asc' or 'desc' (default: 'desc')
            skip: Number of records to skip (default: 0)
            limit: Maximum number of records to return (default: 100)
        
        Returns:
            List of Donors objects matching the criteria
        """
        query = db.query(Donors)
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Donors.first_name.ilike(search_term),
                    Donors.last_name.ilike(search_term),
                    Donors.email.ilike(search_term),
                    Donors.phone.ilike(search_term)
                    # Add other searchable fields as needed
                )
            )
        
        # Apply ordering (adjust field name based on your model)
        if order == "asc":
            query = query.order_by(Donors.date_joined.asc())  # or Donors.id.asc()
        else:
            query = query.order_by(Donors.date_joined.desc())  # or Donors.id.desc()
        
        return query.offset(skip).limit(limit).all()


    def count_donors(self, db: Session, search: str = None) -> int:
        """
        Count total number of donors with optional search filter.
        
        Args:
            db: Database session
            search: Search term to filter donors (optional)
        
        Returns:
            Total count of donors matching the criteria
        """
        query = db.query(Donors)
        
        # Apply same search filter for accurate count
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Donors.first_name.ilike(search_term),
                    Donors.last_name.ilike(search_term),
                    Donors.email.ilike(search_term),
                    Donors.phone.ilike(search_term)
                    # Add other searchable fields as needed
                )
            )
    
        return query.count()

    def count_donors_by_type(self, db: Session, donor_type: str) -> int:
        """
        Get count of donors by type.
        
        Args:
            db: Database session
            donor_type: Type of donor ("Individual" or "Organization")
        
        Returns:
            Number of donors of specified type
        """
        return db.query(Donors).filter(Donors.donor_type == donor_type).count()


    # UPDATE Operations
    def update_donor(self, db: Session, donor_id: int, update_data: Dict[str, Any]) -> Optional[Donors]:
        """
        Update a donor's information.
        
        Args:
            db: Database session
            donor_id: ID of the donor to update
            update_data: Dictionary containing fields to update
        
        Returns:
            Updated Donors object if found, None otherwise
        
        Raises:
            HTTPException: If update fails due to constraint violations
        """
        db_donor = db.query(Donors).filter(Donors.donorId == donor_id).first()
        if not db_donor:
            return None
        
        try:
            for field, value in update_data.items():
                if hasattr(db_donor, field):
                    setattr(db_donor, field, value)
            
            db.commit()
            db.refresh(db_donor)
            return db_donor
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update donor: {str(e)}"
            )


    def verify_donor(self, db: Session, donor_id: int) -> Optional[Donors]:
        """
        Mark a donor as verified.
        
        Args:
            db: Database session
            donor_id: ID of the donor to verify
        
        Returns:
            Updated Donors object if found, None otherwise
        """
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": True})


    def unverify_donor(self, db: Session, donor_id: int) -> Optional[Donors]:
        """
        Mark a donor as unverified.
        
        Args:
            db: Database session
            donor_id: ID of the donor to unverify
        
        Returns:
            Updated Donors object if found, None otherwise
        """
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": False})


    def update_donor_name(self, db: Session, donor_id: int, new_name: str) -> Optional[Donors]:
        """
        Update a donor's name.
        
        Args:
            db: Database session
            donor_id: ID of the donor
            new_name: New name for the donor
        
        Returns:
            Updated Donors object if found, None otherwise
        """
        return DonorCRUD.update_donor(db, donor_id, {"name": new_name})


    # DELETE Operations
    def delete_donor(self, db: Session, donor_id: int) -> bool:
        """
        Delete a donor by ID.
        
        Args:
            db: Database session
            donor_id: ID of the donor to delete
        
        Returns:
            True if deleted successfully, False if donor not found
        
        Raises:
            HTTPException: If deletion fails due to foreign key constraints
        """
        db_donor = db.query(Donors).filter(Donors.donorId == donor_id).first()
        if not db_donor:
            return False
        
        try:
            db.delete(db_donor)
            db.commit()
            return True
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete donor due to existing references: {str(e)}"
            )


    def soft_delete_donor(self, db: Session, donor_id: int) -> Optional[Donors]:
        """
        Soft delete a donor by marking as unverified (alternative approach).
        Note: This assumes you want to keep the record but mark it as inactive.
        
        Args:
            db: Database session
            donor_id: ID of the donor to soft delete
        
        Returns:
            Updated Donors object if found, None otherwise
        """
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": False})


    # UTILITY Functions
    def donor_exists(self, db: Session, donor_id: int) -> bool:
        """
        Check if a donor exists.
        
        Args:
            db: Database session
            donor_id: ID of the donor
        
        Returns:
            True if donor exists, False otherwise
        """
        return db.query(Donors).filter(Donors.donorId == donor_id).first() is not None


    def user_has_donor_profile(self, db: Session, user_id: int) -> bool:
        """
        Check if a user already has a donor profile.
        
        Args:
            db: Database session
            user_id: ID of the user
        
        Returns:
            True if user has donor profile, False otherwise
        """
        return db.query(Donors).filter(
            Donors.user_id == user_id,
            Donors.donor_type == "Individual"
        ).first() is not None


    def organization_has_donor_profile(self, db: Session, organization_id: int) -> bool:
        """
        Check if an organization already has a donor profile.
        
        Args:
            db: Database session
            organization_id: ID of the organization
        
        Returns:
            True if organization has donor profile, False otherwise
        """
        return db.query(Donors).filter(
            Donors.organization_id == organization_id,
            Donors.donor_type == "Organization"
        ).first() is not None


    def get_donor_stats(self, db: Session) -> Dict[str, int]:
        """
        Get donor statistics.
        
        Args:
            db: Database session
        
        Returns:
            Dictionary containing various donor statistics
        """
        total_donors = DonorCRUD.count_donors(db)
        individual_donors = DonorCRUD.count_donors_by_type(db, "Individual")
        organization_donors = DonorCRUD.count_donors_by_type(db, "Organization")
        verified_donors = db.query(Donors).filter(Donors.is_verified == True).count()
        
        return {
            "total_donors": total_donors,
            "individual_donors": individual_donors,
            "organization_donors": organization_donors,
            "verified_donors": verified_donors,
            "unverified_donors": total_donors - verified_donors
        }
        
donor_crud = DonorCRUD()
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import nulls_last
from sqlalchemy import or_, asc, desc, func
from typing import Optional, List, Dict, Any
from math import ceil
import datetime
from fastapi import HTTPException, status
from models import Donors, User, DonationRecords
from data_schemas.donors_schema import ListOfDonorsResponse, IndividualDonorProfile, DonorItem

# CREATE Operations
class DonorCRUD:
    @staticmethod
    def create_donor(db: Session, 
                     user_id: int, 
                     donor_type: Optional[str] = "Individual",
                     organization_name: Optional[str] = None, 
                     date_joined: Optional[datetime.date] = None, 
                     is_verified: Optional[bool] = False
                    ) -> Donors:
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
                organization_name = organization_name,
                date_joined = date_joined,
                donor_type = donor_type,
                is_verified = is_verified
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

    # READ Operations
    @staticmethod
    def get_donor_by_id(db: Session, donor_id: int) -> Optional[Donors]:
        """
        Retrieve a donor by their ID.
        
        Args:
            db: Database session
            donor_id: ID of the donor
        
        Returns:
            Donors object if found, None otherwise
        """
        return db.query(Donors).filter(Donors.donorId == donor_id).first()

    @staticmethod
    def get_donor_by_user_id(db: Session, user_id: int) -> Optional[Donors]:
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

    @staticmethod
    def get_verified_donors(db: Session, skip: int = 0, limit: int = 100) -> List[Donors]:
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

    @staticmethod
    def get_donors_by_name(db: Session, name: str) -> List[Donors]:
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

    @staticmethod
    def get_all_donors(
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
        query = db.query(Donors).options(joinedload(Donors.user))
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Donors.first_name.ilike(search_term),
                    Donors.last_name.ilike(search_term),
                    Donors.email.ilike(search_term),
                    Donors.phone.ilike(search_term),
                    User.username.ilike(search_term)  
                    # Add other searchable fields as needed
                )
            ).join(User)
        
        # Apply ordering (adjust field name based on your model)
        if order == "asc":
            query = query.order_by(Donors.date_joined.asc())  # or Donors.id.asc()
        else:
            query = query.order_by(Donors.date_joined.desc())  # or Donors.id.desc()
        
        return query.offset(skip).limit(limit).all()

    @staticmethod
    def count_donors( # mark used
        db: Session, 
        search: Optional[str] = None, 
        donor_type: Optional[str] = None
    ) -> int:
        """
        Count donors, optionally filtering by search term and donor type.

        Args:
            db: SQLAlchemy session
            search: Optional search term (name/email/phone)
            donor_type: Optional donor type ("Individual" or "Organization")

        Returns:
            int: Number of donors matching the criteria
        """
        query = db.query(Donors)

        if search:
            search_term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Donors.first_name.ilike(search_term),
                    Donors.last_name.ilike(search_term),
                    Donors.email.ilike(search_term),
                    Donors.phone.ilike(search_term),
                )
            )

        if donor_type:
            query = query.filter(Donors.donor_type == donor_type)

        return query.count()

    # UPDATE Operations
    @staticmethod
    def update_donor(db: Session, donor_id: int, update_data: Dict[str, Any]) -> Optional[Donors]:
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

    @staticmethod
    def verify_donor(db: Session, donor_id: int) -> Optional[Donors]:
        """
        Mark a donor as verified.
        
        Args:
            db: Database session
            donor_id: ID of the donor to verify
        
        Returns:
            Updated Donors object if found, None otherwise
        """
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": True})

    @staticmethod
    def unverify_donor(db: Session, donor_id: int) -> Optional[Donors]:
        """
        Mark a donor as unverified.
        
        Args:
            db: Database session
            donor_id: ID of the donor to unverify
        
        Returns:
            Updated Donors object if found, None otherwise
        """
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": False})

    # DELETE Operations
    @staticmethod
    def delete_donor(db: Session, donor_id: int) -> bool:
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

    # UTILITY Functions
    @staticmethod
    def donor_exists(db: Session, donor_id: int) -> bool:
        """
        Check if a donor exists.
        
        Args:
            db: Database session
            donor_id: ID of the donor
        
        Returns:
            True if donor exists, False otherwise
        """
        return db.query(Donors).filter(Donors.donorId == donor_id).first() is not None

    @staticmethod
    def get_donor_stats(db: Session) -> Dict[str, int]:
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
    
    @staticmethod
    def get_donor_display_info(        
        db: Session, 
        search: Optional[str] = None, 
        order: str = "desc", 
        page: int = 1, 
        limit: Optional[int] = 100
    ) -> ListOfDonorsResponse:
        try:
            UserAlias = aliased(User)

            # Base query
            query = (
                db.query(Donors)
                .join(UserAlias, Donors.user_id == UserAlias.id, isouter=True)
                .options(joinedload(Donors.user))
            )

            # Search filter
            if search:
                search_term = f"%{search.strip()}%"
                query = query.filter(
                    or_(
                        Donors.organization_name.ilike(search_term),
                        UserAlias.username.ilike(search_term)
                    )
                )

            # Total count before pagination
            total_count = query.count()

            # Ordering
            if order == "asc":
                query = query.order_by(
                    nulls_last(asc(Donors.organization_name)),
                    nulls_last(asc(UserAlias.username)),
                    asc(Donors.date_joined)
                )
            else:
                query = query.order_by(
                    nulls_last(desc(Donors.organization_name)),
                    nulls_last(desc(UserAlias.username)),
                    desc(Donors.date_joined)
                )

            # Pagination
            if limit:
                offset = (page - 1) * limit
                query = query.offset(offset).limit(limit)
                max_page = max(ceil(total_count / limit), 1)
            else:
                max_page = 1  # fallback if no pagination

            donors = query.all()

            # Build response
            records = []
            for donor in donors:
                if donor.donor_type == "Individual" and donor.user:
                    display_name = donor.user.username
                else:
                    display_name = donor.organization_name or "Unknown Organization"

                # Calculate total donation (cash + in-kind)
                total_donation = db.query(
                    func.coalesce(func.sum(DonationRecords.amount), 0) +
                    func.coalesce(func.sum(DonationRecords.estimated_value), 0)
                ).filter(
                    DonationRecords.donor_id == donor.donorId,
                    DonationRecords.status == 'COMPLETED'
                ).scalar()

                records.append(DonorItem(
                    name=display_name,
                    organization_name=donor.organization_name,
                    total_donation=float(total_donation or 0),
                    date_joined=donor.date_joined
                ))
            return ListOfDonorsResponse(
                max_page=max_page,
                donors = records
            )

        except Exception as e:
            print(f"Error fetching donors: {e}")
            raise    

    @staticmethod
    def get_donor_profile_by_user_id(db: Session, user_id: int) -> IndividualDonorProfile | None:
        donor = db.query(Donors).filter(Donors.user_id == user_id).first()

        if donor is None:
            return None

        # Manual conversion to Pydantic schema
        return IndividualDonorProfile(
            donorId=donor.donorId,
            donor_name = donor.donor_name,
            donor_type=donor.donor_type,
            is_verified=donor.is_verified,
            date_joined=donor.date_joined,
            last_updated=donor.last_updated
        )

donor_crud = DonorCRUD()
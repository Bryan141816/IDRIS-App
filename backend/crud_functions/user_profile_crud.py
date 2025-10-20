from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List, Optional

from models import UserProfile


class UserProfileCRUD:
    """CRUD operations for UserProfile — currently only read functions."""

    @staticmethod
    def get_all_user_profiles(db: Session) -> List[UserProfile]:
        """
        Returns all user profiles from the database.
        """
        try:
            return db.query(UserProfile).all()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching user profiles: {e}")

    @staticmethod
    def get_user_profile_by_id(db: Session, user_profile_id: str) -> Optional[UserProfile]:
        """
        Returns a single user profile by its unique user_profile_id.
        """
        try:
            user_profile = (
                db.query(UserProfile)
                .filter(UserProfile.user_profile_id == user_profile_id)
                .first()
            )
            if not user_profile:
                raise HTTPException(status_code=404, detail="User profile not found")
            return user_profile
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching user profile: {e}")

    @staticmethod
    def get_user_profile_by_user_id(db: Session, user_id: str) -> Optional[UserProfile]:
        """
        Returns a user profile using the foreign key user_id.
        """
        try:
            user_profile = (
                db.query(UserProfile)
                .filter(UserProfile.user_id == user_id)
                .first()
            )
            if not user_profile:
                raise HTTPException(status_code=404, detail="User profile not found")
            return user_profile
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching user profile by user_id: {e}")

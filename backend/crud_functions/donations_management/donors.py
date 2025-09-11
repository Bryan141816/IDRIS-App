from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import nulls_last
from sqlalchemy import or_, asc, desc, func
from typing import Optional, List, Dict, Any, Set
from math import ceil
from fastapi import HTTPException, status

from models import Donor, User, Donation, DonationStatus, Donation_Cash, Donation_InKind, DonationType
from data_schemas.donors_schema import DonorItem, ListOfDonorsResponse, IndividualDonorProfile
from crud_functions.utils import uid_from_string, _norm_type, is_unique_violation_on
import datetime, random


class DonorCRUD:
    # CREATE
    @staticmethod
    def create_donor(
        db: Session,
        donor_id: int,
        user_id: int,
        donor_type: Optional[str] = "individual",
        organization_name: Optional[str] = None,
        date_joined: Optional[datetime.datetime] = None,
        is_verified: Optional[bool] = False,
        *,
        max_attempts: int = 10,
    ) -> Donor:
        """
        Create a donor and ensure a random 8-digit donor_id.
        Retries on PK/unique collisions (SQLSTATE 23505) for donors.donor_id.
        """
        normalized_type = _norm_type(donor_type) or "individual"
        table_name = Donor.__tablename__  # "donors"

        last_err: Optional[IntegrityError] = None

        for attempt in range(1, max_attempts + 1):
            try:
                db_donor = Donor(
                    donor_id=donor_id,
                    user_id=user_id,
                    organization_name=organization_name,
                    date_joined=date_joined,
                    donor_type=normalized_type,
                    is_verified=is_verified,
                )

                db.add(db_donor)
                db.flush()  # raises IntegrityError if collision
                db.commit()
                db.refresh(db_donor)
                return db_donor

            except IntegrityError as e:
                db.rollback()
                last_err = e

                # Retry ONLY if it's a donors.donor_id collision
                if is_unique_violation_on(
                    e,
                    table=table_name,
                    column="donor_id",
                    extra_constraint_names={"donors_donor_id_key"},
                ) and attempt < max_attempts:
                    continue

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to create donor: {str(e)}",
                )

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Failed to assign a unique 8-digit donor_id after multiple attempts."
                   + (f" Last error: {last_err}" if last_err else "")
        )

    # READ
    @staticmethod
    def get_donor_by_id(db: Session, donor_id: int) -> Optional[Donor]:
        return db.query(Donor).filter(Donor.donor_id == donor_id).first()

    @staticmethod
    def get_donor_by_user_id(db: Session, user_id: int) -> Optional[Donor]:
        return (
            db.query(Donor)
            .filter(Donor.user_id == user_id, Donor.donor_type == "individual")
            .first()
        )

    @staticmethod
    def get_verified_donors(db: Session, skip: int = 0, limit: int = 100) -> List[Donor]:
        return (
            db.query(Donor)
            .filter(Donor.is_verified.is_(True))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_donors_by_name(db: Session, name: str) -> List[Donor]:
        """
        Case-insensitive partial match on organization_name OR linked user's username.
        """
        term = f"%{name.strip()}%"
        UserAlias = aliased(User)
        return (
            db.query(Donor)
            .join(UserAlias, Donor.user_id == UserAlias.user_id, isouter=True)
            .filter(or_(Donor.organization_name.ilike(term), UserAlias.username.ilike(term)))
            .all()
        )

    @staticmethod
    def get_all_donors(
        db: Session,
        search: Optional[str] = None,
        order: str = "desc",
        skip: int = 0,
        limit: int = 100,
    ) -> List[Donor]:
        """
        List Donor with optional search (org name / username / email), ordering, pagination.
        """
        UserAlias = aliased(User)
        query = (
            db.query(Donor)
            .join(UserAlias, Donor.user_id == UserAlias.user_id, isouter=True)
            .options(joinedload(Donor.user))
        )

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Donor.organization_name.ilike(term),
                    UserAlias.username.ilike(term),
                    UserAlias.email.ilike(term),
                )
            )

        if order == "asc":
            query = query.order_by(
                nulls_last(asc(Donor.organization_name)),
                nulls_last(asc(UserAlias.username)),
                asc(Donor.date_joined),
            )
        else:
            query = query.order_by(
                nulls_last(desc(Donor.organization_name)),
                nulls_last(desc(UserAlias.username)),
                desc(Donor.date_joined),
            )

        return query.offset(skip).limit(limit).all()

    @staticmethod
    def count_donors(
        db: Session,
        search: Optional[str] = None,
        donor_type: Optional[str] = None,
    ) -> int:
        """
        Count Donor, optionally filtering by search term and donor type.
        """
        UserAlias = aliased(User)
        query = (
            db.query(Donor)
            .join(UserAlias, Donor.user_id == UserAlias.user_id, isouter=True)
        )

        if search:
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Donor.organization_name.ilike(term),
                    UserAlias.username.ilike(term),
                    UserAlias.email.ilike(term),
                )
            )

        if donor_type:
            query = query.filter(Donor.donor_type == _norm_type(donor_type))

        return query.count()

    # UPDATE
    @staticmethod
    def update_donor(db: Session, donor_id: int, update_data: Dict[str, Any]) -> Optional[Donor]:
        db_donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
        if not db_donor:
            return None

        try:
            for field, value in update_data.items():
                if field == "donor_type":
                    value = _norm_type(value)
                if hasattr(db_donor, field):
                    setattr(db_donor, field, value)
            db.commit()
            db.refresh(db_donor)
            return db_donor
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to update donor: {str(e)}",
            )

    @staticmethod
    def verify_donor(db: Session, donor_id: int) -> Optional[Donor]:
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": True})

    @staticmethod
    def unverify_donor(db: Session, donor_id: int) -> Optional[Donor]:
        return DonorCRUD.update_donor(db, donor_id, {"is_verified": False})

    # DELETE
    @staticmethod
    def delete_donor(db: Session, donor_id: int) -> bool:
        db_donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
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
                detail=f"Cannot delete donor due to existing references: {str(e)}",
            )

    # UTIL
    @staticmethod
    def donor_exists(db: Session, donor_id: int) -> bool:
        return db.query(Donor).filter(Donor.donor_id == donor_id).first() is not None

    @staticmethod
    def count_donors_by_type(db: Session, donor_type: str) -> int:
        return db.query(Donor).filter(Donor.donor_type == _norm_type(donor_type)).count()

    @staticmethod
    def get_donor_stats(db: Session) -> Dict[str, int]:
        total_donors = DonorCRUD.count_donors(db)
        individual_donors = DonorCRUD.count_donors_by_type(db, "individual")
        organization_donors = DonorCRUD.count_donors_by_type(db, "organization")
        verified_donors = db.query(Donor).filter(Donor.is_verified.is_(True)).count()
        return {
            "total_donors": total_donors,
            "individual_donors": individual_donors,
            "organization_donors": organization_donors,
            "verified_donors": verified_donors,
            "unverified_donors": total_donors - verified_donors,
        }

    @staticmethod
    def get_donor_display_info(
        db: Session,
        search: Optional[str] = None,
        order: str = "desc",
        page: int = 1,
        limit: Optional[int] = 100,
    ) -> "ListOfDonorsResponse":
        UserAlias = aliased(User)

        base_q = (
            db.query(Donor)
            .outerjoin(UserAlias, Donor.user_id == UserAlias.user_id)
            .options(joinedload(Donor.user))
        )

        if search:
            term = f"%{search.strip()}%"
            base_q = base_q.filter(
                or_(
                    Donor.organization_name.ilike(term),
                    UserAlias.username.ilike(term),
                    UserAlias.email.ilike(term),
                )
            )

        total_count = base_q.count()

        if order == "asc":
            base_q = base_q.order_by(
                nulls_last(asc(Donor.organization_name)),
                nulls_last(asc(UserAlias.username)),
                asc(Donor.date_joined),
            )
        else:
            base_q = base_q.order_by(
                nulls_last(desc(Donor.organization_name)),
                nulls_last(desc(UserAlias.username)),
                desc(Donor.date_joined),
            )

        if limit:
            offset = (page - 1) * limit
            rows = base_q.offset(offset).limit(limit).all()
            max_page = max(ceil(total_count / limit), 1)
        else:
            rows = base_q.all()
            max_page = 1

        donor_ids = [d.donor_id for d in rows]

        # Aggregate totals for CASH + IN-KIND (COMPLETED) per donor in the current page
        totals_map = {}
        if donor_ids:
            totals_rows = (
                db.query(
                    Donation.donor_id.label("donor_id"),
                    (
                        func.coalesce(func.sum(Donation_Cash.amount), 0)
                        + func.coalesce(func.sum(Donation_InKind.estimated_value), 0)
                    ).label("total_donation"),
                )
                # FROM Donation -> join both children (outer joins; one or the other may be null)
                .outerjoin(Donation_Cash, Donation_Cash.donation_id == Donation.donation_id)
                .outerjoin(Donation_InKind, Donation_InKind.donation_id == Donation.donation_id)
                .filter(
                    Donation.donor_id.in_(donor_ids),
                    Donation.status == DonationStatus.COMPLETED,
                    Donation.donation_type.in_([DonationType.CASH, DonationType.INKIND]),
                )
                .group_by(Donation.donor_id)
                .all()
            )
            totals_map = {r.donor_id: float(r.total_donation or 0) for r in totals_rows}

        records = []
        for d in rows:
            # display_name = (
            #     d.user.username
            #     if (d.donor_type == "individual" and d.user)
            #     else (d.organization_name or "Unknown Organization")
            # )

            records.append(
                DonorItem(
                    name=d.donor_name,
                    organization_name=d.organization_name,
                    total_donation=totals_map.get(d.donor_id, 0.0),
                    date_joined=d.date_joined,
                )
            )
        return ListOfDonorsResponse(max_page=max_page, donors=records)

    @staticmethod
    def get_donor_profile_by_user_id(db: Session, user_id: str):
        print(user_id)
        donor = db.query(Donor).filter(Donor.user_id == user_id).first()
        if donor is None:
            return None
        return IndividualDonorProfile(
            donorId=donor.donor_id,
            donor_name=donor.donor_name,
            donor_type=donor.donor_type,
            is_verified=donor.is_verified,
            date_joined=donor.date_joined,
            last_updated=donor.last_updated,
        )

    @staticmethod
    def get_donor_id_by_user_id(db: Session, user_id: str) -> int:
        donor_id = db.query(Donor.donor_id).filter(Donor.user_id == user_id).scalar()
        if not donor_id:
            raise HTTPException(status_code=404, detail="Donor not found for this user")
        return donor_id

donor_crud = DonorCRUD()

from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from decimal import Decimal
from pathlib import Path
from fastapi import UploadFile, HTTPException

from models import FundingProposal, Donation, DonationStatus, Donation_Cash, Donation_InKind, DonationType
from crud_functions.utils import uid_from_string, process_image_to_webp
from data_schemas.funding_proposal_schema import (
    FundingProposalCreate,
    FundingProposalResponsePaginated,
    FundingPieChart,
    FundingProposalGet,
)

from math import ceil
from datetime import datetime, date, time

UPLOAD_DIR = Path("media/fundingproposals")

class FundingProposalCRUD:
    @staticmethod
    def create_funding_proposal(
        db: Session,
        proposal_data: FundingProposalCreate,
        image: Optional[UploadFile] = None
    ) -> FundingProposal:
        file_path: Optional[Path] = None

        if image and image.filename:
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(image.filename).suffix or ".webp"
                unique_name = f"{uuid4().hex}{ext}"
                target_path = (UPLOAD_DIR / unique_name).with_suffix(".webp")
                processed = process_image_to_webp(image)
                with target_path.open("wb") as buf:
                    buf.write(processed)
                file_path = target_path
            except Exception as e:
                print(f"Error saving file: {e}")
                raise HTTPException(status_code=500, detail="Error saving file")

        db_proposal = FundingProposal(
            funding_id=proposal_data.funding_id,
            title=proposal_data.title,
            description=proposal_data.description,
            budget_required=proposal_data.budgetRequired,
            status=proposal_data.status,  # string column per model
            image=str(file_path).replace("\\", "/") if file_path else None,
        )

        try:
            db.add(db_proposal)
            db.commit()
            db.refresh(db_proposal)
            return db_proposal
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail="Database error")

    @staticmethod
    def get_all_proposals(
        db: Session,
        search: Optional[str] = None,
        sort: str = "created_at",
        order: str = "desc",
        limit: Optional[int] = None,
        page: int = 1
    ) -> "FundingProposalResponsePaginated":
        try:
            query = db.query(FundingProposal)

            if search:
                term = f"%{search.strip()}%"
                query = query.filter(FundingProposal.title.ilike(term))

            total_count = query.count()

            # Safe sort map (note: "id" -> funding_id)
            sortable = {
                "id": FundingProposal.funding_id,
                "title": FundingProposal.title,
                "status": FundingProposal.status,
                "budget_required": FundingProposal.budget_required,
                "created_at": FundingProposal.created_at,
                "updated_at": FundingProposal.updated_at,
            }
            col = sortable.get(sort, FundingProposal.created_at)
            query = query.order_by(col.desc() if order == "desc" else col.asc())

            if limit:
                offset = (page - 1) * limit
                query = query.offset(offset).limit(limit)
                max_page = max(ceil(total_count / limit), 1)
            else:
                max_page = 1

            proposals: List[FundingProposal] = query.all()
            funding_ids = [p.funding_id for p in proposals]

            # Aggregate COMPLETED totals (cash + in-kind) for these proposals
            donation_map: Dict[int, float] = {}
            if funding_ids:
                # CASH totals
                cash_rows = (
                    db.query(
                        Donation.funding_id.label("funding_id"),
                        func.coalesce(func.sum(Donation_Cash.amount), 0).label("cash_total"),
                    )
                    .join(Donation_Cash, Donation_Cash.donation_id == Donation.donation_id)
                    .filter(
                        Donation.funding_id.in_(funding_ids),
                        Donation.status == DonationStatus.COMPLETED,
                        Donation.donation_type == DonationType.CASH,
                    )
                    .group_by(Donation.funding_id)
                    .all()
                )
                # IN-KIND totals
                inkind_rows = (
                    db.query(
                        Donation.funding_id.label("funding_id"),
                        func.coalesce(func.sum(Donation_InKind.estimated_value), 0).label("inkind_total"),
                    )
                    .join(Donation_InKind, Donation_InKind.donation_id == Donation.donation_id)
                    .filter(
                        Donation.funding_id.in_(funding_ids),
                        Donation.status == DonationStatus.COMPLETED,
                        Donation.donation_type == DonationType.INKIND,
                    )
                    .group_by(Donation.funding_id)
                    .all()
                )

                # Combine into a single map (Decimal -> float)
                for r in cash_rows:
                    donation_map[r.funding_id] = float(r.cash_total or 0)
                for r in inkind_rows:
                    donation_map[r.funding_id] = donation_map.get(r.funding_id, 0.0) + float(r.inkind_total or 0)

            records = [
                FundingProposalGet(
                    funding_id_=p.funding_id, 
                    title=p.title,
                    description=p.description,
                    budget_required=p.budget_required,
                    status=p.status,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    image=p.image,
                    total_donated=donation_map.get(p.funding_id, 0.0),
                )
                for p in proposals
            ]

            return FundingProposalResponsePaginated(max_page=max_page, records=records)
        except Exception as e:
            print(f"Error fetching proposals in CRUD: {e}")
            raise

    @staticmethod
    def get_proposal_by_id(db: Session, funding_id: str) -> Optional[Dict[str, Any]]:
        """
        Return a dict matching the FundingProposalGet schema (uses alias keys).
        Computes `total_donated` by summing Donation_Cash.amount for donations
        referencing the proposal.
        """
        proposal = (
            db.query(FundingProposal)
            .filter(FundingProposal.funding_id == funding_id)
            .first()
        )
        if not proposal:
            return None

        # Sum cash amounts for donations tied to this funding proposal.
        total_amount = (
            db.query(func.coalesce(func.sum(Donation_Cash.amount), 0))
            .join(Donation, Donation.donation_id == Donation_Cash.donation_id)
            .filter(Donation.funding_id == funding_id, Donation.status == DonationStatus.COMPLETED)
            .scalar()
        )

        # Ensure Decimal -> float and avoid None
        if total_amount is None:
            total_amount = Decimal("0.00")
        elif not isinstance(total_amount, Decimal):
            # SQLAlchemy may return Decimal or numeric type; normalize to Decimal
            try:
                total_amount = Decimal(total_amount)
            except Exception:
                total_amount = Decimal(str(total_amount))

        result = {
            # use the alias keys expected by your Pydantic model
            "funding_id": proposal.funding_id,
            "title": proposal.title,
            "description": proposal.description,
            "budget_required": proposal.budget_required,
            "total_donated": float(total_amount),
            "created_at": proposal.created_at,
            "updated_at": proposal.updated_at,
            "image": proposal.image,
        }
        
        return result

    @staticmethod
    def update_proposal(
        db: Session,
        funding_id: int,
        title: str,
        description: str,
        budget_required: int,
        status: str,
        image: Optional[UploadFile],
    ) -> FundingProposal:
        proposal = db.query(FundingProposal).filter(FundingProposal.funding_id == funding_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")

        filename = proposal.image
        if image and image.filename and image.filename.strip():
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                ext = Path(image.filename).suffix or ".webp"
                unique = f"{uuid4().hex}{ext}"
                file_path = (UPLOAD_DIR / unique).with_suffix(".webp")
                processed = process_image_to_webp(image)
                with file_path.open("wb") as buf:
                    buf.write(processed)
                filename = str(file_path).replace("\\", "/")
            except Exception as e:
                print(f"Error saving image: {e}")
                raise HTTPException(status_code=500, detail="Error saving image")

        proposal.title = title
        proposal.description = description
        proposal.budget_required = budget_required
        proposal.status = status
        proposal.image = filename

        try:
            db.commit()
            db.refresh(proposal)
            return proposal
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail=f"Error updating proposal: {str(e)}")

    @staticmethod
    def delete_proposal(db: Session, funding_id: int) -> bool:
        p = db.query(FundingProposal).filter(FundingProposal.funding_id == funding_id).first()
        if not p:
            return False
        db.delete(p)
        db.commit()
        return True

    @staticmethod
    def total_holding(db: Session, date_since: date, date_to: date) -> List["FundingPieChart"]:
        """
        Sum of COMPLETED donations (cash + in-kind) per proposal title within [date_since, date_to].
        """
        start_dt = datetime.combine(date_since, time.min)
        end_dt = datetime.combine(date_to, time.max)

        rows = (
            db.query(
                FundingProposal.title.label("title"),
                func.coalesce(
                    func.sum(
                        func.coalesce(Donation_Cash.amount, 0)
                        + func.coalesce(Donation_InKind.estimated_value, 0)
                    ),
                    0,
                ).label("total_donated"),
            )
            # JOIN donations to proposals via the new PK
            .join(Donation, Donation.funding_id == FundingProposal.funding_id)
            # Add both child tables (uselist=False; only one will match per row)
            .outerjoin(Donation_Cash, Donation_Cash.donation_id == Donation.donation_id)
            .outerjoin(Donation_InKind, Donation_InKind.donation_id == Donation.donation_id)
            .filter(
                Donation.status == DonationStatus.COMPLETED,
            )
            .group_by(FundingProposal.title)
            .all()
        )

        return [{"title": r.title, "total_donated": float(r.total_donated or 0)} for r in rows]
    
    
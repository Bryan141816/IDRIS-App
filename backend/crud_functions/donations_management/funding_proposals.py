from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import func, case, literal, or_
from typing import List, Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException

from models import FundingProposal, Donation, DonationStatus
from data_schemas.funding_proposal_schema import (
    FundingProposalCreate,
    FundingProposalResponsePaginated,
    FundingPieChart,
    FundingProposalGet,
)

from math import ceil
from datetime import datetime, date, time
from PIL import Image
import io

UPLOAD_DIR = Path("media/fundingproposals")


def process_image_to_webp(upload_file: UploadFile, max_size=(1080, 1080), quality=80) -> bytes:
    contents = upload_file.file.read()
    image = Image.open(io.BytesIO(contents))
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")
    image.thumbnail(max_size)
    out = io.BytesIO()
    image.save(out, format="WEBP", quality=quality, optimize=True)
    out.seek(0)
    return out.read()


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
    ) -> FundingProposalResponsePaginated:
        try:
            query = db.query(FundingProposal)

            if search:
                term = f"%{search.strip()}%"
                query = query.filter(FundingProposal.title.ilike(term))

            total_count = query.count()

            # safe sort map
            sortable = {
                "id": FundingProposal.id,
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
            proposal_ids = [p.id for p in proposals]

            # aggregate COMPLETED totals for these proposals
            donation_map: dict[int, float] = {}
            if proposal_ids:
                rows = (
                    db.query(
                        Donation.proposal_id.label("proposal_id"),
                        func.coalesce(
                            func.sum(
                                case(
                                    (Donation.kind == "cash", Donation.amount),
                                    (Donation.kind == "inkind", Donation.estimated_value),
                                    else_=literal(0),
                                )
                            ),
                            0,
                        ).label("total_donated"),
                    )
                    .filter(
                        Donation.proposal_id.in_(proposal_ids),
                        Donation.status == DonationStatus.COMPLETED,
                    )
                    .group_by(Donation.proposal_id)
                    .all()
                )
                donation_map = {r.proposal_id: float(r.total_donated or 0) for r in rows}

            records = [
                FundingProposalGet(
                    id=p.id,
                    title=p.title,
                    description=p.description,
                    budget_required=p.budget_required,
                    created_at=p.created_at,
                    updated_at=p.updated_at,
                    image=p.image,
                    total_donated=donation_map.get(p.id, 0.0),
                )
                for p in proposals
            ]

            return FundingProposalResponsePaginated(max_page=max_page, records=records)

        except Exception as e:
            print(f"Error fetching proposals in CRUD: {e}")
            raise

    @staticmethod
    def get_proposal_by_id(db: Session, proposal_id: int) -> Optional[FundingProposal]:
        return db.query(FundingProposal).filter(FundingProposal.id == proposal_id).first()

    @staticmethod
    def update_proposal(
        db: Session,
        proposal_id: int,
        title: str,
        description: str,
        budget_required: int,
        status: str,
        image: Optional[UploadFile],
    ) -> FundingProposal:
        proposal = db.query(FundingProposal).filter(FundingProposal.id == proposal_id).first()
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
    def delete_proposal(db: Session, proposal_id: int) -> bool:
        p = db.query(FundingProposal).filter(FundingProposal.id == proposal_id).first()
        if not p:
            return False
        db.delete(p)
        db.commit()
        return True

    @staticmethod
    def total_holding(db: Session, date_since: date, date_to: date) -> List[FundingPieChart]:
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
                        func.coalesce(Donation.amount, 0)
                        + func.coalesce(Donation.estimated_value, 0)
                    ),
                    0,
                ).label("total_donated"),
            )
            .join(Donation, FundingProposal.id == Donation.proposal_id)
            .filter(
                Donation.status == DonationStatus.COMPLETED,
                Donation.donation_date.between(start_dt, end_dt),
                or_(Donation.amount.isnot(None), Donation.estimated_value.isnot(None)),
            )
            .group_by(FundingProposal.title)
            .all()
        )

        return [{"title": r.title, "total_donated": float(r.total_donated)} for r in rows]

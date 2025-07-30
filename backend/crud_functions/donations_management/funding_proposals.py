from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import func, case, literal, or_
from typing import List, Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException
from models import FundingProposals, DonationRecords, DonationStatus
from data_schemas.funding_proposal_schema import ( FundingProposalCreate, FundingProposalUpdate, 
                                                  FundingProposalResponsePaginated, FundingPieChart,
                                                  FundingProposalGet,
)
from math import ceil
from datetime import datetime, date, time

import shutil
from PIL import Image
import io

UPLOAD_DIR = Path("media/fundingproposals")

def process_image_to_webp(upload_file: UploadFile, max_size=(1080, 1080), quality=80) -> bytes:
    # Read file bytes
    contents = upload_file.file.read()

    # Open image with Pillow
    image = Image.open(io.BytesIO(contents))

    # Convert to RGB if needed (e.g., PNG with alpha)
    if image.mode in ("RGBA", "P"):
        image = image.convert("RGB")

    # Resize while keeping aspect ratio
    image.thumbnail(max_size)

    # Save to BytesIO as WebP
    output = io.BytesIO()
    image.save(output, format="WEBP", quality=quality, optimize=True)
    output.seek(0)

    return output.read()



# FUNDING PROPOSALS CRUD FUNCTIONS
class FundingProposalCRUD:
    @staticmethod
    def create_funding_proposal(
        db: Session,
        proposal_data: FundingProposalCreate,
        image: Optional[UploadFile] = None
    ) -> FundingProposals:
        file_path = None

        if image and image.filename:
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

                # Generate unique filename with same extension
                ext = Path(image.filename).suffix
                unique_filename = f"{uuid4().hex}{ext}"
                file_path = UPLOAD_DIR / unique_filename

               
                processed_bytes = process_image_to_webp(image)

                with file_path.with_suffix(".webp").open("wb") as buffer:
                    buffer.write(processed_bytes)
                file_path = file_path.with_suffix(".webp")  # Ensure correct path


            except Exception as e:
                print(f"Error saving file: {e}")
                raise HTTPException(status_code=500, detail="Error saving file")

        # Normalize path if available
        full_path_str = str(file_path).replace("\\", "/") if file_path else None

        db_proposal = FundingProposals(
            title=proposal_data.title,
            description=proposal_data.description,
            budgetRequired=proposal_data.budgetRequired,
            status=proposal_data.status,
            image=full_path_str
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
        
    # Get all proposals
    def get_all_proposals(
        db: Session,
        search: Optional[str] = None,
        sort: str = "created_at",
        order: str = "desc",
        limit: Optional[int] = None,
        page: int = 1
    ) -> FundingProposalResponsePaginated:
        try:
            query = db.query(FundingProposals)

            if search:
                query = query.filter(FundingProposals.title.ilike(f"%{search}%"))

            # Get total count BEFORE pagination
            total_count = query.count()

            # Apply sorting
            if sort and hasattr(FundingProposals, sort):
                order_by_column = getattr(FundingProposals, sort)
                if order == "desc":
                    order_by_column = order_by_column.desc()
                else:
                    order_by_column = order_by_column.asc()
                query = query.order_by(order_by_column)

            # Apply pagination
            if limit:
                offset = (page - 1) * limit
                query = query.offset(offset).limit(limit)
                max_page = max(ceil(total_count / limit), 1)
            else:
                max_page = 1  # or 0 if you prefer no pagination fallback

            proposals = query.all()

            # Build list of FundingProposalGet with total_donated
            proposal_ids = [p.proposalId for p in proposals]

            # Aggregate total_donated from Donation table
            donations_subquery = (
                db.query(
                    DonationRecords.proposal_id.label("proposal_id"),
                    func.coalesce(
                        func.sum(
                            case(
                                (DonationRecords.donation_kind == "cash", DonationRecords.amount),
                                (DonationRecords.donation_kind == "inkind", DonationRecords.estimated_value),
                                else_=literal(0)
                            )
                        ),
                        0
                    ).label("total_donated")
                )
                .filter(
                    DonationRecords.proposal_id.in_(proposal_ids),
                    DonationRecords.status == DonationStatus.COMPLETED
                )
                .group_by(DonationRecords.proposal_id)
                .all()
            )
            print(donations_subquery)

            # Build map from proposal_id to total_donated
            donation_map = {d.proposal_id: d.total_donated for d in donations_subquery}

            # Prepare records for Pydantic model
            records = []
            for proposal in proposals:
                record = FundingProposalGet(
                    proposalId=proposal.proposalId,
                    title=proposal.title,
                    description=proposal.description,
                    budgetRequired=proposal.budgetRequired,
                    created_at=proposal.created_at,
                    updated_at=proposal.updated_at,
                    image=proposal.image,
                    total_donated=donation_map.get(proposal.proposalId, 0.0)
                )
                records.append(record)

            return FundingProposalResponsePaginated(
                max_page=max_page,
                records=records
            )
            
        except Exception as e:
            print(f"Error fetching proposals in CRUD: {e}")
            raise    
        
    @staticmethod
    # Get a single proposal by ID
    def get_proposal_by_id(db: Session, proposal_id: int) -> Optional[FundingProposals]:
        return db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
    
    @staticmethod
    def update_proposal(
        db: Session,
        proposal_id: int,
        title: str,
        description: str,
        budgetRequired: int,
        status: str,
        image: Optional[UploadFile]
    ) -> FundingProposals:
        proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()

        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")

        filename = proposal.image  # Preserve existing image by default

        if image and image.filename and image.filename.strip():
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

                # Generate unique name using UUID and preserve file extension
                ext = Path(image.filename).suffix  # e.g., ".png", ".jpg"
                unique_name = f"{uuid4().hex}{ext}"
                file_location = UPLOAD_DIR / unique_name

                
                processed_bytes = process_image_to_webp(image)

                file_location = file_location.with_suffix(".webp")  # Force .webp
                with open(file_location, "wb") as buffer:
                    buffer.write(processed_bytes)

                filename = str(file_location).replace("\\", "/")

            except Exception as e:
                print(f"Error saving image: {e}")
                raise HTTPException(status_code=500, detail="Error saving image")

        # Update proposal fields
        proposal.title = title
        proposal.description = description
        proposal.budgetRequired = budgetRequired
        proposal.status = status
        proposal.image = filename

        try:
            db.commit()
            db.refresh(proposal)
            return proposal
        except Exception as e:
            db.rollback()
            print(f"Database error: {e}")
            raise HTTPException(status_code=500, detail=f"Error updating proposal: {str(e)}")    # Delete a proposal
    
    @staticmethod
    def delete_proposal(db: Session, proposal_id: int) -> bool:
        db_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
        if not db_proposal:
            return False

        db.delete(db_proposal)
        db.commit()
        return True

    @staticmethod
    def total_holding(db: Session, date_since: date, date_to: date) -> List[FundingPieChart]:
        # Convert to datetime ranges
        date_from_dt = datetime.combine(date_since, time.min)  # 00:00:00
        date_to_dt = datetime.combine(date_to, time.max)
        results = (
            db.query(
                FundingProposals.title.label("title"),
                func.coalesce(func.sum(
                    func.coalesce(DonationRecords.amount, 0) +
                    func.coalesce(DonationRecords.estimated_value, 0)
                ), 0).label("total_donated")
            )
            .join(DonationRecords, FundingProposals.proposalId == DonationRecords.proposal_id)
            .filter(
                or_(
                    DonationRecords.amount != None,
                    DonationRecords.estimated_value != None
                ),)
            .filter(DonationRecords.donation_date.between(date_from_dt, date_to_dt))
            .group_by(FundingProposals.title)
            .all()
        )
        return [{"title": row.title, "total_donated": float(row.total_donated)} for row in results]

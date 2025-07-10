from uuid import uuid4
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
from fastapi import UploadFile, HTTPException
from models import FundingProposals
from data_schemas.funding_proposal_schema import FundingProposalCreate, FundingProposalUpdate

import shutil

UPLOAD_DIR = Path("media/fundingproposals")


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

                with file_path.open("wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)

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
    @staticmethod
    def get_all_proposals(
        db: Session,
        search: Optional[str] = None,
        sort: str = "created_at",
        order: str = "desc",
        limit: Optional[int] = None,
        page: int = 1
    ) -> List[FundingProposals]:
        try:
            query = db.query(FundingProposals)

            if search:
                query = query.filter(FundingProposals.title.ilike(f"%{search}%"))

            if sort and hasattr(FundingProposals, sort):
                order_by_column = getattr(FundingProposals, sort)
                if order == "desc":
                    order_by_column = order_by_column.desc()
                else:
                    order_by_column = order_by_column.asc()
                query = query.order_by(order_by_column)

            if limit:
                offset = (page - 1) * limit
                query = query.offset(offset).limit(limit)

            return query.all()
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
                unique_name = f"{uuid.uuid4().hex}{ext}"
                file_location = UPLOAD_DIR / unique_name

                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)

                filename = unique_name
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


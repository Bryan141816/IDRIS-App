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
    def create_funding_proposal(
        db: Session,
        proposal_data: FundingProposalCreate,
        image: Optional[UploadFile] = None
    ) -> FundingProposals:
        filename = None

        if image and image.filename:
            try:
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                file_location = UPLOAD_DIR / image.filename
                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                filename = image.filename
            except Exception as e:
                print(f"Error saving file: {e}")
                raise HTTPException(status_code=500, detail="Error saving file")

        db_proposal = FundingProposals(
            title=proposal_data.title,
            description=proposal_data.description,
            budgetRequired=proposal_data.budgetRequired,
            status=proposal_data.status,
            image=filename
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
        
    # Get a single proposal by ID
    def get_proposal_by_id(self, db: Session, proposal_id: int) -> Optional[FundingProposals]:
        return db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
    
    def update_proposal(
            self,
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
                    file_location = UPLOAD_DIR / image.filename
                    with open(file_location, "wb") as buffer:
                        shutil.copyfileobj(image.file, buffer)
                    filename = image.filename
                except Exception as e:
                    raise HTTPException(status_code=500, detail="Error saving image")

            proposal.title = title
            proposal.description = description
            proposal.budgetRequired = budgetRequired
            proposal.status = status
            proposal.image = filename

            try:
                db.commit()
                db.refresh(proposal)
            except Exception as e:
                db.rollback()
                raise HTTPException(status_code=500, detail=f"Error updating proposal: {str(e)}")

            return proposal

    # Delete a proposal
    def delete_proposal(self, db: Session, proposal_id: int) -> bool:
        db_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
        if not db_proposal:
            return False

        db.delete(db_proposal)
        db.commit()
        return True


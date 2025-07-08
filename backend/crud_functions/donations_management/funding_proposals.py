from sqlalchemy.orm import Session
from typing import List, Optional
from models import FundingProposals
from data_schemas.funding_proposal_schema import FundingProposalCreate, FundingProposalUpdate

# FUNDING PROPOSALS CRUD FUNCTIONS
# Create a new funding proposal
class FundingProposalCRUD:
    def create_proposal(self, db: Session, proposal: FundingProposalCreate) -> FundingProposals:
        db_proposal = FundingProposals(
            title=proposal.title,
            description=proposal.description,
            budgetRequired=proposal.budgetRequired,
            status=proposal.status,
            image=proposal.image
        )
        db.add(db_proposal)
        db.commit()
        db.refresh(db_proposal)
        return db_proposal

    # Get all proposals
    def get_all_proposals(self, db: Session, skip: int = 0, limit: int = 100) -> List[FundingProposals]:
        return db.query(FundingProposals).offset(skip).limit(limit).all()

    # Get a single proposal by ID
    def get_proposal_by_id(self, db: Session, proposal_id: int) -> Optional[FundingProposals]:
        return db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()

    # Update a proposal
    def update_proposal(self, db: Session, proposal_id: int, proposal_update: FundingProposalUpdate) -> Optional[FundingProposals]:
        db_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
        if not db_proposal:
            return None

        for field, value in proposal_update.dict(exclude_unset=True).items():
            setattr(db_proposal, field, value)

        db.commit()
        db.refresh(db_proposal)
        return db_proposal

    # Delete a proposal
    def delete_proposal(self, db: Session, proposal_id: int) -> bool:
        db_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
        if not db_proposal:
            return False

        db.delete(db_proposal)
        db.commit()
        return True


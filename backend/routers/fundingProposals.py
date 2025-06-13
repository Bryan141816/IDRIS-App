from fastapi import APIRouter, Depends, HTTPException, Form, File, UploadFile, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pathlib import Path
import shutil
from schemas import FundingProposalCreate, FundingProposalUpdate, FundingProposalResponse, FundingProposalGet
from models import FundingProposals

from crud import (
    create_proposal,
    get_all_proposals,
    get_proposal_by_id,
    update_proposal,
    delete_proposal,
)
from database import get_db

router = APIRouter()

UPLOAD_DIR = Path("media/fundingproposals")

@router.get("/")
def get_all_proposals_route():
    return {"message": "This is funding proposals"}

@router.post("/proposals/create", response_model=FundingProposalResponse)
def create_proposal_endpoint(    
    title: str = Form(...),
    description: str = Form(...),
    budgetRequired: int = Form(...),
    status: str = Form(...),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    filename = None
    
    if image and image.filename:
        try:
            # Save the file
            UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            file_location = UPLOAD_DIR / image.filename
            with open(file_location, "wb") as buffer:
                shutil.copyfileobj(image.file, buffer)
            filename = image.filename
        except Exception as e:
            print(f"Error saving file: {e}")
            raise HTTPException(status_code=500, detail="Error saving file")
    
    try:
        new_proposal = FundingProposals(
            title=title,
            description=description,
            budgetRequired=budgetRequired,
            status=status,
            image=filename
        )
        db.add(new_proposal)
        db.commit()
        db.refresh(new_proposal)
        return new_proposal
    except Exception as e:
        db.rollback()
        print(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

@router.get("/proposals/all_proposals/", response_model=List[FundingProposalGet])
def read_all_proposals(search: str = Query(None), db: Session = Depends(get_db)):
    try:
        query = db.query(FundingProposals)
        if search:
            query = query.filter(FundingProposals.title.ilike(f"%{search}%"))
        return query.all()
    except Exception as e:
        print(f"Error fetching proposals: {e}")
        raise HTTPException(status_code=500, detail="Error fetching proposals")

@router.get("/proposals/get_proposal/{proposal_id}", response_model=FundingProposalGet)
def read_one_proposal(proposal_id: int, db: Session = Depends(get_db)):
    try:
        proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        return proposal
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching proposal: {e}")
        raise HTTPException(status_code=500, detail="Error fetching proposal")

@router.put("/proposals/update_proposal/{proposal_id}", response_model=FundingProposalResponse)
def update_proposal_endpoint(
    proposal_id: int,  # Must match the path parameter name
    title: str = Form(...),
    description: str = Form(...),
    budgetRequired: int = Form(...),
    status: str = Form("Active"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    print(f"=== UPDATE REQUEST DEBUG ===")
    print(f"Proposal ID: {proposal_id}")
    print(f"Title: {title}")
    print(f"Description: {description}")
    print(f"Budget Required: {budgetRequired}")
    print(f"Status: {status}")
    print(f"Image: {image}")
    print(f"Image filename: {image.filename if image else 'None'}")
    
    try:
        # Get existing proposal - Fixed to use proposalId (the actual primary key)
        print(f"Fetching proposal with ID: {proposal_id}")
        existing_proposal = db.query(FundingProposals).filter(FundingProposals.proposalId == proposal_id).first()
        
        if not existing_proposal:
            print(f"Proposal with ID {proposal_id} not found")
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        print(f"Found existing proposal: {existing_proposal.title}")
        filename = existing_proposal.image  # Keep existing image by default
        print(f"Existing image: {filename}")
        
        # Handle new image upload
        if image and image.filename and image.filename.strip():
            try:
                print(f"Processing new image: {image.filename}")
                # Save the new file
                UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
                file_location = UPLOAD_DIR / image.filename
                with open(file_location, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)
                filename = image.filename
                print(f"Image saved successfully: {filename}")
            except Exception as e:
                print(f"Error saving new image: {e}")
                import traceback
                traceback.print_exc()
                raise HTTPException(status_code=500, detail="Error saving image")
        
        # Update the proposal
        print("Updating proposal fields...")
        existing_proposal.title = title
        existing_proposal.description = description
        existing_proposal.budgetRequired = budgetRequired
        existing_proposal.status = status
        existing_proposal.image = filename
        
        print("Committing to database...")
        db.commit()
        db.refresh(existing_proposal)
        print("Update successful!")
        return existing_proposal
        
    except HTTPException:
        print("HTTPException caught, re-raising")
        raise
    except Exception as e:
        print(f"Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating proposal: {str(e)}")
    
@router.delete("/proposals/delete_proposal/{proposal_id}")
def delete_proposal_endpoint(proposal_id: int, db: Session = Depends(get_db)):
    try:
        if not delete_proposal(db, proposal_id):
            raise HTTPException(status_code=404, detail="Proposal not found")
        return {"detail": "Proposal deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Delete error: {e}")
        raise HTTPException(status_code=500, detail="Error deleting proposal")
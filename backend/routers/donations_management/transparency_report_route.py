from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from pathlib import Path
from uuid import uuid4
from database import get_db
from datetime import datetime
from typing import List, Optional
from data_schemas.transparency_report_schema import ( TransparencyReportBase, TransparencyReportCreate, TransparencyReportFilter, 
                                                    TransparencyReportOut, TransparencyReportUpdate )
from crud_functions.donations_management.transparency_report import TransparencyReport_CRUD as CRUD 
from models import TransparencyReports
import shutil
import os

router = APIRouter()

UPLOAD_DIR = Path("media/transparency_reports")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/create")
def create_transparency_report_endpoint(
    file_name: str = Form(...),
    file: UploadFile = File(...),
    date_issued: str = Form(...),
    db: Session = Depends(get_db),
):
    return CRUD.create_transparency_report(
        db=db,
        file=file,
        file_name=file_name,
        date_issued=date_issued
    )
        
@router.get("/get_transparency_reports", response_model=List[TransparencyReportOut])
def get_all_transparency_report_endpoint(
    file_name: Optional[str] = Query(None),
    date: Optional[datetime] = Query(None),
    limit: int = Query(5),
    page: int = Query(1),
    db: Session = Depends(get_db)
):
    filters = TransparencyReportFilter(
        file_name=file_name,
        date=date,
        limit=limit,
        page=page
    )
    return CRUD.get_transparency_report(db, filters)

@router.get("/get_by_id", response_model= TransparencyReportUpdate)
def get_transparency_report_by_id(
    transparency_id: int,
    db: Session = Depends(get_db)
):
    try:
        report = CRUD.get_transparency_by_id(db, transparency_id)
        if not report:
            raise HTTPException(status_code=404, detail="Transparency report not found")
        return report
    except SQLAlchemyError as e:
        raise HTTPException(status_code=500, detail="Database error occurred")
    
@router.put("/update/{transparency_id}", response_model=TransparencyReportBase)
def update_transparency_report_handler(
    transparency_id: int,
    file: UploadFile = File(...),
    file_name: str = Form(...),
    date_issued: str = Form(...),
    db: Session = Depends(get_db)
):
    return CRUD.update_transparency_report(
        db=db,
        transparency_id=transparency_id,
        file=file,
        file_name=file_name,
        date_issued=date_issued
    )
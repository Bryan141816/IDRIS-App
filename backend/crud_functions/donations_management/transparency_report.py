from sqlalchemy.orm import Session
import shutil
from uuid import uuid4
from sqlalchemy import and_, func
from fastapi import HTTPException
from typing import Optional
from models import TransparencyReports 
from data_schemas.transparency_report_schema import TransparencyReportBase, TransparencyReportCreate, TransparencyReportFilter
from pathlib import Path
from datetime import datetime
from fastapi import UploadFile

import os
UPLOAD_DIR = Path("media/transparency_reports")


class TransparencyReport_CRUD:
    @staticmethod
    def create_transparency_report(
        db: Session,
        file: UploadFile,
        file_name: str,
        date_issued: str
    ):
        # Validate or parse the date_issued
        try:
            issued_date = datetime.fromisoformat(date_issued)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO 8601.")

        # Generate a unique file name
        ext = Path(file.filename).suffix
        unique_filename = f"{uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_filename

        try:
            # Save the uploaded file
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Create DB record
            report = TransparencyReports(
                file=str(file_path),
                file_name=file_name,
                date_issued=issued_date
            )
            db.add(report)
            db.commit()
            db.refresh(report)

            return report
        except Exception as e:
            if file_path.exists():
                file_path.unlink()  # cleanup on error
            raise HTTPException(status_code=500, detail=f"Creation failed: {str(e)}")
            
    @staticmethod
    def get_transparency_report(db: Session, filters: TransparencyReportFilter):
        query = db.query(TransparencyReports)

        # Filter by file name
        if filters.file_name:
            query = query.filter(
                TransparencyReports.file_name.ilike(f"%{filters.file_name}%")
            )
            
        # Filter by date
        if filters.date:
            query = query.filter(
                func.date(TransparencyReports.date_issued) == filters.date.date()
            )

        skip = (filters.page - 1) * filters.limit        
        # Pagination logic
        query = query.order_by(TransparencyReports.date_uploaded.desc())

        # Query result
        return query.offset(skip).limit(filters.limit).all()
    
    @staticmethod
    def get_transparency_by_id(db:Session, id: int):
        return db.query(TransparencyReports).filter(TransparencyReports.transparency_id == id).first()

    @staticmethod
    def update_transparency_report(
        db: Session,
        transparency_id: int,
        file: UploadFile,
        file_name: str,
        date_issued: str,
    ):
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        report = db.query(TransparencyReports).filter(
            TransparencyReports.transparency_id == transparency_id
        ).first()

        if not report:
            raise HTTPException(status_code=404, detail="Transparency report not found")

        # Save new file
        file_location = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_location, "wb") as f:
            f.write(file.file.read())

        # Remove old file if it exists and is different
        if report.file and os.path.exists(report.file):
            try:
                os.remove(report.file)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to delete old file: {str(e)}")

        # Update fields
        report.file = file_location
        report.file_name = file_name
        report.date_issued = datetime.fromisoformat(date_issued)

        db.commit()
        db.refresh(report)

        return report
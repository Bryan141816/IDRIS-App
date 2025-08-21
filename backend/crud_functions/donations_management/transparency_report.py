from sqlalchemy.orm import Session
import shutil
from uuid import uuid4
from sqlalchemy import func
from fastapi import HTTPException, UploadFile
from typing import Optional
from models import TransparencyReport
from data_schemas.transparency_report_schema import (
    TransparencyReportBase,
    TransparencyReportCreate,
    TransparencyReportFilter,
)
from pathlib import Path
from datetime import datetime
from math import ceil
import os

UPLOAD_DIR = Path("media/transparency_reports")


class TransparencyReport_CRUD:
    @staticmethod
    def create_transparency_report(
        db: Session,
        file: UploadFile,
        file_name: str,
        date_issued: str
    ) -> TransparencyReport:
        # Validate/parse date_issued (ISO 8601)
        try:
            issued_date = datetime.fromisoformat(date_issued)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO 8601.")

        # Ensure upload folder exists
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        # Generate a unique filename (preserve ext)
        ext = Path(file.filename).suffix or ""
        unique_filename = f"{uuid4().hex}{ext}"
        file_path = UPLOAD_DIR / unique_filename

        try:
            # Save uploaded file
            with file_path.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Normalize path for DB (forward slashes)
            path_str = str(file_path).replace("\\", "/")

            # Create DB record
            report = TransparencyReport(
                file=path_str,
                file_name=file_name,
                date_issued=issued_date
            )
            db.add(report)
            db.commit()
            db.refresh(report)
            return report

        except Exception as e:
            # Cleanup on error
            if file_path.exists():
                try:
                    file_path.unlink()
                except Exception:
                    pass
            raise HTTPException(status_code=500, detail=f"Creation failed: {str(e)}")

    @staticmethod
    def get_transparency_report(db: Session, filters: TransparencyReportFilter):
        query = db.query(TransparencyReport)

        # Filter by file name (ILIKE)
        if filters.file_name:
            query = query.filter(TransparencyReport.file_name.ilike(f"%{filters.file_name}%"))

        # Filter by date (match date part only)
        if filters.date:
            query = query.filter(func.date(TransparencyReport.date_issued) == filters.date.date())

        # Order newest first
        query = query.order_by(TransparencyReport.date_uploaded.desc())

        # Pagination
        skip = max(filters.page - 1, 0) * filters.limit
        return query.offset(skip).limit(filters.limit).all()

    @staticmethod
    def get_transparency_report_mini_data(db: Session, filters: TransparencyReportBase):
        query = db.query(TransparencyReport)

        if filters.file_name:
            query = query.filter(TransparencyReport.file_name.ilike(f"%{filters.file_name}%"))

        if filters.date:
            query = query.filter(func.date(TransparencyReport.date_issued) == filters.date.date())

        total_count = query.count()
        max_page = max(ceil(total_count / filters.limit), 1) if filters.limit > 0 else 1

        skip = max(filters.page - 1, 0) * filters.limit
        records = (
            query.order_by(TransparencyReport.date_uploaded.desc())
                 .offset(skip)
                 .limit(filters.limit)
                 .all()
        )

        return {"reports": records, "max_page": max_page}

    @staticmethod
    def get_transparency_by_id(db: Session, id: int) -> Optional[TransparencyReport]:
        return (
            db.query(TransparencyReport)
            .filter(TransparencyReport.id == id)
            .first()
        )

    @staticmethod
    def update_transparency_report(
        db: Session,
        id: int,
        file: UploadFile,
        file_name: str,
        date_issued: str,
    ) -> TransparencyReport:
        report = (
            db.query(TransparencyReport)
            .filter(TransparencyReport.id == id)
            .first()
        )

        if not report:
            raise HTTPException(status_code=404, detail="Transparency report not found")

        # Ensure upload dir exists
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

        # Parse date
        try:
            issued_date = datetime.fromisoformat(date_issued)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO 8601.")

        new_path_str = report.file  # default: keep old file
        old_path = Path(report.file) if report.file else None

        # If a new file is provided, store with a unique name
        if file and file.filename and file.filename.strip():
            ext = Path(file.filename).suffix or ""
            unique_filename = f"{uuid4().hex}{ext}"
            new_path = UPLOAD_DIR / unique_filename
            try:
                with new_path.open("wb") as f:
                    f.write(file.file.read())
                new_path_str = str(new_path).replace("\\", "/")

                # Remove old file if different and exists
                if old_path and old_path.exists() and old_path.resolve() != new_path.resolve():
                    try:
                        old_path.unlink()
                    except Exception as e:
                        raise HTTPException(status_code=500, detail=f"Failed to delete old file: {str(e)}")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to save new file: {str(e)}")

        # Update fields
        report.file = new_path_str
        report.file_name = file_name
        report.date_issued = issued_date

        db.commit()
        db.refresh(report)
        return report

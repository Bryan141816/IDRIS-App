from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pathlib import Path
from database import get_db
from crud_functions.donations_management.transparency_report import TransparencyReportCRUD as CRUD
from routers.role_checker import RoleChecker

router_admin = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin","superadmin"]))],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["finance admin", "operations admin", "generic", "superadmin"]))],
)

router = APIRouter()

@router_admin.get("/get_report/by_month/cash")
def get_monthly_report_endpoint(month: int, year: int, db: Session = Depends(get_db)):
    try:
        donations = CRUD.get_cash_monthly_donations(db, month, year)

        if not donations:
            print("No donations Found")
            raise HTTPException(status_code=404, detail="No donations found for the given month and year.")

        return donations

    except HTTPException as e:
        print(f"HTTPException raised: {e.detail}")
        raise e

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")


@router_admin.get("/get_report/by_month/inkind")
def get_monthly_report_endpoint(month: int, year: int, db: Session = Depends(get_db)):
    try:
        donations = CRUD.get_inkind_monthly_donations(db, month, year)

        if not donations:
            print("No donations Found")
            raise HTTPException(status_code=404, detail="No donations found for the given month and year.")

        return donations

    except HTTPException as e:
        print(f"HTTPException raised: {e.detail}")
        raise e

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

router.include_router(router_admin)
# router.include_router(router_donor)
# router.include_router(router_admin_or_donor)

# main.py
import uuid
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from decouple import config
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from passlib.context import CryptContext

# Local imports
from database import Base, engine, SessionLocal
from routers.auth import authentication, users
from routers import admin
from routers.response_dashboard import (
    in_kind_monitoring,
    response_dashboard,
    report_list,
    modality_distribution,
    budget,
    demand_and_response,
    emergency_response,
)
from routers.donations_management import (
    funding_proposals_route,
    donors_route,
    transparency_report_route,
    donations_route,
)
from routers.finance_management import finance_route, finance_report_routes
from routers.finance_management import disbursement_route
from routers.volunteer_management import (
    individual_volunteer_routes,
    organization_volunteer_routes,
)
from routers.manage_users import ManageUsers
from routers.procurement_inventory import procurement_inventory
from routers.procurement_management import procurement_management
from routers.request_procurement import request_procurement
from routers.notification import notification
from routers.lgu_profiling.uploadedFiles import router as files_router
from routers.lgu_profiling import manage_lgu as manage_lgu_router
from routers.lgu_profiling import mapofcebu  # ✅ keep map routes if used elsewhere
from routers.lgu_profiling.LGUofficer import router as lgu_officer_router
from routers.lgu_profiling.LGUSuperAdmin import router as lgu_superadmin_router
from routers.volunteer_management.assignment_routes import router as assignment_router
from routers.distributionAndplanning import distributionAndplanning
from routers.user_profile_routes import router as user_profile_router
from routers import notification_donors_route
import real_time_handler

# ✅ LGU officer location-only router
import insert_lgu_info

import models  # ✅ correct import path for User model

# Initialize password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create database tables
Base.metadata.create_all(bind=engine)

insert_lgu_info.insert_lgu_records_if_empty()
# Initialize FastAPI app
app = FastAPI()
SECRET_KEY = config("SECRET_KEY")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)
app.mount("/media", StaticFiles(directory="media"), name="media")

# Include routers
app.include_router(authentication.router)
app.include_router(admin.router)
app.include_router(users.router, prefix="/users", tags=["Utilities"])
app.include_router(real_time_handler.router)
app.include_router(notification.router)
app.include_router(ManageUsers.router)
app.include_router(distributionAndplanning.router)

app.include_router(donations_route.router, prefix="/donations", tags=["Donations"])
app.include_router(donors_route.router, prefix="/donors", tags=["Donors"])

app.include_router(lgu_officer_router)
app.include_router(lgu_superadmin_router)
app.include_router(manage_lgu_router.router, prefix="/lgu_profiling", tags=["Manage LGU"])

# ❌ Removed admin/manage LGU routers
# app.include_router(admin_lgu_router)
# app.include_router(manage_lgu.router)

app.include_router(
    transparency_report_route.router,
    prefix="/transparency_report",
    tags=["Transparency Report"],
)
app.include_router(
    funding_proposals_route.router,
    prefix="/funding_proposals",
    tags=["Funding Proposals"],
)
app.include_router(finance_route.router, prefix="/finance", tags=["Finance Management"])
app.include_router(
    finance_report_routes.router, prefix="/finance_reports", tags=["Finance Reports"]
)
app.include_router(
    disbursement_route.router, prefix="/finance", tags=["Finance Management"]
)

# Keep map router if other pages use it
app.include_router(mapofcebu.router)

app.include_router(response_dashboard.router)
app.include_router(report_list.router)
app.include_router(demand_and_response.router)
app.include_router(modality_distribution.router)
app.include_router(budget.router)
app.include_router(in_kind_monitoring.router)
app.include_router(emergency_response.router)
app.include_router(procurement_inventory.router)
app.include_router(procurement_management.router)
app.include_router(request_procurement.router)
app.include_router(
    organization_volunteer_routes.router, tags=["Organization Volunteer Management"]
)
app.include_router(individual_volunteer_routes.router, tags=["Volunteer Management"])
app.include_router(assignment_router, tags=["Programs/Events"])
app.include_router(files_router)
app.include_router(user_profile_router, prefix="/user-profile", tags=["User Profile"])
app.include_router(notification_donors_route.router)


# ✅ Superadmin Auto-Creation
@app.on_event("startup")
async def on_startup():
    print("Application starting...")

    db: Session = SessionLocal()
    try:
        superadmin_email = config("SUPERADMIN_EMAIL")
        superadmin_username = config("SUPERADMIN_USERNAME")
        superadmin_password = config("SUPERADMIN_PASSWORD")
        superadmin_role = config("SUPERADMIN_ROLE", default="superadmin")
        superadmin_type = config("SUPERADMIN_TYPE", default="admin")

        existing_admin = (
            db.query(models.User).filter(models.User.email == superadmin_email).first()
        )
        if existing_admin:
            print(f"Superadmin already exists: {superadmin_email}")
        else:
            hashed_pw = pwd_context.hash(superadmin_password)
            new_admin = models.User(
                user_id=str(uuid.uuid4()),
                email=superadmin_email,
                username=superadmin_username,
                hashed_password=hashed_pw,
                user_type=superadmin_type,
                roles=[superadmin_role],
                is_activated=True,
            )
            db.add(new_admin)
            db.commit()
            db.refresh(new_admin)
            print(f"Superadmin created: {superadmin_email}")
    except SQLAlchemyError as e:
        db.rollback()
        print(f"Database error while creating superadmin: {e}")
    except Exception as e:
        print(f"Error creating superadmin: {e}")
    finally:
        db.close()

    print("Registered routes:")
    for route in app.routes:
        print(f"{getattr(route, 'path', route)}")


@app.on_event("shutdown")
async def on_shutdown():
    print("Application shutting down...")

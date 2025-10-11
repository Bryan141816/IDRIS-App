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
from routers.lgu_profiling import manage_lgu, mapofcebu
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
from routers.volunteer_management.assignment_routes import router as assignment_router
from routers.distributionAndplanning import distributionAndplanning
import real_time_handler
import models  # ✅ correct import path for User model

# Initialize password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create database tables
Base.metadata.create_all(bind=engine)

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
app.include_router(users.router, prefix="/users", tags=["Utilities"])
app.include_router(real_time_handler.router)
app.include_router(notification.router)
app.include_router(ManageUsers.router)
app.include_router(distributionAndplanning.router)
app.include_router(donations_route.router, prefix="/donations", tags=["Donations"])
app.include_router(donors_route.router, prefix="/donors", tags=["Donors"])
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
app.include_router(manage_lgu.router)
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

# ✅ Superadmin Auto-Creation
@app.on_event("startup")
async def on_startup():
    print("🚀 Application starting...")

    db: Session = SessionLocal()
    try:
        superadmin_email = config("SUPERADMIN_EMAIL")
        superadmin_username = config("SUPERADMIN_USERNAME")
        superadmin_password = config("SUPERADMIN_PASSWORD")
        superadmin_role = config("SUPERADMIN_ROLE", default="superadmin")
        superadmin_type = config("SUPERADMIN_TYPE", default="admin")

        existing_admin = db.query(models.User).filter(models.User.email == superadmin_email).first()
        if existing_admin:
            print(f"ℹ️ Superadmin already exists: {superadmin_email}")
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
            print(f"✅ Superadmin created: {superadmin_email}")
    except SQLAlchemyError as e:
        db.rollback()
        print(f"❌ Database error while creating superadmin: {e}")
    except Exception as e:
        print(f"❌ Error creating superadmin: {e}")
    finally:
        db.close()

    print("📍 Registered routes:")
    for route in app.routes:
        print(f"➡️ {getattr(route, 'path', route)}")

@app.on_event("shutdown")
async def on_shutdown():
    print("🛑 Application shutting down...")

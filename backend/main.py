# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from decouple import config

from database import Base, engine

# Routers
from routers.auth import authentication, users
from routers.response_dashboard import (
    in_kind_monitoring,
    response_dashboard,
    report_list,
    modality_distribution,
    budget,
    demand_and_response,
)
from routers.response_dashboard import emergency_response
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
import real_time_handler

Base.metadata.create_all(bind=engine)

app = FastAPI()
SECRET_KEY = config("SECRET_KEY")

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

app.include_router(authentication.router)
app.include_router(users.router, prefix="/users", tags=["Utilities"])

app.include_router(real_time_handler.router)
app.include_router(notification.router)

app.include_router(ManageUsers.router)

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


@app.on_event("startup")
async def on_startup():
    print("Registered routes:")
    for route in app.routes:
        print(getattr(route, "path", route))


@app.on_event("shutdown")
async def on_shutdown():
    print("Shutdown complete")

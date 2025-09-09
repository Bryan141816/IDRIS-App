from auth import SECRET_KEY
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from routers.auth import authentication, users
from routers.response_dashboard import (
    in_kind_monitoring,
    response_dashboard,
    report_list,
    modality_distribution,
    budget,
    demand_and_response,
)
from routers.donations_management import (
    funding_proposals_route,
    donors_route,
    transparency_report_route,
    donations_route,
)
from routers.finance_management import finance_route

from starlette.middleware.sessions import SessionMiddleware
from routers.lgu_profiling import manage_lgu
from fastapi.staticfiles import StaticFiles
from routers.volunteer_management import individual_volunteer_routes
from routers.volunteer_management import (
    organization_volunteer_routes,
)  # Import the org volunteer routes
from routers.manage_users import ManageUsers
from routers.procurement_management import procurement_management
from routers.notification import notification
from redis_client import r, close_redis
import real_time_handler

from decouple import config

Base.metadata.create_all(bind=engine)

app = FastAPI()
SECRET_KEY = config("SECRET_KEY")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ],  # <-- Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=SECRET_KEY,
)


@app.on_event("shutdown")
async def shutdown_event():

    print("Redis connection closed")


app.include_router(authentication.router)
app.include_router(real_time_handler.router)
app.include_router(notification.router)
app.include_router(ManageUsers.router)
app.include_router(donations_route.router, prefix="/donations", tags=["Donations"])
app.include_router(users.router, prefix="/users", tags=["Utilities"])
app.include_router(manage_lgu.router)
app.include_router(response_dashboard.router)
app.include_router(report_list.router)
app.include_router(demand_and_response.router)
app.include_router(modality_distribution.router)
app.include_router(budget.router)
app.include_router(in_kind_monitoring.router)
app.include_router(
    funding_proposals_route.router,
    prefix="/funding_proposals",
    tags=["Funding Proposals"],
)
app.include_router(donors_route.router, prefix="/donors", tags=["Donors"])
app.include_router(
    transparency_report_route.router,
    prefix="/transparency_report",
    tags=["Transparency Report"],
)
app.include_router(procurement_management.router)

# Add the organization volunteer routes here
app.include_router(
    organization_volunteer_routes.router, tags=["Organization Volunteer Management"]
)

app.include_router(individual_volunteer_routes.router, tags=["Volunteer Management"])

app.include_router(finance_route.router, prefix="/finance", tags=["Finance Management"])
# app.mount(
#     "/media/transparency_reports",
#     StaticFiles(directory="media/transparency_reports"),
#     name="transparencyreports",
# )

app.mount(
    "/media/fundingproposals",
    StaticFiles(directory="media/fundingproposals"),
    name="fundingproposals",
)

app.mount(
    "/media/certifications",
    StaticFiles(directory="media/certifications"),
    name="certifications",
)


@app.on_event("startup")
async def on_startup():
    print("Registered routes:")
    for route in app.routes:
        print(route.path)

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from data_schemas.report_schema import TableResponse, Cell, TableHead, TableDataRow
from data_schemas.charts_schema import PieChartData, LineChartData, BarChartData

from database import Base, engine, get_db
from models import ResponseReport  # no Role import
from datetime import datetime
from sqlalchemy import func
from routers.auth import authentication, users
from routers.response_dashboard import in_kind_monitoring, response_dashboard, report_list, modality_distribution, budget ,demand_and_response
from routers.donations_management import fundingProposals, donors_route, transparency_report_route
from fastapi.staticfiles import StaticFiles 

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # <-- Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transparency_report_route.router, prefix="/transparency_report", tags=["Dashboard"])
app.mount("/media/transparency_reports", StaticFiles(directory="media/transparency_reports"), name="transparencyreports")

app.include_router(authentication.router)
app.include_router(users.router, prefix="/users", tags=["Utilities"])
app.include_router(response_dashboard.router)
app.include_router(report_list.router)
app.include_router(demand_and_response.router)
app.include_router(modality_distribution.router)
app.include_router(budget.router)
app.include_router(in_kind_monitoring.router)
app.include_router(
    fundingProposals.router, prefix="/funding_proposals", tags=["Funding Proposals"]
)
app.mount(
    "/media/fundingproposals",
    StaticFiles(directory="media/fundingproposals"),
    name="fundingproposals",
)
app.include_router(donors_route.router, prefix="/donors", tags=["Donors"])


@app.on_event("startup")
async def on_startup():
    print("Registered routes:")
    for route in app.routes:
        print(route.path)

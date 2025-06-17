from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from data_schemas.report_schema import TableResponse, Cell, TableHead, TableDataRow
from data_schemas.charts_schema import PieChartData, LineChartData, BarChartData
from data_schemas.in_kind_monitoring_schema import InKindMonitoring
from database import Base, engine, get_db
from models import  ResponseReport  # no Role import
from datetime import datetime
from sqlalchemy import func
from routers.auth import authentication
from routers.response_dashboard import response_dashboard, report_list
from routers import fundingProposals
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

app.include_router(authentication.router)
app.include_router(response_dashboard.router)
app.include_router(report_list.router)

app.include_router(fundingProposals.router, prefix="/funding_proposals", tags=["Funding Proposals"])
app.mount(
    "/media/fundingproposals",
    StaticFiles(directory="media/fundingproposals"),
    name="fundingproposals"
)

@app.on_event("startup")
async def on_startup():
    print("Registered routes:")
    for route in app.routes:
        print(route.path)

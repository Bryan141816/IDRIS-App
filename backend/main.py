from fastapi import FastAPI, Depends, HTTPException, status
from typing import List
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from data_schemas.report_schema import TableResponse, Cell, TableHead, TableDataRow
from data_schemas.modality_schema import PieChartData 
from database import Base, engine, get_db
from models import User, ResponseReport  # no Role import
from schemas import UserCreate, UserSchema, Token, LoginSchema, ResponseReportCreate, ResponseReportOut
from crud import create_user, authenticate_user, get_user_by_email, create_response_report, delete
from auth import create_access_token, SECRET_KEY, ALGORITHM
from datetime import datetime
from sqlalchemy import func
 
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # <-- Frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserSchema:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_by_email(db, username)
    if not user:
        raise credentials_exception
    return user

@app.on_event("startup")
async def on_startup():
    print("Registered routes:")
    for route in app.routes:
        print(route.path)


@app.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Create user with username, password, email, and type
    db_user = create_user(db, email=user.email, username=user.username, password=user.password, user_type=user.user_type,roles=user.roles)

    # Assign roles
    db_user.roles = user.roles
    db.commit()
    db.refresh(db_user)

    access_token = create_access_token(data={"sub": db_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=Token)
def login(form_data: LoginSchema, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=UserSchema)
def read_users_me(current_user: UserSchema = Depends(get_current_user)):
    return current_user


@app.get("/report_list", response_model=TableResponse)
def get_table(db: Session = Depends(get_db)):
    # Table header remains the same
    table_head = [
        {"text": "Date", "width": "150px"},
        {"text": "Report Type", "width": "250px"},
        {"text": "Status", "width": "150px"},
        {"text": "Actions", "width": "150px"},
    ]

    # Query all reports (limit if needed)
    reports = db.query(ResponseReport).order_by(ResponseReport.date_time.desc()).all()

    table_datas = []
    for report in reports:
        row_data = [
            Cell(
                type="Hidden",  # Custom type handled in frontend
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px"
            ),
            Cell(
                type="Text",
                text=report.date_time.strftime("%B %d, %Y"),  # format date nicely
                font_weight=500,
                color="#000",
                width="150px"
            ),
            Cell(
                type="Text",
                text=report.report_type,
                font_weight=500,
                color="#000",
                width="250px"
            ),
            Cell(
                type="Text",
                text=report.status,
                font_weight=700,
                color="#22A900" if report.status.lower() == "completed" else "#000",  # color green if completed
                width="150px"
            ),
            Cell(
                type="Button",
                text="View",
                font_weight=500,
                color="#fff",
                background_color="#749AB6",
                container_width="150px",
                button_width="120px"
            )
        ]
        table_datas.append({"data": row_data})

    return TableResponse(table_head=table_head, table_datas=table_datas)


@app.get("/report_list/recent", response_model=TableResponse)
def get_recent_table(db: Session = Depends(get_db)):
    # Table header without the "Actions" column
    table_head = [
        {"text": "Date", "width": "150px"},
        {"text": "Report Type", "width": "250px"},
        {"text": "Status", "width": "150px"},
    ]

    # Get only the 5 most recent reports
    reports = db.query(ResponseReport).order_by(ResponseReport.date_time.desc()).limit(5).all()

    table_datas = []
    for report in reports:
        row_data = [
            Cell(
                type="Hidden",
                text=str(report.id),
                font_weight=0,
                color="#000",
                width="0px"
            ),
            Cell(
                type="Text",
                text=report.date_time.strftime("%B %d, %Y"),
                font_weight=500,
                color="#000",
                width="150px"
            ),
            Cell(
                type="Text",
                text=report.report_type,
                font_weight=500,
                color="#000",
                width="250px"
            ),
            Cell(
                type="Text",
                text=report.status,
                font_weight=700,
                color="#22A900" if report.status.lower() == "completed" else "#000",
                width="150px"
            )
        ]
        table_datas.append({"data": row_data})

    return TableResponse(table_head=table_head, table_datas=table_datas)
@app.get("/response_dashboard/report_summary")
def get_report_summary(db: Session = Depends(get_db)):
    now = datetime.now()
    start_of_current_month = datetime(now.year, now.month, 1)
    
    # Next month
    if now.month == 12:
        start_of_next_month = datetime(now.year + 1, 1, 1)
    else:
        start_of_next_month = datetime(now.year, now.month + 1, 1)

    # Previous month
    if now.month == 1:
        start_of_prev_month = datetime(now.year - 1, 12, 1)
    else:
        start_of_prev_month = datetime(now.year, now.month - 1, 1)
    
    end_of_prev_month = start_of_current_month

    # Get current month data
    current_total = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_current_month,
        ResponseReport.date_time < start_of_next_month
    ).scalar()

    current_completed = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_current_month,
        ResponseReport.date_time < start_of_next_month,
        func.lower(ResponseReport.status) == "completed"
    ).scalar()

    current_started = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_current_month,
        ResponseReport.date_time < start_of_next_month,
        func.lower(ResponseReport.status) == "started"
    ).scalar()

    # Get previous month data
    prev_total = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_prev_month,
        ResponseReport.date_time < end_of_prev_month
    ).scalar()

    prev_completed = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_prev_month,
        ResponseReport.date_time < end_of_prev_month,
        func.lower(ResponseReport.status) == "completed"
    ).scalar()

    prev_started = db.query(func.count(ResponseReport.id)).filter(
        ResponseReport.date_time >= start_of_prev_month,
        ResponseReport.date_time < end_of_prev_month,
        func.lower(ResponseReport.status) == "started"
    ).scalar()

    # Function to calculate change
    def compare(current, previous):
        if previous == 0:
            if current == 0:
                return {"diff": " ", "percent": "0%"}
            else:
                return {"diff": "+", "percent": "100%"}
        change = current - previous
        if change > 0:
            sign = "+"
        elif change < 0:
            sign = "-"
        else:
            sign = " "
        percent = abs(change) / previous * 100

        return {"diff": sign, "percent": f"{percent:.1f}%"}

    return {
        "month": now.strftime("%B %Y"),
        "total_reports": current_total,
        "completed": current_completed,
        "started": current_started,
        "comparison": {
            "total_reports_change": compare(current_total, prev_total),
            "completed_change": compare(current_completed, prev_completed),
            "started_change": compare(current_started, prev_started)
        }
    }

@app.get("/response_dashboard/modality_chart", response_model = PieChartData)
def get_modality_chart():
    return {
        "labels": ["Cash", "Inkind", "Services"],
        "datasets": [
            {
                "label": "Modality Distribution",
                "data": [12, 19,3],
                "backgroundColor": ["#44EB6E", "#4468EB", "#EB4D44"],
                "borderWidth": 1,            
            }
        ]
    }

@app.post("/response_dashboard/report_list/add_report", response_model = ResponseReportOut)
def add_response_report(report: ResponseReportCreate, db: Session = Depends(get_db)):
    return create_response_report(db, report);

@app.delete("/response_dashboard/report_list/delete_report/{report_id}", response_model=dict)
def delete_response_report(report_id: int, db: Session = Depends(get_db)):
    deleted_report = delete(db, ResponseReport, report_id)
    if not deleted_report:
        raise HTTPException(status_code=400, detail="Response report not found.")
    return {"message": f"Response report with ID {report_id} deleted successfully."}
@app.put("/response_dashboard/report_list/update_report/{report_id}")
def update_report(report_id: int, update: ResponseReportCreate, db: Session = Depends(get_db)):
    report = db.query(ResponseReport).get(report_id);

    if not report:
        raise HTTPException(status_code=404, detail="Response record doesn't exist")
    if update.report_type is not None:
        report.report_type = update.report_type
    if update.status is not None:
        report.status = update.status

    db.commit()
    db.refresh(report)

    return {"detail": "Report updated succesfully", "report": report}

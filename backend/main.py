from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from data_schemas.report_schema import TableResponse, Cell, TableHead, TableDataRow
from database import Base, engine, get_db
from models import User, ResponseReport  # no Role import
from schemas import UserCreate, User, Token, LoginSchema, ResponseReportCreate, ResponseReportOut
from crud import create_user, authenticate_user, get_user_by_email, create_response_report
from auth import create_access_token, SECRET_KEY, ALGORITHM
 
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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
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

@app.get("/users/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
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

@app.post("/response_dashboar/report_list/add_report", response_model = ResponseReportOut)
def add_response_report(report: ResponseReportCreate, db: Session = Depends(get_db)):
    return create_response_report(db, report);

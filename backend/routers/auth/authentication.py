from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Response,
    Request,
    UploadFile,
    File,
    Form,
)
from sqlalchemy.orm import Session
from jose import JWTError
from schemas import (
    UserCreate,
    UserSchema,
    LoginSchema,
    TokenWithUserResponse,
    ID,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from models import User, UserProfile
from crud import create_user, authenticate_user, get_user_by_email
from crud_functions.utils import uid_from_string, process_image_to_webp
import json
from auth import (
    create_access_token,
    create_refresh_token,
    create_token,
    decode_token,
    verify_token,
    hash_password,
)
from database import get_db
from fastapi import Header
from email_handler import send_activation_email, send_reset_email
from pathlib import Path
from uuid import uuid4

router = APIRouter(tags=["users"])

REFRESH_TOKEN_COOKIE = "refresh_token"

UPLOAD_DIR = Path("media/profile_picture")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def get_token_from_cookie(request: Request):
    token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Missing refresh token")
    return token


def get_current_user_from_access_token(
    authorization: str = Header(None), db: Session = Depends(get_db)
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401, detail="Missing or invalid Authorization header"
        )

    token = authorization.removeprefix("Bearer ").strip()

    try:
        payload = decode_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid access token")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.post("/register", response_model=TokenWithUserResponse)
async def register(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    new_user = create_user(
        db,
        user_id=uid_from_string(user.username),
        email=user.email,
        username=user.username,
        password=user.password,
        user_type=user.user_type,
        roles=user.roles,
    )
    access_token = create_access_token(data={"sub": new_user.email})
    refresh_token = create_refresh_token(data={"sub": new_user.email})

    # Set refresh token in cookie
    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,  # 7 days
        samesite="Lax",
        secure=False,  # Set to True in production with HTTPS
    )
    token = create_token(uid_from_string(user.username), "activation")
    await send_activation_email(user.email, token)
    return {"access_token": access_token, "token_type": "bearer", "user": new_user}


@router.post("/login", response_model=TokenWithUserResponse)
def login(form_data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=form_data.email, password=form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": user.email})
    refresh_token = create_refresh_token(data={"sub": user.email})

    response.set_cookie(
        key=REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        samesite="Lax",
        secure=False,
    )

    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.post("/refresh")
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    if not token:
        raise HTTPException(status_code=401, detail="Missing refresh token")

    try:
        payload = decode_token(token)
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = get_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_access_token = create_access_token(data={"sub": email})
    return {"access_token": new_access_token, "token_type": "bearer"}


@router.post("/activate_account")
def activate_account(
    profile_file: UploadFile | None = File(None),
    profile_info: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        profile_data = json.loads(profile_info)
        uid = verify_token(token, "activation")
        if uid is None:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        # -------------------------
        # Handle image
        # -------------------------
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)  # ensure folder exists
        default_image_path = UPLOAD_DIR / "defaultProfile.webp"

        if profile_file and profile_file.filename:
            ext = ".webp"
            unique_name = f"{uuid4().hex}{ext}"
            target_path = UPLOAD_DIR / unique_name
            processed = process_image_to_webp(
                profile_file
            )  # your image processing function
            with target_path.open("wb") as f:
                f.write(processed)
            image_path = str(target_path).replace("\\", "/")
        else:
            # If no file uploaded, use default profile image
            image_path = str(default_image_path).replace("\\", "/")
            if not default_image_path.exists():
                # Optional: copy a bundled default file into UPLOAD_DIR
                from shutil import copyfile

                bundled_default = Path(
                    "media/defaultProfile.webp"
                )  # adjust path to your media folder
                copyfile(bundled_default, default_image_path)

        # -------------------------
        # Save user profile
        # -------------------------
        profile_db = UserProfile(
            user_id=uid,
            first_name=profile_data.get("fname"),
            last_name=profile_data.get("lname"),
            profile_image=image_path,
            phone_number=profile_data.get("contactInfo"),
            bday=profile_data.get("birthday"),
            gender=profile_data.get("gender"),
            address=profile_data.get("address"),
            bio=profile_data.get("bio"),
        )
        db.add(profile_db)

        # -------------------------
        # Update "is_activated" column
        # -------------------------

        user = db.query(User).filter(User.user_id == uid).first()
        if user:
            user.is_activated = True
            db.commit()

        db.refresh(profile_db)
        return {"status": "success", "profile": profile_db.user_profile_id}

    except Exception as e:
        db.rollback()
        import traceback

        print("ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/forgot_password")
async def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, req.email)
    if not user:
        return {"message": "If this email exists, you’ll receive reset instructions."}
    print(user.user_id)
    token = create_token(user.user_id, "reset")
    await send_reset_email(req.email, token)
    return {"message": "Password reset email sent"}


@router.post("/reset_password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        uid = verify_token(payload.token, "reset")
        if uid is None:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        hashed = hash_password(payload.password)
        user = db.query(User).filter(User.user_id == uid).first()
        if user:
            user.hashed_password = hashed
            db.commit()
        return {"message": "Password has been updated"}

    except Exception as e:
        db.rollback()
        import traceback

        print("ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user_from_access_token)):
    return current_user


@router.get("/users/me/id", response_model=ID)
def read_user_id(current_user: User = Depends(get_current_user_from_access_token)):
    return {"id": current_user.user_id}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(REFRESH_TOKEN_COOKIE)
    return {"message": "Logged out"}

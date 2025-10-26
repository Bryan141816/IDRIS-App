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
from models import User, UserProfile, AdminUserProfile
from crud import (create_user, authenticate_user, get_user_by_email,  create_admin_user_profile,
    get_admin_user_profile_by_user_id,
    activate_admin_user,
    get_pending_admin_activations,
)
from crud_functions.utils import uid_from_string, process_image_to_webp
import json
from auth import (
    create_access_token,
    create_refresh_token,
    create_token,
    decode_token,
    verify_token,
    hash_password,
    SECRET_KEY,
)
from database import get_db
from fastapi import Header
from email_handler import (
    send_activation_email,
    send_admin_activation_email,
    send_reset_email,
    send_admin_email_verification,
    send_superadmin_approval_notification,
    send_admin_activated_email,
    send_user_activated_email,
)
from pathlib import Path
from uuid import uuid4
from decouple import config
from authlib.integrations.starlette_client import OAuth
from fastapi.responses import RedirectResponse
import jwt


router = APIRouter(tags=["users"])


GOOGLE_CLIENT_ID = config("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = config("GOOGLE_CLIENT_SECRET")


REFRESH_TOKEN_COOKIE = "refresh_token"

UPLOAD_DIR = Path("media/profile_picture")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MICROSOFT_CLIENT_ID = config("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = config("MICROSOFT_CLIENT_SECRET")
MICROSOFT_TENANT = config("MICROSOFT_TENANT_ID", default="common")
oauth = OAuth()
oauth.register(
    name="google",
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)


oauth.register(
    name="microsoft",
    client_id=MICROSOFT_CLIENT_ID,
    client_secret=MICROSOFT_CLIENT_SECRET,
    authorize_url="https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    access_token_url="https://login.microsoftonline.com/common/oauth2/v2.0/token",
    client_kwargs={
        "scope": "openid email profile offline_access",
        "validate_iss": False,
    },
    jwks_uri="https://login.microsoftonline.com/common/discovery/v2.0/keys",
)


@router.get("/auth/login")
async def oauth_login(request: Request):
    redirect_uri = request.url_for("auth_callback")
    # Add extra info inside `state`
    return await oauth.google.authorize_redirect(
        request, redirect_uri, state="login"  # or "register"
    )


@router.get("/auth/register")
async def oauth_register(request: Request):
    redirect_uri = request.url_for("auth_callback")
    return await oauth.google.authorize_redirect(
        request, redirect_uri, state="register"
    )


@router.get("/auth/microsoft/login")
async def microsoft_login(request: Request):
    redirect_uri = request.url_for("microsoft_callback")
    return await oauth.microsoft.authorize_redirect(
        request, redirect_uri, state="login"
    )


@router.get("/auth/microsoft/register")
async def microsoft_register(request: Request):
    redirect_uri = request.url_for("microsoft_callback")
    return await oauth.microsoft.authorize_redirect(
        request, redirect_uri, state="register"
    )


async def add_user(email: str, username: str, sub: str, db: Session = next(get_db())):
    try:
        new_user = create_user(
            db,
            user_id=uid_from_string(username),
            email=email,
            username=username,
            user_type="user",
            roles=["generic"],
            sub=sub,
        )
        token = create_token(uid_from_string(username), "activation")
        await send_activation_email(email, token)
        return None
    except ValueError as e:
        return str(e)


@router.get("/auth/microsoft/callback")
async def microsoft_callback(request: Request, db: Session = Depends(get_db)):
    print(request)
    token = await oauth.microsoft.authorize_access_token(request)
    user_info = token.get("userinfo")  # Microsoft returns user info here
    state = request.query_params.get("state")
    print(user_info)
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get Microsoft user info")

    payload = {
        "sub": user_info["sub"],  # unique Microsoft ID
        "email": user_info.get("email") or user_info.get("preferred_username"),
        "name": user_info.get("name"),
    }

    jwt_token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    if state == "register":
        error = await add_user(
            payload["email"], payload["name"], str(payload["sub"]), db
        )
        if error:
            redirect_url = f"http://localhost:5173/login?error={error}"
        else:
            redirect_url = f"http://localhost:5173/login"
        return RedirectResponse(url=redirect_url)
    else:
        redirect_url = f"http://localhost:5173/oauth_callback?token={jwt_token}"
        return RedirectResponse(url=redirect_url)


@router.get("/auth/callback")
async def auth_callback(request: Request):
    token = await oauth.google.authorize_access_token(request)
    user_info = token.get("userinfo")
    state = request.query_params.get("state")
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    payload = {
        "sub": user_info["sub"],  # unique provider ID
        "email": user_info["email"],  # actual email
    }
    jwt_token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")
    if state == "register":
        error = await add_user(
            user_info["email"], user_info["name"], str(user_info["sub"])
        )
        if error:
            redirect_url = f"http://localhost:5173/login?error={error}"
        else:
            redirect_url = f"http://localhost:5173/login"
        return RedirectResponse(url=redirect_url)
    else:
        redirect_url = f"http://localhost:5173/oauth_callback?token={jwt_token}"
        return RedirectResponse(url=redirect_url)


@router.post("/auth/callback/login")
async def auth_callback_login(
    token: str, response: Response, db: Session = Depends(get_db)
):
    decoded_payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    user = get_user_by_email(db, decoded_payload["email"])
    if not user:
        raise HTTPException(status_code=401, detail="Not registered yet")
    if not user.sub == decoded_payload["sub"]:
        raise HTTPException(status_code=401, detail="Not registered yet")

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
    try:
        new_user = create_user(
            db,
            user_id=uid_from_string(user.username),
            email=user.email,
            username=user.username,
            password=user.password,
            user_type=user.user_type,
            roles=[user.user_role],
        )
        access_token = create_access_token(data={"sub": new_user.email})
        refresh_token = create_refresh_token(data={"sub": new_user.email})

        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE,
            value=refresh_token,
            httponly=True,
            max_age=60 * 60 * 24 * 7,
            samesite="Lax",
            secure=False,
        )

        # For regular users, send activation email immediately
        if user.user_type != "admin":
            token = create_token(uid_from_string(user.username), "activation")
            await send_activation_email(user.email, token)
        else:
            # ✅ For admins, send profile completion email
            token = create_token(uid_from_string(user.username), "activation")
            await send_admin_activation_email(user.email, token)

        return {"access_token": access_token, "token_type": "bearer", "user": new_user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenWithUserResponse)
def login(form_data: LoginSchema, response: Response, db: Session = Depends(get_db)):
    """
    Login endpoint that checks database and returns specific error codes
    """
    print(f"\n=== Login Attempt ===")
    print(f"Email: {form_data.email}")

    # Step 1: Check if user exists in database
    user = get_user_by_email(db, form_data.email)

    if not user:
        print("❌ User NOT FOUND in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )

    print(f"✓ User found: ID={user.user_id}, Email={user.email}")

    # Step 2: Check if account is activated
    if not user.is_activated:
        print("❌ Account NOT ACTIVATED")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account not activated. Please check your email to complete your profile."
        )

    print("✓ Account is activated")

    # Step 3: Verify password
    print("Checking password...")
    from auth import verify_password
    is_password_correct = verify_password(form_data.password, user.hashed_password)

    if not is_password_correct:
        print("❌ Password INCORRECT")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password"
        )

    print("✓ Password correct!")

    # Step 4: Create tokens
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

    print("✓ Login successful - tokens created")
    print("===================\n")

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
async def activate_account(
    profile_file: UploadFile | None = File(None),
    profile_info: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db),
):
    # Verify token and extract user_id
    uid = verify_token(token, "activation")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    try:
        profile_data = json.loads(profile_info)

        # Handle file upload
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        default_image_path = UPLOAD_DIR / "defaultProfile.webp"

        if profile_file and profile_file.filename:
            ext = ".webp"
            unique_name = f"{uuid4().hex}{ext}"
            target_path = UPLOAD_DIR / unique_name
            processed = process_image_to_webp(profile_file)
            with target_path.open("wb") as f:
                f.write(processed)
            image_path = str(target_path).replace("\\", "/")
        else:
            image_path = str(default_image_path).replace("\\", "/")
            if not default_image_path.exists():
                from shutil import copyfile
                bundled_default = Path("media/defaultProfile.webp")
                copyfile(bundled_default, default_image_path)

        # Find or create user profile
        profile_db = db.query(UserProfile).filter(UserProfile.user_id == uid).first()
        if profile_db:
            # Update existing profile
            profile_db.first_name = profile_data.get("fname")
            profile_db.last_name = profile_data.get("lname")
            profile_db.profile_image = image_path
            profile_db.phone_number = profile_data.get("contactInfo")
            profile_db.bday = profile_data.get("birthday")
            profile_db.gender = profile_data.get("gender")
            profile_db.address = profile_data.get("address")
            profile_db.bio = profile_data.get("bio")
        else:
            # Create new profile
            profile_db = UserProfile(
                user_id=uid,
                user_profile_id=uid_from_string(f"{profile_data.get('fname')}{profile_data.get('lname')}{profile_data.get('birthday')}"),
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

        # Activate user
        user = db.query(User).filter(User.user_id == uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.is_activated = True

        # Commit all changes as a single transaction
        db.commit()
        db.refresh(profile_db)

        # ✅ Send activation confirmation email based on user type
        try:
            if user.user_type == "admin":
                # For admins: notify superadmins for approval
                await send_superadmin_approval_notification(user.email, user.user_id, db)
            else:
                # ✅ For regular users: send activation confirmation email
                await send_user_activated_email(user.email)
        except Exception as email_error:
            # Log the error but don't fail the request
            print(f"WARNING: Failed to send activation email to {user.email}. Error: {email_error}")

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


@router.post("/admin/register")
async def register_admin(
    user: UserCreate,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Register an admin user and send email verification
    """
    try:
        # Create admin user account
        new_admin = create_user(
            db,
            user_id=uid_from_string(user.username),
            email=user.email,
            username=user.username,
            password=user.password,
            user_type="admin",
            roles=["admin"],
        )

        # Generate email verification token
        token = create_token(uid_from_string(user.username), "activation")

        # STEP 1: Send email verification to admin
        await send_admin_email_verification(user.email, token)

        # Create access tokens for immediate login
        access_token = create_access_token(data={"sub": new_admin.email})
        refresh_token = create_refresh_token(data={"sub": new_admin.email})

        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE,
            value=refresh_token,
            httponly=True,
            max_age=60 * 60 * 24 * 7,
            samesite="Lax",
            secure=False,
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_admin,
            "message": "Please check your email to verify your account"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/admin/verify_email")
async def verify_admin_email(
    token: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Verify admin email address after they click the verification link
    This marks the email as verified and triggers superadmin notification
    """
    # Verify token
    uid = verify_token(token, "activation")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    # Get user
    user = db.query(User).filter(User.user_id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.user_type != "admin":
        raise HTTPException(status_code=400, detail="This endpoint is for admin users only")

    # Mark email as verified (you might want to add an email_verified field to your User model)
    # For now, we'll proceed to profile completion

    return {
        "status": "success",
        "message": "Email verified. Please complete your admin profile.",
        "user_id": uid
    }


@router.post("/admin/complete_profile")
async def complete_admin_profile(
    profile_file: UploadFile | None = File(None),
    profile_info: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Admin completes their profile after signup
    Profile is saved but account remains inactive until superadmin approval
    """
    # Verify token
    uid = verify_token(token, "activation")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid or expired activation token")

    try:
        profile_data = json.loads(profile_info)

        # Handle employee ID upload
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        employee_id_path = None

        if profile_file and profile_file.filename:
            ext = ".webp"
            unique_name = f"employee_id_{uuid4().hex}{ext}"
            target_path = UPLOAD_DIR / unique_name
            processed = process_image_to_webp(profile_file)
            with target_path.open("wb") as f:
                f.write(processed)
            employee_id_path = str(target_path).replace("\\", "/")

        # Get user
        user = db.query(User).filter(User.user_id == uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.user_type != "admin":
            raise HTTPException(status_code=400, detail="This endpoint is for admin users only")

        # Check if profile already exists
        admin_profile = get_admin_user_profile_by_user_id(db, uid)

        if admin_profile:
            # Update existing profile
            admin_profile.first_name = profile_data.get("firstName")
            admin_profile.last_name = profile_data.get("lastName")
            admin_profile.employee_idNumber = profile_data.get("employeeIdNumber")
            admin_profile.department = profile_data.get("department")
            admin_profile.contact_number = profile_data.get("contactNumber")
            admin_profile.position = profile_data.get("position")
            admin_profile.lgu_location = profile_data.get("lguLocation")
            if employee_id_path:
                admin_profile.employee_id = employee_id_path
        else:
            # Create new admin profile
            from schemas import AdminUserProfileCreate
            admin_profile_data = AdminUserProfileCreate(
                first_name=profile_data.get("firstName"),
                last_name=profile_data.get("lastName"),
                employee_idNumber=profile_data.get("employeeIdNumber"),
                department=profile_data.get("department"),
                contact_number=profile_data.get("contactNumber"),
                position=profile_data.get("position"),
                employee_id=employee_id_path,
                lgu_location=profile_data.get("lguLocation"),
            )
            admin_profile = create_admin_user_profile(db, admin_profile_data, uid)

        db.commit()
        db.refresh(admin_profile)

        # ✅ Notify superadmins that profile is complete and ready for review
        try:
            await send_superadmin_new_admin_notification(user.email, user.username, db)
        except Exception as email_error:
            print(f"WARNING: Failed to send superadmin notification. Error: {email_error}")

        return {
            "status": "success",
            "message": "Profile submitted. Waiting for superadmin approval.",
            "profile_id": admin_profile.admin_user_profile_id
        }

    except Exception as e:
        db.rollback()
        import traceback
        print("ERROR:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/activate/{user_id}")
async def activate_admin_account(
    user_id: str,
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    STEP 3: Superadmin activates an admin account after review
    Only accessible by superadmins
    """
    # Check if current user is superadmin
    if "superadmin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can activate admin accounts"
        )

    # Get the admin user to activate
    admin_user = db.query(User).filter(User.user_id == user_id).first()
    if not admin_user:
        raise HTTPException(status_code=404, detail="Admin user not found")

    if admin_user.user_type != "admin":
        raise HTTPException(status_code=400, detail="User is not an admin")

    # Activate the admin account
    activated_user = activate_admin_user(db, user_id)
    if not activated_user:
        raise HTTPException(status_code=404, detail="Failed to activate admin")

    # STEP 3: Send activation confirmation email to admin
    try:
        await send_admin_activated_email(admin_user.email)
    except Exception as email_error:
        print(f"WARNING: Failed to send activation email to {admin_user.email}. Error: {email_error}")

    return {
        "status": "success",
        "message": f"Admin {admin_user.username} has been activated",
        "user": activated_user
    }


@router.get("/admin/pending_activations")
async def get_pending_activations(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
):
    """
    Get all admin accounts pending activation
    Only accessible by superadmins
    """
    if "superadmin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmins can view pending activations"
        )

    pending_admins = get_pending_admin_activations(db)

    return {
        "status": "success",
        "count": len(pending_admins),
        "pending_admins": pending_admins
    }

@router.post("/get_user_from_token")
async def get_user_from_token(
    token: str = Form(...),
    db: Session = Depends(get_db),
):
    """
    Get user information from activation token
    """
    uid = verify_token(token, "activation")
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.user_id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Map roles to department names
    role_to_department = {
        "operations admin": "Operations Department",
        "logistics admin": "Logistics Department",
        "finance admin": "Finance Department",
        "lgu officer": "LGU Officer",
        "superadmin": "System Administration",
    }

    # Get the first role and map it to department
    user_role = user.roles[0] if user.roles else "generic"
    department = role_to_department.get(user_role, "General Administration")

    return {
        "user_id": user.user_id,
        "email": user.email,
        "username": user.username,
        "roles": user.roles,
        "department": department,  # ✅ Derived from role
    }

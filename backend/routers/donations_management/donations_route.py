import logging, traceback
import httpx
from fastapi import APIRouter, Depends, Query, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from numbers import Number
import hmac, hashlib, json
from database import get_db
from decouple import config
from data_schemas.donation_schema import (
    DonationCreate,
    DonationResponse,
    RecurringDonationCreate,
    InKindDonationCreate,
    DonationHistoryResponse,
    PayMongoCheckoutRequest,
    DonationUpdate,
    PaginatedDonationHistoryResponse,
)
from crud_functions.donations_management.donations_crud import DonationCRUD as CRUD
from datetime import datetime, timezone, date
from routers.role_checker import RoleChecker

from typing import Optional, List
from models import User
from routers.auth.authentication import get_current_user_from_access_token
from .helper import to_centavos, generate_donation_receipt

from crud_functions.donations_management.donation_receipt_crud import (
    get_donation_receipt_data,
)
from data_schemas.donation_receipt_schema import DonationReceiptSchema

router = APIRouter()

router_admin = APIRouter(
    dependencies=[
        Depends(RoleChecker(["finance admin", "operations admin", "superadmin"]))
    ],
)

router_user = APIRouter(
    dependencies=[Depends(RoleChecker(["generic", "superadmin"]))],
)

router_donor = APIRouter(
    dependencies=[Depends(RoleChecker(["donor", "superadmin"]))],
)

router_admin_or_donor = APIRouter(
    dependencies=[
        Depends(
            RoleChecker(["finance admin", "operations admin", "generic", "superadmin"])
        )
    ],
)


@router.post("/create", response_model=DonationResponse)
def create_one_time_donation(donation: DonationCreate, db: Session = Depends(get_db)):
    try:
        return CRUD.create_donation(db, donation)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logging.exception("Database error creating donation")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        logging.exception("Unexpected error creating donation")
        # while debugging, you can re-raise to see full stack:
        # raise
        raise HTTPException(status_code=500, detail="Unexpected server error")


@router.post("/one-time/create", response_model=DonationResponse)
def create_one_time_donation(donation: DonationCreate, db: Session = Depends(get_db)):
    try:
        return CRUD.create_one_time_pending_donation(db, donation)
    except HTTPException:
        raise
    except SQLAlchemyError as e:
        logging.exception("Database error creating donation")
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    except Exception as e:
        logging.exception("Unexpected error creating donation")
        # while debugging, you can re-raise to see full stack:
        # raise
        raise HTTPException(status_code=500, detail="Unexpected server error")


@router.post("/recurring/create")
def create_recurring_donation_route(
    donation_data: RecurringDonationCreate, db: Session = Depends(get_db)
):
    try:
        return CRUD.create_recurring_donation(db, donation_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/donations/inkind")
def create_inkind_donation_route(
    donation_data: InKindDonationCreate, db: Session = Depends(get_db)
):
    try:
        return CRUD.create_inkind_donation(db, donation_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/cancel", response_model=DonationResponse)
def cancel_donation(request: DonationUpdate, db: Session = Depends(get_db)):
    try:
        return CRUD.cancel_donation_status(db, request.donation_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/completed", response_model=DonationResponse)
def complete_donation(request: DonationUpdate, db: Session = Depends(get_db)):
    try:
        return CRUD.completed_donation_status(db, request.donation_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/failed", response_model=DonationResponse)
def fail_donation(request: DonationUpdate, db: Session = Depends(get_db)):
    try:
        return CRUD.failed_donation_status(db, request.donation_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/total_donations")
def total_donations(
    year: int = Query(..., description="Year to filter (required)"),
    month: int | None = Query(
        None, ge=1, le=12, description="Month to filter (optional)"
    ),
    db: Session = Depends(get_db),
):
    total = CRUD.get_total_donations(db, year, month)
    return {"total_donations": total}


@router.get("/donors/retention")
def donor_retention(
    year: int = datetime.now(timezone.utc).year, db: Session = Depends(get_db)
):
    result = CRUD.get_donor_retention_by_year(db, year)
    return result


@router.get("/recent/details")
def recent_donations(limit: int = 10, db: Session = Depends(get_db)):
    return CRUD.get_donations_with_details(db, limit=limit)


# helper to parse ISO strings (supports trailing Z)
def _parse_iso(dt: Optional[str]) -> Optional[datetime]:
    if not dt:
        return None
    try:
        if dt.endswith("Z"):
            dt = dt.replace("Z", "+00:00")
        return datetime.fromisoformat(dt)
    except Exception:
        raise HTTPException(status_code=400, detail=f"Invalid datetime: {dt}")


@router.get("/get/donor_aggregates")
def recent_donations(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = None,
    status: Optional[str] = None,
    dtype: Optional[str] = Query(None, alias="type"),
):
    # optional CSV -> list (e.g., ?status=PENDING,COMPLETED)
    status_list: Optional[List[str]] = None
    if status:
        status_list = [s.strip().upper() for s in status.split(",") if s.strip()]

    return CRUD.get_donor_aggregates(
        db,
        donor_id=current_user.user_id,
        date_from=_parse_iso(from_),
        date_to=_parse_iso(to),
        status=status_list,
    )


@router.get("/me", response_model=List[DonationHistoryResponse])
def get_my_donations(
    current_user: User = Depends(get_current_user_from_access_token),
    db: Session = Depends(get_db),
    from_: Optional[date] = Query(None, alias="from"),
    to: Optional[date] = Query(None, alias="to"),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = 100,
    page: int = 0,
):
    # Status can be a CSV string
    status_list = [s.strip().upper() for s in status.split(",")] if status else None

    # Type can be a CSV string
    type_list = [t.strip().upper() for t in type.split(",")] if type else None

    donor_profiles = current_user.donor_profile

    if not donor_profiles:
        raise HTTPException(
            status_code=404, detail="Donor profile not found for this user."
        )

    first_profile = donor_profiles[0]

    donor_id = first_profile.donor_id
    donations = CRUD.get_donations_by_donor_id(
        db,
        donor_id=donor_id,
        date_from=from_,
        date_to=to,
        status=status_list,
        dtype=type_list,
        limit=limit,
        page=page,
    )
    return donations


@router.post("/paymongo/checkout")
async def create_paymongo_checkout(request: PayMongoCheckoutRequest):
    PAYMONGO_SECRET_KEY = config("PAYMONGO_SECRET_KEY")
    if not PAYMONGO_SECRET_KEY:
        raise HTTPException(status_code=500, detail="Missing PayMongo secret key")
    amountPesos = to_centavos(request.amount)
    # Option A (recommended): let httpx set Basic auth for you
    payload = {
        "data": {
            "attributes": {
                "line_items": [
                    {
                        "currency": "PHP",
                        "amount": int(amountPesos * 1),  # amount in centavos
                        "name": "Donation",
                        "quantity": 1,
                    }
                ],
                "payment_method_types": ["card", "gcash", "paymaya"],
                # "success_url": request.success_url,
                # "cancel_url": request.cancel_url,
                "description": request.description,
            }
        }
    }

    async with httpx.AsyncClient() as client:
        try:
            # pass auth=(username, password). For PayMongo Basic auth, username is the secret key and password is empty.
            resp = await client.post(
                "https://api.paymongo.com/v1/checkout_sessions",
                json=payload,
                auth=(PAYMONGO_SECRET_KEY, ""),
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            # forward PayMongo error body with proper status
            raise HTTPException(
                status_code=e.response.status_code, detail=e.response.text
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/paymongo/session/{session_id}")
async def get_session_status(session_id: str):
    secret = config("PAYMONGO_SECRET_KEY")

    if not secret:
        raise HTTPException(status_code=500, detail="Missing PayMongo secret key")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"https://api.paymongo.com/v1/checkout_sessions/{session_id}",
                auth=(secret, ""),
                timeout=30.0,
            )
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code, detail=e.response.text
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/all", response_model=PaginatedDonationHistoryResponse)
def get_all_donations(
    db: Session = Depends(get_db),
    from_: Optional[date] = Query(None, alias="from"),
    to: Optional[date] = Query(None, alias="to"),
    limit: int = 10,
    page: int = 1,
    sort_by: str = "donation_date",
    order: str = "desc",
):
    donations = CRUD.get_all_donations(
        db,
        date_from=from_,
        date_to=to,
        limit=limit,
        page=page,
        sort_by=sort_by,
        order=order,
    )
    return donations


@router.post("/paymongo/webhook")
async def paymongo_webhook(request: Request, db: Session = Depends(get_db)):
    """Handles incoming webhooks from PayMongo."""

    # 1. Get signature from header
    signature_header = request.headers.get("Paymongo-Signature")
    if not signature_header:
        raise HTTPException(status_code=400, detail="Missing PayMongo signature")

    # 2. Get raw request body
    payload = await request.body()

    # 3. Get webhook secret from environment
    # IMPORTANT: Use a dedicated webhook secret, not your main API secret key
    webhook_secret = config("PAYMONGO_WEBHOOK_SECRET")
    if not webhook_secret:
        logging.error("PAYMONGO_WEBHOOK_SECRET is not set")
        raise HTTPException(status_code=500, detail="Webhook secret is not configured")

    # 4. Verify signature
    # PayMongo's signature is a comma-separated string: "t=<timestamp>,v1=<signature>"
    try:
        # We only need the signature part (v1) for comparison
        sig_parts = {
            p.split("=")[0]: p.split("=")[1] for p in signature_header.split(",")
        }
        paymongo_signature = sig_parts.get("v1")

        if not paymongo_signature:
            raise ValueError("v1 signature not found in header")

        # Create our expected signature
        # The signature is based on: timestamp + "." + payload
        timestamped_payload = f"{sig_parts.get('t')}.{payload.decode()}"

        expected_signature = hmac.new(
            webhook_secret.encode(),
            msg=timestamped_payload.encode(),
            digestmod=hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, paymongo_signature):
            raise ValueError("Signatures do not match")

    except (ValueError, KeyError) as e:
        logging.warning(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    # 5. Process the event if signature is valid
    try:
        event_data = json.loads(payload)
        event_type = event_data.get("data", {}).get("attributes", {}).get("type")
        checkout_session = (
            event_data.get("data", {}).get("attributes", {}).get("data", {})
        )

        # Extract checkout ID
        checkout_id = checkout_session.get("id")
        if not checkout_id:
            return Response(
                status_code=200, content="Event ignored: No checkout ID found."
            )

        # Find the corresponding donation
        donation = CRUD.get_donation_by_checkout_id(db, checkout_id)
        if not donation:
            logging.warning(f"Webhook received for unknown checkout_id: {checkout_id}")
            # Return 200 to acknowledge receipt and prevent retries from PayMongo
            return Response(
                status_code=200, content="Donation for checkout ID not found."
            )

        # Update status based on event type
        if event_type == "checkout.session.payment.paid":
            CRUD.completed_donation_status(db, donation.donation_id)
            logging.info(
                f"Donation {donation.donation_id} marked as COMPLETED via webhook."
            )

        elif event_type == "checkout.session.payment.failed":
            CRUD.failed_donation_status(db, donation.donation_id)
            logging.info(
                f"Donation {donation.donation_id} marked as FAILED via webhook."
            )

        else:
            logging.info(f"Ignored webhook event type: {event_type}")

    except Exception as e:
        logging.exception("Error processing PayMongo webhook payload")
        # Still return 200 to avoid PayMongo retrying on a processing error
        return Response(
            status_code=200, content="Webhook processed with an internal error."
        )

    return Response(status_code=200, content="Webhook processed successfully.")


@router.get("/receipt/{donation_id}", response_model=DonationReceiptSchema)
def get_donation_receipt(donation_id: str, db: Session = Depends(get_db)):
    receipt_data = get_donation_receipt_data(db, donation_id=donation_id)
    if not receipt_data:
        raise HTTPException(status_code=404, detail="Donation not found")
    return receipt_data


@router.get("/{donation_id}", response_model=DonationHistoryResponse)
def get_donation_by_id(
    donation_id: str,
    db: Session = Depends(get_db),
):
    try:
        donation = CRUD.get_donation_by_id(db, donation_id)
        return donation
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


router.include_router(router_admin)
router.include_router(router_donor)
router.include_router(router_admin_or_donor)

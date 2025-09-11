# routers/uploadedFiles.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from pathlib import Path
from uuid import uuid4
import imghdr

router = APIRouter(prefix="/api/files", tags=["files"])

STATIC_DIR = Path("static")
HAZARDS_DIR = STATIC_DIR / "hazards"
HAZARDS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"jpeg", "png", "gif", "bmp", "webp"}

@router.post("/hazards")
async def upload_hazard(request: Request, file: UploadFile = File(...)):
    contents = await file.read()
    img_type = imghdr.what(None, h=contents)
    if img_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {img_type}")

    ext = "jpg" if img_type == "jpeg" else img_type
    filename = f"{uuid4().hex}.{ext}"
    dest_path = HAZARDS_DIR / filename

    with open(dest_path, "wb") as f:
        f.write(contents)

    base = str(request.base_url).rstrip("/")
    public_url = f"{base}/static/hazards/{filename}"
    return JSONResponse({"url": public_url})

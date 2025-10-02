from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import JSONResponse
from pathlib import Path
from uuid import uuid4
import imghdr

router = APIRouter(prefix="/api/files", tags=["files"])

# Base media dir
MEDIA_DIR = Path("media")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

# Subfolders (✅ fixed spelling to "barangay_pictures")
HAZARDS_DIR   = MEDIA_DIR / "hazards"
LGU_DIR       = MEDIA_DIR / "lgu_pictures"
BARANGAY_DIR  = MEDIA_DIR / "barangay_pictures"
RAFIS_DIR     = MEDIA_DIR / "rafi_pictures"

for d in (HAZARDS_DIR, LGU_DIR, BARANGAY_DIR, RAFIS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# Allowed image formats
ALLOWED_TYPES = {"jpeg", "png", "gif", "bmp", "webp", "tiff"}

def _save_image_or_400(dest_dir: Path, request: Request, file: UploadFile) -> JSONResponse:
    """
    Validates an image file, writes it to dest_dir with a unique name,
    and returns JSONResponse with a public URL.
    """
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    # Read file bytes
    contents = file.file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Detect image type from bytes
    img_type = imghdr.what(None, h=contents)
    if img_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {img_type}")

    # Build unique filename with correct extension
    ext = "jpg" if img_type == "jpeg" else img_type
    filename = f"{uuid4().hex}.{ext}"
    dest_path = dest_dir / filename

    # Persist to disk
    with open(dest_path, "wb") as f:
        f.write(contents)

    # Build absolute URL for the static mount
    base = str(request.base_url).rstrip("/")

    if dest_dir == HAZARDS_DIR:
        public_url = f"{base}/media/hazards/{filename}"
    elif dest_dir == LGU_DIR:
        public_url = f"{base}/media/lgu_pictures/{filename}"
    elif dest_dir == BARANGAY_DIR:
        public_url = f"{base}/media/barangay_pictures/{filename}"  # ✅ fixed spelling
    elif dest_dir == RAFIS_DIR:
        public_url = f"{base}/media/rafi_pictures/{filename}"
    else:
        public_url = f"{base}/media/{filename}"

    return JSONResponse({"url": public_url})


# ----------- Upload Routes -----------

@router.post("/hazards")
async def upload_hazard(request: Request, file: UploadFile = File(...)):
    return _save_image_or_400(HAZARDS_DIR, request, file)

@router.post("/lgu_pictures")
async def upload_lgu_picture(request: Request, file: UploadFile = File(...)):
    return _save_image_or_400(LGU_DIR, request, file)

@router.post("/barangay_pictures")   # ✅ fixed spelling
async def upload_barangay_picture(request: Request, file: UploadFile = File(...)):
    return _save_image_or_400(BARANGAY_DIR, request, file)

@router.post("/rafi_pictures")
async def upload_rafi_picture(request: Request, file: UploadFile = File(...)):
    return _save_image_or_400(RAFIS_DIR, request, file)

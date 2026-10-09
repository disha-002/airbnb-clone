import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile
from ..deps import require_host

# On Railway this sits on the mounted volume so uploads survive redeploys.
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_BYTES = 5 * 1024 * 1024

router = APIRouter(tags=["uploads"])


@router.post("/uploads")
async def upload_image(request: Request, file: UploadFile = File(...), _host=Depends(require_host)):
    """Host-only image upload. Files are stored on local disk and served from /uploads."""
    ext = ALLOWED.get(file.content_type or "")
    if not ext:
        raise HTTPException(415, "Only JPEG, PNG or WebP images are allowed")
    data = await file.read()
    if len(data) > MAX_BYTES:
        raise HTTPException(413, "Image must be under 5 MB")
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(data)
    return {"url": f"{str(request.base_url).rstrip('/')}/uploads/{name}"}

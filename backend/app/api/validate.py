"""
CivicLens AI — Document Validation API Routes
Feature 1: POST /validate/photo, /validate/signature, /validate/pdf
"""

import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends

from app.core.security import get_current_user
from app.models.user import User
from app.services.document_validator import document_validator

logger = logging.getLogger("civiclens.api.validate")

router = APIRouter(prefix="/api/validate", tags=["Document Validation"])

MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB hard limit


@router.post("/photo")
async def validate_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Validate a passport-sized photo.
    Checks: white background, face detection, centering, resolution, aspect ratio,
    file size, format, and filter detection.
    """
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 10MB.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")

    result = await document_validator.validate_photo(contents, file.filename or "photo")
    logger.info(f"Photo validation for user {current_user.id}: overall_valid={result['overall_valid']}")
    return result


@router.post("/signature")
async def validate_signature(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Validate a signature image.
    Checks: white background, contrast, blur, dimensions, format, file size.
    """
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 10MB.")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG/PNG).")

    result = await document_validator.validate_signature(contents, file.filename or "signature")
    logger.info(f"Signature validation for user {current_user.id}: overall_valid={result['overall_valid']}")
    return result


@router.post("/pdf")
async def validate_pdf(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """
    Validate a PDF document.
    Checks: valid PDF, file size, password protection, page count, orientation, text extraction.
    """
    contents = await file.read()
    if len(contents) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Maximum 10MB.")

    if file.content_type and file.content_type != "application/pdf" and not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF.")

    result = await document_validator.validate_pdf(contents, file.filename or "document.pdf")
    logger.info(f"PDF validation for user {current_user.id}: overall_valid={result['overall_valid']}")
    return result

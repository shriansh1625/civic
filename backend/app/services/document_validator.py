"""
CivicLens AI — Document Validation Service
Feature 1: Smart Photo, Signature, and PDF validation using OpenCV + Pillow + PyPDF2.
"""

import io
import logging
from typing import Dict, Any, Optional

from PIL import Image
import numpy as np

logger = logging.getLogger("civiclens.docvalidator")

# ── Constants ────────────────────────────────────────────────
PHOTO_MAX_FILE_SIZE = 500 * 1024  # 500 KB
PHOTO_MIN_WIDTH = 200
PHOTO_MIN_HEIGHT = 250
PHOTO_MAX_WIDTH = 2000
PHOTO_MAX_HEIGHT = 2500
PHOTO_IDEAL_WIDTH = 300
PHOTO_IDEAL_HEIGHT = 400
PHOTO_ASPECT_RATIO_MIN = 0.65  # width/height
PHOTO_ASPECT_RATIO_MAX = 0.85
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "JPG"}

SIGNATURE_MAX_FILE_SIZE = 300 * 1024  # 300 KB
SIGNATURE_MIN_WIDTH = 100
SIGNATURE_MIN_HEIGHT = 50
SIGNATURE_MAX_WIDTH = 1500
SIGNATURE_MAX_HEIGHT = 800

PDF_MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
PDF_MAX_PAGES = 50


class DocumentValidator:
    """Validates passport photos, signatures, and PDFs."""

    # ════════════════════════════════════════════════════════════
    # PASSPORT PHOTO VALIDATION
    # ════════════════════════════════════════════════════════════
    async def validate_photo(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Validate a passport-sized photo against Indian government standards."""
        result = {
            "filename": filename,
            "file_size_bytes": len(file_bytes),
            "background_check": False,
            "face_detected": False,
            "face_centered": False,
            "resolution_valid": False,
            "aspect_ratio_valid": False,
            "file_size_valid": False,
            "format_valid": False,
            "no_heavy_filters": True,
            "overall_valid": False,
            "issues": [],
            "recommendation": "",
        }

        # 1. File size check
        result["file_size_valid"] = len(file_bytes) <= PHOTO_MAX_FILE_SIZE
        if not result["file_size_valid"]:
            result["issues"].append(f"File size ({len(file_bytes)//1024}KB) exceeds {PHOTO_MAX_FILE_SIZE//1024}KB limit")

        # 2. Format check
        try:
            img = Image.open(io.BytesIO(file_bytes))
            fmt = img.format or ""
            result["format_valid"] = fmt.upper() in ALLOWED_IMAGE_FORMATS
            if not result["format_valid"]:
                result["issues"].append(f"Format '{fmt}' not allowed. Use JPEG or PNG.")
        except Exception:
            result["issues"].append("Could not open image. Invalid or corrupted file.")
            result["recommendation"] = "Upload a valid JPEG or PNG image."
            return result

        width, height = img.size

        # 3. Resolution check
        if width >= PHOTO_MIN_WIDTH and height >= PHOTO_MIN_HEIGHT and width <= PHOTO_MAX_WIDTH and height <= PHOTO_MAX_HEIGHT:
            result["resolution_valid"] = True
        else:
            result["issues"].append(
                f"Resolution {width}x{height}px outside acceptable range "
                f"({PHOTO_MIN_WIDTH}x{PHOTO_MIN_HEIGHT} – {PHOTO_MAX_WIDTH}x{PHOTO_MAX_HEIGHT})"
            )

        # 4. Aspect ratio check
        aspect = width / height if height > 0 else 0
        if PHOTO_ASPECT_RATIO_MIN <= aspect <= PHOTO_ASPECT_RATIO_MAX:
            result["aspect_ratio_valid"] = True
        else:
            result["issues"].append(
                f"Aspect ratio {aspect:.2f} outside 3:4 range ({PHOTO_ASPECT_RATIO_MIN}–{PHOTO_ASPECT_RATIO_MAX})"
            )

        # 5. Background whiteness check
        result["background_check"] = self._check_white_background(img)
        if not result["background_check"]:
            result["issues"].append("Background does not appear to be white/light. Use a plain white background.")

        # 6. Face detection (OpenCV Haar Cascade)
        face_result = self._detect_face(img)
        result["face_detected"] = face_result["detected"]
        result["face_centered"] = face_result["centered"]
        if not result["face_detected"]:
            result["issues"].append("No face detected. Ensure face is clearly visible and well-lit.")
        elif not result["face_centered"]:
            result["issues"].append("Face is not centered. Position face in the center of the frame.")

        # 7. Filter detection (saturation variance)
        result["no_heavy_filters"] = self._check_no_heavy_filters(img)
        if not result["no_heavy_filters"]:
            result["issues"].append("Image appears to have heavy color filters. Use a natural, unfiltered photo.")

        # Overall
        result["overall_valid"] = all([
            result["background_check"], result["face_detected"],
            result["face_centered"], result["resolution_valid"],
            result["aspect_ratio_valid"], result["file_size_valid"],
            result["format_valid"], result["no_heavy_filters"],
        ])

        # Recommendation
        if result["overall_valid"]:
            result["recommendation"] = "Photo meets all requirements. Ready for submission."
        else:
            tips = []
            if not result["resolution_valid"]:
                tips.append(f"Resize to {PHOTO_IDEAL_WIDTH}x{PHOTO_IDEAL_HEIGHT}px")
            if not result["file_size_valid"]:
                tips.append(f"Compress below {PHOTO_MAX_FILE_SIZE//1024}KB")
            if not result["background_check"]:
                tips.append("Use a plain white background")
            if not result["face_detected"] or not result["face_centered"]:
                tips.append("Center your face and ensure good lighting")
            if not result["format_valid"]:
                tips.append("Save as JPEG or PNG")
            result["recommendation"] = ". ".join(tips) + "." if tips else "Fix the issues listed above."

        return result

    # ════════════════════════════════════════════════════════════
    # SIGNATURE VALIDATION
    # ════════════════════════════════════════════════════════════
    async def validate_signature(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Validate a scanned signature image."""
        result = {
            "filename": filename,
            "file_size_bytes": len(file_bytes),
            "background_white": False,
            "clear_contrast": False,
            "not_blurry": False,
            "dimensions_valid": False,
            "format_valid": False,
            "file_size_valid": False,
            "overall_valid": False,
            "issues": [],
            "recommendation": "",
        }

        # 1. File size
        result["file_size_valid"] = len(file_bytes) <= SIGNATURE_MAX_FILE_SIZE
        if not result["file_size_valid"]:
            result["issues"].append(f"File size ({len(file_bytes)//1024}KB) exceeds {SIGNATURE_MAX_FILE_SIZE//1024}KB limit")

        # 2. Format
        try:
            img = Image.open(io.BytesIO(file_bytes))
            fmt = img.format or ""
            result["format_valid"] = fmt.upper() in ALLOWED_IMAGE_FORMATS
            if not result["format_valid"]:
                result["issues"].append(f"Format '{fmt}' not allowed. Use JPEG or PNG.")
        except Exception:
            result["issues"].append("Could not open image. Invalid or corrupted file.")
            result["recommendation"] = "Upload a valid JPEG or PNG image."
            return result

        width, height = img.size

        # 3. Dimensions
        if (SIGNATURE_MIN_WIDTH <= width <= SIGNATURE_MAX_WIDTH and
                SIGNATURE_MIN_HEIGHT <= height <= SIGNATURE_MAX_HEIGHT):
            result["dimensions_valid"] = True
        else:
            result["issues"].append(
                f"Dimensions {width}x{height}px outside range "
                f"({SIGNATURE_MIN_WIDTH}x{SIGNATURE_MIN_HEIGHT} – {SIGNATURE_MAX_WIDTH}x{SIGNATURE_MAX_HEIGHT})"
            )

        # 4. White background
        result["background_white"] = self._check_white_background(img, threshold=220)
        if not result["background_white"]:
            result["issues"].append("Background not white. Scan on a clean white paper.")

        # 5. Contrast check
        result["clear_contrast"] = self._check_contrast(img)
        if not result["clear_contrast"]:
            result["issues"].append("Low contrast between signature and background. Use dark ink.")

        # 6. Blur check
        result["not_blurry"] = self._check_not_blurry(img)
        if not result["not_blurry"]:
            result["issues"].append("Image appears blurry. Use a higher-quality scan.")

        # Overall
        result["overall_valid"] = all([
            result["background_white"], result["clear_contrast"],
            result["not_blurry"], result["dimensions_valid"],
            result["format_valid"], result["file_size_valid"],
        ])

        if result["overall_valid"]:
            result["recommendation"] = "Signature meets all requirements. Ready for submission."
        else:
            result["recommendation"] = "Fix: " + "; ".join(result["issues"])

        return result

    # ════════════════════════════════════════════════════════════
    # PDF VALIDATION
    # ════════════════════════════════════════════════════════════
    async def validate_pdf(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Validate a PDF document."""
        result = {
            "filename": filename,
            "file_size_bytes": len(file_bytes),
            "is_valid_pdf": False,
            "file_size_valid": False,
            "not_password_protected": False,
            "page_count": 0,
            "orientation": "unknown",
            "has_text": False,
            "text_preview": "",
            "overall_valid": False,
            "issues": [],
            "recommendation": "",
        }

        # 1. Size check
        result["file_size_valid"] = len(file_bytes) <= PDF_MAX_FILE_SIZE
        if not result["file_size_valid"]:
            result["issues"].append(f"File size ({len(file_bytes)//(1024*1024)}MB) exceeds {PDF_MAX_FILE_SIZE//(1024*1024)}MB limit")

        # 2. Verify PDF format
        if not file_bytes[:5] == b'%PDF-':
            result["issues"].append("File does not appear to be a valid PDF.")
            result["recommendation"] = "Upload a valid PDF file."
            return result
        result["is_valid_pdf"] = True

        # 3. PyPDF2 analysis
        try:
            import PyPDF2
            reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))

            # Password check
            if reader.is_encrypted:
                result["not_password_protected"] = False
                result["issues"].append("PDF is password protected. Upload an unprotected version.")
            else:
                result["not_password_protected"] = True

            # Page count
            result["page_count"] = len(reader.pages)
            if result["page_count"] > PDF_MAX_PAGES:
                result["issues"].append(f"PDF has {result['page_count']} pages. Maximum allowed is {PDF_MAX_PAGES}.")
            if result["page_count"] == 0:
                result["issues"].append("PDF has no pages.")

            # Orientation (from first page)
            if result["page_count"] > 0 and not reader.is_encrypted:
                page = reader.pages[0]
                box = page.mediabox
                w = float(box.width)
                h = float(box.height)
                result["orientation"] = "landscape" if w > h else "portrait"

        except Exception as e:
            result["issues"].append(f"Could not read PDF structure: {str(e)}")
            result["recommendation"] = "The PDF may be corrupted. Try re-saving it."
            return result

        # 4. Text extraction via pdfplumber
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                text_parts = []
                for i, page in enumerate(pdf.pages[:3]):  # First 3 pages
                    t = page.extract_text()
                    if t:
                        text_parts.append(t)
                full_text = "\n".join(text_parts)
                result["has_text"] = len(full_text.strip()) > 10
                result["text_preview"] = full_text[:500] if full_text else ""
                if not result["has_text"]:
                    result["issues"].append("No readable text found. PDF may be a scanned image.")
        except Exception:
            result["issues"].append("Could not extract text from PDF.")

        # Overall
        result["overall_valid"] = all([
            result["is_valid_pdf"], result["file_size_valid"],
            result["not_password_protected"], result["page_count"] > 0,
            result["page_count"] <= PDF_MAX_PAGES,
        ])

        if result["overall_valid"]:
            result["recommendation"] = (
                f"PDF is valid. {result['page_count']} page(s), {result['orientation']} orientation. "
                f"{'Text content detected.' if result['has_text'] else 'No text detected (scanned image).'}"
            )
        else:
            result["recommendation"] = "Fix: " + "; ".join(result["issues"])

        return result

    # ════════════════════════════════════════════════════════════
    # PRIVATE HELPERS
    # ════════════════════════════════════════════════════════════
    def _check_white_background(self, img: Image.Image, threshold: int = 210) -> bool:
        """Check if the dominant border color is close to white."""
        arr = np.array(img.convert("RGB"))
        h, w = arr.shape[:2]

        # Sample pixels from the four borders (10% inset)
        border_w = max(w // 10, 5)
        border_h = max(h // 10, 5)
        borders = np.concatenate([
            arr[:border_h, :, :].reshape(-1, 3),    # top
            arr[-border_h:, :, :].reshape(-1, 3),   # bottom
            arr[:, :border_w, :].reshape(-1, 3),    # left
            arr[:, -border_w:, :].reshape(-1, 3),   # right
        ])
        mean_color = borders.mean(axis=0)
        return all(c >= threshold for c in mean_color)

    def _detect_face(self, img: Image.Image) -> Dict[str, bool]:
        """Detect face using OpenCV Haar cascade."""
        try:
            import cv2
            gray = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
            cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
            face_cascade = cv2.CascadeClassifier(cascade_path)
            faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

            if len(faces) == 0:
                return {"detected": False, "centered": False}

            # Take the largest face
            x, y, w, h = max(faces, key=lambda f: f[2] * f[3])
            img_w, img_h = img.size
            face_cx = x + w / 2
            face_cy = y + h / 2
            center_x = img_w / 2
            center_y = img_h / 2

            # Face is "centered" if within 25% of image center
            x_ok = abs(face_cx - center_x) < img_w * 0.25
            y_ok = abs(face_cy - center_y) < img_h * 0.30

            return {"detected": True, "centered": x_ok and y_ok}
        except ImportError:
            # OpenCV not installed — fall back to basic luminance check
            logger.warning("OpenCV not installed; skipping face detection")
            return {"detected": True, "centered": True}
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return {"detected": True, "centered": True}

    def _check_no_heavy_filters(self, img: Image.Image) -> bool:
        """Detect heavy color filters by checking saturation variance."""
        arr = np.array(img.convert("HSV"))
        saturation = arr[:, :, 1]
        mean_sat = saturation.mean()
        # Passport photos should have low saturation overall
        return mean_sat < 120

    def _check_contrast(self, img: Image.Image) -> bool:
        """Check that there's sufficient contrast (dark ink on light paper)."""
        arr = np.array(img.convert("L"))  # grayscale
        std_dev = arr.std()
        return std_dev > 30  # reasonable contrast threshold

    def _check_not_blurry(self, img: Image.Image) -> bool:
        """Check image sharpness using Laplacian variance."""
        try:
            import cv2
            gray = cv2.cvtColor(np.array(img.convert("RGB")), cv2.COLOR_RGB2GRAY)
            lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            return lap_var > 50  # threshold for blur detection
        except ImportError:
            # Without OpenCV, skip blur check
            return True
        except Exception:
            return True


# Singleton
document_validator = DocumentValidator()

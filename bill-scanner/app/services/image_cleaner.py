import cv2
import numpy as np


def clean_image(image_bytes: bytes) -> np.ndarray:
    """
    Stage 1: Clean and preprocess receipt image for better OCR accuracy.
    Handles both flat scans and real-world photos.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image")

    # Upscale small images — PaddleOCR works best at 1000px+ height
    h, w = img.shape[:2]
    if h < 1000:
        scale = 1000 / h
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_CUBIC)

    # Detect if image is a real photo or a clean scan
    is_photo = _is_real_photo(img)

    if is_photo:
        return _clean_photo(img)
    else:
        return _clean_scan(img)


def _is_real_photo(img: np.ndarray) -> bool:
    """
    Detect if image is a real-world photo (vs flat scan/screenshot).
    Uses variance of laplacian — photos have more blur/noise variation.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    variance = cv2.Laplacian(gray, cv2.CV_64F).var()
    # High variance = sharp scan, low variance = blurry photo
    # Also check if image has background color (not pure white)
    mean_brightness = gray.mean()
    # Real photos tend to have lower overall brightness and mid variance
    return variance < 2000 or mean_brightness < 200


def _clean_photo(img: np.ndarray) -> np.ndarray:
    """
    Pipeline for real-world receipt photos.
    Gentler processing — preserves text without destroying it.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Denoise gently
    denoised = cv2.fastNlMeansDenoising(gray, h=10)

    # CLAHE — improves local contrast without blowing out highlights
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(denoised)

    # Gentle sharpening
    kernel = np.array([[0, -1, 0],
                       [-1, 5, -1],
                       [0, -1, 0]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)

    # Otsu thresholding — automatically finds best threshold for photos
    _, thresh = cv2.threshold(
        sharpened, 0, 255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )

    return thresh


def _clean_scan(img: np.ndarray) -> np.ndarray:
    """
    Pipeline for flat scans and screenshots.
    More aggressive — works well on perfect images.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    denoised = cv2.GaussianBlur(gray, (3, 3), 0)

    kernel = np.array([[-1, -1, -1],
                       [-1,  9, -1],
                       [-1, -1, -1]])
    sharpened = cv2.filter2D(denoised, -1, kernel)

    thresh = cv2.adaptiveThreshold(
        sharpened, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 11, 2
    )

    deskewed = _deskew_image(thresh)
    return deskewed


def _deskew_image(image: np.ndarray) -> np.ndarray:
    """Automatically correct image rotation — only for flat scans."""
    coords = np.column_stack(np.where(image > 0))
    if len(coords) == 0:
        return image
    angle = cv2.minAreaRect(coords)[-1]
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    # Only deskew if angle is significant — avoid unnecessary rotation
    if abs(angle) < 0.5:
        return image

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)
    M = cv2.getRotationMatrix2D(center, angle, 1.0)
    rotated = cv2.warpAffine(
        image, M, (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )
    return rotated

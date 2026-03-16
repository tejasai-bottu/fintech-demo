import numpy as np
import cv2
from typing import Optional

# Lazy load OCR to save startup RAM
_ocr_instance = None

def get_ocr():
    global _ocr_instance
    if _ocr_instance is None:
        from paddleocr import PaddleOCR
        _ocr_instance = PaddleOCR(
            use_angle_cls=True,
            lang='en',
            use_gpu=False,
            show_log=False
        )
    return _ocr_instance


def run_ocr(image: np.ndarray) -> str:
    """
    Stage 2: Extract text from preprocessed image using PaddleOCR.
    Returns concatenated text string.
    """
    ocr = get_ocr()

    # Convert grayscale back to BGR if needed
    if len(image.shape) == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)

    result = ocr.ocr(image, cls=True)

    if not result or result[0] is None:
        return ""

    lines = []
    for page in result:
        if page is None:
            continue
        for line in page:
            if line and len(line) >= 2:
                text, confidence = line[1][0], line[1][1]
                if confidence > 0.5:
                    lines.append(text)

    return "\n".join(lines)

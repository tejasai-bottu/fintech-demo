FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --upgrade pip \
 && pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Pre-download PaddleOCR models using wget directly (avoids segfault from initializing PaddleOCR at build time)
RUN mkdir -p /root/.paddleocr/whl/det/en/en_PP-OCRv3_det_infer \
    && mkdir -p /root/.paddleocr/whl/rec/en/en_PP-OCRv4_rec_infer \
    && mkdir -p /root/.paddleocr/whl/cls/ch_ppocr_mobile_v2.0_cls_infer \
    && wget -q -O /tmp/det.tar "https://paddleocr.bj.bcebos.com/PP-OCRv3/english/en_PP-OCRv3_det_infer.tar" \
    && tar -xf /tmp/det.tar -C /root/.paddleocr/whl/det/en/en_PP-OCRv3_det_infer --strip-components=1 \
    && wget -q -O /tmp/rec.tar "https://paddleocr.bj.bcebos.com/PP-OCRv4/english/en_PP-OCRv4_rec_infer.tar" \
    && tar -xf /tmp/rec.tar -C /root/.paddleocr/whl/rec/en/en_PP-OCRv4_rec_infer --strip-components=1 \
    && wget -q -O /tmp/cls.tar "https://paddleocr.bj.bcebos.com/dygraph_v2.0/ch/ch_ppocr_mobile_v2.0_cls_infer.tar" \
    && tar -xf /tmp/cls.tar -C /root/.paddleocr/whl/cls/ch_ppocr_mobile_v2.0_cls_infer --strip-components=1 \
    && rm /tmp/det.tar /tmp/rec.tar /tmp/cls.tar \
    && echo "✅ PaddleOCR models downloaded successfully"

COPY ./app /app

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

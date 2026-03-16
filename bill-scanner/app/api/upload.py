from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from database.schema import Receipt, Vendor
from services.image_cleaner import clean_image
from services.ocr_service import run_ocr
from services.text_normalizer import normalize_text, extract_merchant_line, preprocess_for_llm
from services.embedding_service import embed_text
from services.vector_store import store_vector, search_similar
from services.openrouter_extractor import extract_receipt_info, safe_amount
from services.few_shot_builder import build_few_shot_examples
from services.amount_extractor import extract_amount, extract_date  # kept as fallback
from services.vendor_detector import detect_vendor  # kept as fallback
from utils.validators import validate_receipt_data
from config import settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/upload")
async def upload_receipt(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Full receipt processing pipeline:
    Image → Clean → OCR → Normalize → Embed → Store → Extract
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    if len(image_bytes) > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large")

    try:
        print("\n" + "🔄"*30)
        print(f"📁 NEW UPLOAD: {file.filename}")
        print("🔄"*30)

        # Stage 1
        print("\n[1/8] 🖼️  IMAGE CLEANER — fixing image quality...")
        cleaned_image = clean_image(image_bytes)
        print("      ✅ Image cleaned")

        # Stage 2
        print("\n[2/8] 🔍 OCR SERVICE — reading text from image...")
        raw_text = run_ocr(cleaned_image)
        if not raw_text.strip():
            raise HTTPException(status_code=422, detail="No text detected in image")
        print(f"      ✅ OCR complete — {len(raw_text)} chars extracted")

        # Stage 3
        print("\n[3/8] 📝 TEXT NORMALIZER — cleaning text (2 versions)...")
        normalized = normalize_text(raw_text)
        llm_text = preprocess_for_llm(raw_text)
        print(f"      ✅ Normalized: {len(normalized)} chars | LLM text: {len(llm_text)} chars")

        # Stage 4
        print("\n[4/8] 🧮 EMBEDDING SERVICE — converting text to 384-dim vector...")
        vector = embed_text(normalized)
        print(f"      ✅ Vector generated")

        # Stage 5
        print("\n[5/8] 🗄️  VECTOR STORE — searching similar past receipts...")
        similar = search_similar(vector, top_k=3)
        print(f"      ✅ Found {len(similar)} similar receipts")

        # Stage 6
        print("\n[6/8] 🤖 OPENROUTER LLM — extracting structured data...")
        few_shot_examples = build_few_shot_examples(similar, db)
        print(f"      📎 Few-shot examples: {len(few_shot_examples)}")
        llm_data = extract_receipt_info(llm_text, examples=few_shot_examples)
        print(f"      ✅ LLM returned: {llm_data}")

        # Vendor
        print("\n[7/8] 🏪 VENDOR DETECTOR — identifying merchant...")
        vendor_name = llm_data.get("vendor") or None
        vendor_type = "unknown"
        if not vendor_name:
            vendor_name, vendor_type = detect_vendor(raw_text)
            print(f"      ⚠️  LLM missed vendor — fallback detected: {vendor_name}")
        else:
            print(f"      ✅ Vendor: {vendor_name}")

        # Amount
        amount = safe_amount(llm_data.get("amount"))
        if amount is None:
            amount = extract_amount(raw_text)
            print(f"      ⚠️  LLM missed amount — fallback extracted: {amount}")
        else:
            print(f"      ✅ Amount: {amount}")

        # Date
        receipt_date = None
        llm_date = llm_data.get("date")
        if llm_date:
            try:
                from datetime import datetime
                receipt_date = datetime.strptime(str(llm_date), "%Y-%m-%d").date()
                print(f"      ✅ Date: {receipt_date}")
            except ValueError:
                receipt_date = extract_date(raw_text)
                print(f"      ⚠️  LLM date unparseable — fallback: {receipt_date}")
        else:
            receipt_date = extract_date(raw_text)
            print(f"      ⚠️  LLM missed date — fallback: {receipt_date}")

        # Stage 8
        print("\n[8/8] ✅ VALIDATOR + DATABASE — scoring & storing...")
        validation = validate_receipt_data(vendor_name, amount, receipt_date, raw_text)
        print(f"      📊 Confidence: {validation['confidence_score']:.0%}")
        if validation['warnings']:
            for w in validation['warnings']:
                print(f"      ⚠️  Warning: {w}")

        llm_category = llm_data.get("category")
        category = "uncategorized"
        if llm_category and llm_category not in (None, "null", "other", ""):
            category = llm_category
        elif similar:
            top_match = similar[0]
            if top_match[1] < 1.0:
                category = top_match[2].get('category', 'uncategorized')

        print(f"      🏷️  Category: {category}")

        # Stage 10: Store structured record
        receipt = Receipt(
            vendor=vendor_name,
            category=category,
            amount=amount,
            date=receipt_date,
            raw_text=raw_text,
            normalized_text=normalized,
            filename=file.filename,
            confidence_score=validation['confidence_score'],
            extra_data={
                "vendor_type": vendor_type,
                "warnings": validation['warnings'],
                "similar_count": len(similar)
            }
        )
        db.add(receipt)
        db.flush()  # Get ID before storing vector

        # Store vector with receipt reference
        vector_id = store_vector(vector, {
            "receipt_id": receipt.id,
            "normalized_text": normalized,
            "vendor": vendor_name,
            "category": category,
            "amount": amount,
        })

        receipt.vector_id = vector_id
        db.commit()
        db.refresh(receipt)

        # Stage 9: Push to fintech expense tracker
        print("\n[9/9] 💸 EXPENSE BRIDGE — syncing to fintech backend...")
        from services.expense_bridge import push_receipt_to_expense
        bridge_result = push_receipt_to_expense(
            vendor=vendor_name,
            amount=amount,
            category=category,
        )
        print(f"      {'✅' if bridge_result['pushed'] else '⚠️ '} Bridge: {bridge_result}")

        # Update or create vendor record
        vendor_record = db.query(Vendor).filter_by(name=vendor_name).first()
        if vendor_record:
            vendor_record.receipt_count += 1
        else:
            db.add(Vendor(name=vendor_name, receipt_count=1))
        db.commit()

        print(f"\n{'✅'*30}")
        print(f"✅ DONE — Receipt #{receipt.id} stored successfully")
        print(f"   Vendor: {vendor_name} | Category: {category} | Date: {receipt_date}")
        print(f"{'✅'*30}\n")

        return {
            "id": receipt.id,
            "receipt_id": str(receipt.id),
            "vendor": vendor_name,
            "category": category,
            "amount": amount,
            "date": str(receipt_date) if receipt_date else None,
            "confidence_score": validation['confidence_score'],
            "warnings": validation['warnings'],
            "similar_receipts": [
                {"distance": r[1], "vendor": r[2].get("vendor")}
                for r in similar
            ],
            "raw_text": raw_text,
            "expense_synced": bridge_result.get("pushed", False),
            "expense_category_id": bridge_result.get("category_id"),
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"\n❌ PIPELINE FAILED at: {e}\n")
        logger.error(f"Processing failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

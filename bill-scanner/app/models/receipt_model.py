from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReceiptCreate(BaseModel):
    vendor: Optional[str] = None
    category: Optional[str] = "pending"
    amount: Optional[float] = None
    date: Optional[str] = None
    raw_text: Optional[str] = None
    filename: Optional[str] = None


class ReceiptResponse(BaseModel):
    id: str
    vendor: Optional[str]
    category: Optional[str]
    amount: Optional[float]
    date: Optional[str]
    filename: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class UploadResponse(BaseModel):
    success: bool
    receipt_id: str
    vendor: Optional[str]
    amount: Optional[float]
    date: Optional[str]
    category: str
    raw_text: str
    validation: dict

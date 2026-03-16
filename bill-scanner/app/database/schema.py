from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Text, JSON, Boolean
from sqlalchemy.sql import func
from database.db import Base

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    vendor = Column(String(255), nullable=True, index=True)
    category = Column(String(255), nullable=True, index=True)
    amount = Column(Float, nullable=True)
    date = Column(Date, nullable=True)
    raw_text = Column(Text)
    normalized_text = Column(Text)
    vector_id = Column(Integer, nullable=True)
    filename = Column(String(500), nullable=True)
    confidence_score = Column(Float, nullable=True)
    extra_data = Column(JSON, nullable=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    vector_id = Column(Integer, nullable=True)
    receipt_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True)
    cluster_id = Column(Integer, nullable=True)
    receipt_count = Column(Integer, default=0)
    keywords = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

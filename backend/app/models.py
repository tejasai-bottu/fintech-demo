from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class IncomeType(enum.Enum):
    SALARIED = "salaried"
    SELF_EMPLOYED = "self_employed"
    BUSINESS = "business"
    FREELANCE = "freelance"

class DebtType(enum.Enum):
    HOME_LOAN = "home_loan"
    CAR_LOAN = "car_loan"
    PERSONAL_LOAN = "personal_loan"
    CREDIT_CARD = "credit_card"
    EDUCATION = "education"
    OTHER = "other"

class GoalType(enum.Enum):
    SHORT_TERM = "short_term"  # < 1 year
    MEDIUM_TERM = "medium_term"  # 1-5 years
    LONG_TERM = "long_term"  # > 5 years

class Priority(enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    
    # Income Configuration
    gross_monthly_salary = Column(Float)
    gross_annual_salary = Column(Float)  # Auto-calculated
    income_type = Column(SQLEnum(IncomeType))
    
    # Location for tax calculation
    country = Column(String, default="India")
    state = Column(String)  # For regional tax
    
    # Tax & Deductions
    tax_amount = Column(Float)  # Auto-calculated
    pf_amount = Column(Float, default=0)
    other_deductions = Column(Float, default=0)
    net_monthly_income = Column(Float)  # Auto-calculated
    
    # Risk Profile
    risk_tolerance = Column(String)  # low, medium, high
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    additional_incomes = relationship("AdditionalIncome", back_populates="user", cascade="all, delete-orphan")
    debts = relationship("Debt", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    expense_categories = relationship("ExpenseCategory", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")

class AdditionalIncome(Base):
    __tablename__ = "additional_incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    source_name = Column(String)  # "Rental Income", "Freelance", etc.
    monthly_amount = Column(Float)
    is_recurring = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="additional_incomes")

class Debt(Base):
    __tablename__ = "debts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    debt_type = Column(SQLEnum(DebtType))
    debt_name = Column(String)  # Custom name like "HDFC Home Loan"
    
    total_principal = Column(Float)  # Original loan amount
    outstanding_principal = Column(Float)  # Current outstanding
    interest_rate = Column(Float)  # Annual %
    tenure_months = Column(Integer)  # Total tenure
    remaining_months = Column(Integer)  # Months left
    monthly_emi = Column(Float)
    
    start_date = Column(DateTime)
    expected_end_date = Column(DateTime)
    
    is_active = Column(Boolean, default=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="debts")

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    goal_name = Column(String)  # "Emergency Fund", "Vacation", etc.
    target_amount = Column(Float)
    current_saved = Column(Float, default=0)
    target_date = Column(DateTime)
    
    priority = Column(SQLEnum(Priority))
    goal_type = Column(SQLEnum(GoalType))
    
    monthly_contribution_needed = Column(Float)  # Auto-calculated
    is_achieved = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="savings_goals")

class ExpenseCategory(Base):
    __tablename__ = "expense_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    category_name = Column(String)  # "Housing", "Food", "Transport", etc.
    monthly_amount = Column(Float)
    is_essential = Column(Boolean, default=True)
    is_fixed = Column(Boolean, default=True)  # Fixed vs Variable
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="expense_categories")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"))

    user = relationship("User", back_populates="expenses")

# Keep existing Investment and Expense models as they are
class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float)
    investment_type = Column(String)
    duration_years = Column(Integer)
    predicted_return = Column(Float)
    risk_score = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="investments")

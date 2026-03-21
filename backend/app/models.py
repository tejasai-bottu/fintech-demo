from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum as SQLEnum, CheckConstraint, Index
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

class BillType(enum.Enum):
    CREDIT_CARD = "credit_card"
    ELECTRICITY = "electricity"
    INTERNET = "internet"
    MOBILE = "mobile"
    INSURANCE = "insurance"
    SUBSCRIPTION = "subscription"
    OTHER = "other"

class BillStatus(enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    PARTIALLY_PAID = "partially_paid"

class BillCycleStatus(enum.Enum):
    OPEN = "open"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"

class PaymentMethod(enum.Enum):
    UPI = "upi"
    NET_BANKING = "net_banking"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    CASH = "cash"
    AUTO_DEBIT = "auto_debit"

class EventType(enum.Enum):
    PAYMENT_MADE = "payment_made"
    PAYMENT_MISSED = "payment_missed"
    LATE_FEE_ADDED = "late_fee_added"
    INTEREST_APPLIED = "interest_applied"
    INCOME_RECEIVED = "income_received"
    BILL_CREATED = "bill_created"
    DEBT_ADDED = "debt_added"
    GOAL_CREATED = "goal_created"
    GOAL_ACHIEVED = "goal_achieved"
    EXPENSE_ADDED = "expense_added"
    DTI_CHANGED = "dti_changed"

class CalendarEventStatus(enum.Enum):
    UPCOMING = "upcoming"
    DUE_TODAY = "due_today"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class NotificationSeverity(enum.Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"

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
    investments = relationship("Investment", back_populates="user", cascade="all, delete-orphan")
    bills = relationship("Bill", back_populates="user", cascade="all, delete-orphan")
    financial_events = relationship("FinancialEvent", back_populates="user", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="user", cascade="all, delete-orphan")
    expense_transactions = relationship("ExpenseTransaction", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    net_worth_snapshots = relationship("NetWorthSnapshot", back_populates="user", cascade="all, delete-orphan")

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
    goal_category = Column(String, nullable=True)

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
    transactions = relationship("ExpenseTransaction", back_populates="category")

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

class Bill(Base):
    __tablename__ = "bills"
    __table_args__ = (
        CheckConstraint("total_amount_due >= 0", name="chk_bill_amount_non_negative"),
        CheckConstraint("interest_rate >= 0", name="chk_bill_rate_non_negative"),
        CheckConstraint("late_fee >= 0", name="chk_bill_late_fee_non_negative"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    bill_name = Column(String)                      # "HDFC Credit Card", "Airtel Broadband"
    bill_type = Column(SQLEnum(BillType))
    
    # Amounts
    total_amount_due = Column(Float)                # Full amount this cycle
    minimum_due = Column(Float, default=0)          # Minimum payment required
    outstanding_balance = Column(Float, default=0)  # For credit cards — running balance
    credit_limit = Column(Float, default=0)         # For credit cards only
    
    # Dates
    billing_cycle_day = Column(Integer)             # Day of month bill generates (e.g., 1)
    due_date_day = Column(Integer)                  # Day of month payment due (e.g., 15)
    next_due_date = Column(DateTime)                # Absolute next due date
    
    # Interest & Penalties
    interest_rate = Column(Float, default=0)        # Annual % (credit cards: 36-42%)
    late_fee = Column(Float, default=0)             # Fixed late fee amount
    
    # Status
    status = Column(SQLEnum(BillStatus), default=BillStatus.PENDING)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="bills")
    payments = relationship("BillPayment", back_populates="bill", cascade="all, delete-orphan")
    cycles = relationship("BillCycle", back_populates="bill", cascade="all, delete-orphan")

class BillCycle(Base):
    __tablename__ = "bill_cycles"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    user_id = Column(Integer, ForeignKey("users.id"))

    cycle_start = Column(DateTime)
    cycle_end = Column(DateTime)
    due_date = Column(DateTime)

    amount_due = Column(Float)
    minimum_due = Column(Float, default=0)
    paid_amount = Column(Float, default=0)

    status = Column(SQLEnum(BillCycleStatus), default=BillCycleStatus.OPEN)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    bill = relationship("Bill", back_populates="cycles")

class BillPayment(Base):
    __tablename__ = "bill_payments"
    __table_args__ = (
        CheckConstraint("amount_paid > 0", name="chk_payment_amount_positive"),
        Index("idx_payments_bill", "bill_id"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    amount_paid = Column(Float)
    payment_date = Column(DateTime)
    due_date_at_payment = Column(DateTime)          # What the due date was when paid
    
    was_late = Column(Boolean, default=False)       # Was this payment after due date?
    days_late = Column(Integer, default=0)          # How many days late
    late_fee_charged = Column(Float, default=0)     # Late fee that was charged
    interest_charged = Column(Float, default=0)     # Interest charged
    
    payment_method = Column(SQLEnum(PaymentMethod), nullable=True)
    notes = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    bill = relationship("Bill", back_populates="payments")

class FinancialEvent(Base):
    __tablename__ = "financial_events"
    __table_args__ = (
        Index("idx_events_user_date", "user_id", "created_at"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    event_type = Column(SQLEnum(EventType))
    description = Column(String)                    # Human readable: "Late fee of ₹500 on HDFC Card"
    amount = Column(Float, nullable=True)           # The monetary impact
    
    reference_type = Column(String, nullable=True)  # "bill", "debt", "goal"
    reference_id = Column(Integer, nullable=True)   # ID in that table
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="financial_events")

class CalendarEvent(Base):
    __tablename__ = "financial_calendar"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    event_type = Column(String)                     # "emi_payment", "bill_due", "goal_deadline", "investment_maturity"
    event_title = Column(String)                    # "HDFC Home Loan EMI", "Credit Card Due"
    event_date = Column(DateTime)
    amount = Column(Float, nullable=True)
    
    reference_type = Column(String, nullable=True)
    reference_id = Column(Integer, nullable=True)
    
    is_recurring = Column(Boolean, default=True)
    recurrence_day = Column(Integer, nullable=True) # Day of month for monthly recurring
    
    status = Column(SQLEnum(CalendarEventStatus), default=CalendarEventStatus.UPCOMING)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="calendar_events")

class ExpenseTransaction(Base):
    __tablename__ = "expense_transactions"
    __table_args__ = (
        CheckConstraint("amount > 0", name="chk_transaction_amount_positive"),
        Index("idx_transactions_user_date", "user_id", "transaction_date"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_id = Column(Integer, ForeignKey("expense_categories.id"), nullable=True)
    
    description = Column(String)                    # "Zomato dinner", "Metro card recharge"
    amount = Column(Float)
    transaction_date = Column(DateTime)
    
    # Link to bill if this transaction paid a bill
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="expense_transactions")
    category = relationship("ExpenseCategory", back_populates="transactions")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    title = Column(String)
    message = Column(String)
    severity = Column(SQLEnum(NotificationSeverity), default=NotificationSeverity.INFO)

    # Link to what caused this notification
    reference_type = Column(String, nullable=True)   # "bill", "goal", "debt"
    reference_id = Column(Integer, nullable=True)

    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class NetWorthSnapshot(Base):
    __tablename__ = "net_worth_snapshots"
    __table_args__ = (
        Index("idx_snapshot_user_date", "user_id", "snapshot_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    total_assets = Column(Float)
    total_liabilities = Column(Float)
    net_worth = Column(Float)

    investments = Column(Float)
    savings = Column(Float)
    total_debt = Column(Float)
    credit_outstanding = Column(Float)

    snapshot_date = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="net_worth_snapshots")

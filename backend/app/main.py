from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base, User, IncomeType
from .routes import auth, investment, debt, expense, dashboard, profile

Base.metadata.create_all(bind=engine)

# Create demo user if doesn't exist
from .database import SessionLocal

db = SessionLocal()
demo_user = db.query(User).filter(User.email == "demo@user.com").first()
if not demo_user:
    demo_user = User(
        email="demo@user.com",
        hashed_password="not-needed",
        full_name="Demo User",
            gross_monthly_salary=75000.0,
            net_monthly_income=75000.0,  # ADD THIS LINE
            income_type=IncomeType.SALARIED,        risk_tolerance="medium"
        )
    db.add(demo_user)
    db.commit()
db.close()

app = FastAPI(
    title="AI Financial Advisory API",
    description="Intelligent financial planning system",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(investment.router)
app.include_router(debt.router)
app.include_router(expense.router)
app.include_router(dashboard.router)
app.include_router(profile.router)

@app.get("/")
async def root():
    return {"message": "AI Financial Advisory API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

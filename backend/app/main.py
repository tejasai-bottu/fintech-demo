from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import threading
import time

from .database import engine
from .models import Base, User, IncomeType
from .routes import auth, investment, debt, dashboard, profile, bills, calendar, transactions, notifications
from .scheduler import (
    start_scheduler, check_overdue_bills, generate_notifications, 
    daily_networth_snapshot, generate_bill_cycles
)

# Create the limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Financial Advisory API",
    description="Intelligent financial planning system",
    version="1.0.0"
)

# Attach limiter to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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
app.include_router(dashboard.router)
app.include_router(profile.router)
app.include_router(bills.router)
app.include_router(calendar.router)
app.include_router(transactions.router)
app.include_router(notifications.router)

@app.on_event("startup")
async def startup_event():
    # Create all tables directly (bypasses Alembic for demo)
    Base.metadata.create_all(bind=engine)
    
    scheduler = start_scheduler()

    # Run time-sensitive jobs immediately on startup too
    def run_startup_jobs():
        time.sleep(5)  # Wait 5 seconds for DB to be fully ready
        try:
            check_overdue_bills()
            generate_bill_cycles()
            generate_notifications()
            daily_networth_snapshot()
            print("[Startup] Initial jobs completed")
        except Exception as e:
            print(f"[Startup] Error running initial jobs: {e}")

    thread = threading.Thread(target=run_startup_jobs, daemon=True)
    thread.start()

@app.get("/")
async def root():
    return {"message": "AI Financial Advisory API", "version": "1.0.0", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

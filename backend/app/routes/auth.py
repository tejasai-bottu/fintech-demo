from fastapi import APIRouter
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/auth", tags=["authentication"])

class DemoUser(BaseModel):
    email: EmailStr
    name: str
    monthly_income: float
    risk_tolerance: str

@router.get("/demo-user", response_model=DemoUser)
async def get_demo_user():
    return {
        "email": "demo@user.com",
        "name": "Demo User",
        "monthly_income": 75000,
        "risk_tolerance": "medium"
    }

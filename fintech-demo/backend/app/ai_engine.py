import random
import numpy as np

class AIFinancialEngine:
    """Simulated AI engine using rule-based logic"""
    
    @staticmethod
    def predict_investment_return(risk_level: str, amount: float, years: int) -> dict:
        base_rates = {
            "low": (0.05, 0.08),
            "medium": (0.09, 0.13),
            "high": (0.12, 0.18)
        }
        
        min_rate, max_rate = base_rates.get(risk_level, (0.06, 0.10))
        predicted_rate = random.uniform(min_rate, max_rate)
        future_value = amount * ((1 + predicted_rate) ** years)
        total_return = future_value - amount
        
        risk_score = {
            "low": random.uniform(15, 30),
            "medium": random.uniform(35, 60),
            "high": random.uniform(65, 85)
        }.get(risk_level, 50)
        
        monthly_projections = []
        for month in range(1, years * 12 + 1):
            month_value = amount * ((1 + predicted_rate) ** (month / 12))
            monthly_projections.append({"month": month, "value": round(month_value, 2)})
        
        return {
            "predicted_rate": round(predicted_rate * 100, 2),
            "future_value": round(future_value, 2),
            "total_return": round(total_return, 2),
            "risk_score": round(risk_score, 2),
            "monthly_projections": monthly_projections
        }
    
    @staticmethod
    def generate_investment_recommendation(income: float, risk_tolerance: str, current_investments: float) -> dict:
        recommended_investment = income * random.uniform(0.20, 0.30)
        
        allocations = {
            "low": {"bonds": 65, "mutual_funds": 25, "stocks": 10},
            "medium": {"bonds": 35, "mutual_funds": 45, "stocks": 20},
            "high": {"bonds": 15, "mutual_funds": 35, "stocks": 50}
        }
        
        allocation = allocations.get(risk_tolerance, allocations["medium"])
        
        return {
            "recommended_monthly_investment": round(recommended_investment, 2),
            "asset_allocation": allocation,
            "reasoning": f"Based on your {risk_tolerance} risk profile",
            "expected_annual_return": round(random.uniform(8, 15), 2)
        }
    
    @staticmethod
    def analyze_expenses(expenses: list) -> dict:
        if not expenses:
            return {"total_expenses": 0, "breakdown": {}, "insights": [], "savings_potential": 0}
        
        breakdown = {}
        total = 0
        for expense in expenses:
            category = expense.get("category", "other")
            amount = expense.get("amount", 0)
            breakdown[category] = breakdown.get(category, 0) + amount
            total += amount
        
        breakdown_percent = {k: (v/total)*100 for k, v in breakdown.items()}
        
        insights = []
        for category, percent in breakdown_percent.items():
            if category == "rent" and percent > 40:
                insights.append({"type": "warning", "message": f"Housing costs are high at {percent:.1f}%"})
            elif category == "entertainment" and percent > 15:
                insights.append({"type": "tip", "message": f"Entertainment spending is {percent:.1f}%"})
        
        return {
            "total_expenses": round(total, 2),
            "breakdown": {k: round(v, 2) for k, v in breakdown.items()},
            "breakdown_percent": {k: round(v, 2) for k, v in breakdown_percent.items()},
            "insights": insights,
            "savings_potential": round(total * 0.15, 2)
        }
    
    @staticmethod
    def get_market_insights() -> dict:
        return {
            "indices": {
                "NIFTY": round(random.uniform(19500, 20500), 2),
                "SENSEX": round(random.uniform(64500, 66500), 2),
                "GOLD": round(random.uniform(60000, 62000), 2)
            },
            "trends": {
                "equity_market": random.choice(["bullish", "neutral", "bearish"]),
                "interest_rates": random.choice(["rising", "stable", "falling"]),
                "inflation": round(random.uniform(5.5, 6.5), 2)
            },
            "recommendations": [
                "Diversify portfolio across asset classes",
                "Consider SIP for long-term wealth creation",
                "Maintain emergency fund of 6 months expenses"
            ]
        }

import random
from typing import List, Dict
from datetime import datetime

class AIFinancialEngine:
    """Simulated AI engine using rule-based logic"""
    
    @staticmethod
    def predict_investment_return(risk_level: str, amount: float, years: int) -> dict:
        base_rates = {
            "low": (0.05, 0.08),
            "medium": (0.08, 0.15),
            "high": (0.12, 0.25)
        }
        
        min_rate, max_rate = base_rates.get(risk_level.lower(), (0.05, 0.12))
        expected_rate = (min_rate + max_rate) / 2
        
        projections = []
        current_amount = amount
        for year in range(1, years + 1):
            # Add some variability
            yearly_return = current_amount * expected_rate * (1 + random.uniform(-0.05, 0.05))
            current_amount += yearly_return
            projections.append({
                "year": year,
                "value": round(current_amount, 2),
                "growth": round(yearly_return, 2)
            })
            
        return {
            "projections": projections,
            "total_value": round(current_amount, 2),
            "total_profit": round(current_amount - amount, 2),
            "annual_yield": f"{expected_rate*100:.1f}%"
        }

    @staticmethod
    def generate_investment_recommendation(income: float, risk_tolerance: str, total_investments: float) -> dict:
        monthly_investable = income * 0.2  # Recommend 20%
        
        assets = []
        if risk_tolerance.lower() == "low":
            assets = [
                {"type": "Fixed Deposits", "allocation": "50%", "expected_return": "7%"},
                {"type": "Debt Mutual Funds", "allocation": "30%", "expected_return": "8%"},
                {"type": "Gold", "allocation": "20%", "expected_return": "10%"}
            ]
        elif risk_tolerance.lower() == "medium":
            assets = [
                {"type": "Index Funds", "allocation": "40%", "expected_return": "12%"},
                {"type": "Blue-chip Stocks", "allocation": "30%", "expected_return": "15%"},
                {"type": "Debt Funds", "allocation": "20%", "expected_return": "8%"},
                {"type": "Gold", "allocation": "10%", "expected_return": "10%"}
            ]
        else: # High risk
            assets = [
                {"type": "Mid-cap Stocks", "allocation": "40%", "expected_return": "20%"},
                {"type": "Small-cap Stocks", "allocation": "30%", "expected_return": "25%"},
                {"type": "Index Funds", "allocation": "20%", "expected_return": "12%"},
                {"type": "Crypto", "allocation": "10%", "expected_return": "Variable"}
            ]
            
        return {
            "risk_profile": risk_tolerance,
            "recommended_monthly": round(monthly_investable, 2),
            "asset_allocation": assets,
            "summary": f"Based on your {risk_tolerance} risk profile and monthly income of ₹{income:,.0f}, we recommend investing ₹{monthly_investable:,.0f} per month."
        }

    @staticmethod
    def get_market_insights() -> dict:
        try:
            import yfinance as yf
            nifty = yf.Ticker("^NSEI")
            sensex = yf.Ticker("^BSESN")
            gold = yf.Ticker("GC=F")
            
            # Using fast_info or history
            nifty_price = round(nifty.fast_info["lastPrice"], 2)
            sensex_price = round(sensex.fast_info["lastPrice"], 2)
            gold_price = round(gold.fast_info["lastPrice"] * 83, 2)  # Convert USD to INR
            
            return {
                "indices": {
                    "NIFTY": nifty_price,
                    "SENSEX": sensex_price,
                    "GOLD": gold_price
                },
                "data_source": "live",
                "last_updated": datetime.utcnow().isoformat()
            }
        except Exception:
            # Fallback to cached/static values if API fails
            return {
                "indices": {"NIFTY": 22500, "SENSEX": 74000, "GOLD": 62000},
                "data_source": "fallback",
                "last_updated": datetime.utcnow().isoformat()
            }

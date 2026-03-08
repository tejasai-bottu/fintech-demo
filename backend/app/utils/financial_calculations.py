import math

def calculate_emi(principal: float, annual_rate: float, tenure_months: int) -> float:
    """Calculate EMI using standard formula"""
    if annual_rate == 0:
        return principal / tenure_months
    
    monthly_rate = annual_rate / (12 * 100)
    emi = (principal * monthly_rate * math.pow(1 + monthly_rate, tenure_months)) /           (math.pow(1 + monthly_rate, tenure_months) - 1)
    return round(emi, 2)

def calculate_total_interest(principal: float, emi: float, tenure_months: int) -> float:
    """Calculate total interest paid"""
    total_payment = emi * tenure_months
    return round(total_payment - principal, 2)

def calculate_future_value(principal: float, annual_rate: float, years: int) -> float:
    """Calculate future value of investment"""
    return round(principal * math.pow(1 + annual_rate, years), 2)

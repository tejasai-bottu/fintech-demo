def calculate_indian_income_tax(annual_income: float, state: str = None) -> dict:
    """
    Calculate income tax based on new Indian tax regime (2024-25)
    """
    
    # Tax slabs for new regime
    tax_slabs = [
        (300000, 0),      # Up to 3L: 0%
        (600000, 0.05),   # 3L-6L: 5%
        (900000, 0.10),   # 6L-9L: 10%
        (1200000, 0.15),  # 9L-12L: 15%
        (1500000, 0.20),  # 12L-15L: 20%
        (float('inf'), 0.30)  # Above 15L: 30%
    ]
    
    tax = 0
    previous_limit = 0
    
    for limit, rate in tax_slabs:
        if annual_income > limit:
            taxable_in_slab = limit - previous_limit
            tax += taxable_in_slab * rate
            previous_limit = limit
        else:
            taxable_in_slab = annual_income - previous_limit
            tax += taxable_in_slab * rate
            break
    
    # Standard deduction (₹50,000 for salaried)
    standard_deduction = 50000
    tax = max(0, tax - (standard_deduction * 0.05))
    
    # Cess (4% on tax)
    cess = tax * 0.04
    total_tax = tax + cess
    
    # Monthly tax
    monthly_tax = total_tax / 12
    
    return {
        "annual_income": annual_income,
        "annual_tax": round(total_tax, 2),
        "monthly_tax": round(monthly_tax, 2),
        "effective_rate": round((total_tax / annual_income) * 100, 2) if annual_income > 0 else 0,
        "breakdown": {
            "base_tax": round(tax, 2),
            "cess": round(cess, 2)
        }
    }

def calculate_pf_deduction(gross_monthly: float) -> float:
    """
    Calculate PF deduction (12% of basic salary)
    Assuming basic = 50% of gross
    """
    basic_salary = gross_monthly * 0.5
    pf = basic_salary * 0.12
    return round(pf, 2)

def calculate_tax_india(annual_income: float, state: str = None) -> dict:
    """Alias that matches what profile.py expects"""
    tax = calculate_indian_income_tax(annual_income, state)
    pf = calculate_pf_deduction(annual_income / 12)
    net = (annual_income / 12) - tax["monthly_tax"] - pf
    return {
        "monthly_tax": tax["monthly_tax"],
        "monthly_pf": pf,
        "monthly_net_take_home": round(net, 2),
        "annual_tax": tax["annual_tax"],
        "effective_rate": tax["effective_rate"]
    }

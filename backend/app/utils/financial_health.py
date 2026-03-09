from typing import Dict, List

def calculate_dti_ratio(total_emi: float, net_income: float) -> dict:
    """
    Calculate Debt-to-Income Ratio
    """
    if net_income == 0:
        return {"ratio": 0, "status": "N/A", "severity": "info"}
    
    dti = (total_emi / net_income) * 100
    
    if dti < 30:
        status = "Healthy"
        severity = "success"
        message = "Your debt levels are well-managed"
    elif dti < 40:
        status = "Moderate"
        severity = "warning"
        message = "Be cautious with new debt"
    elif dti < 50:
        status = "High Risk"
        severity = "danger"
        message = "Focus on debt reduction immediately"
    else:
        status = "Critical"
        severity = "critical"
        message = "Urgent debt reduction needed"
    
    return {
        "ratio": round(dti, 2),
        "status": status,
        "severity": severity,
        "message": message
    }

def calculate_emergency_fund_status(current_savings: float, monthly_expenses: float) -> dict:
    """
    Check emergency fund adequacy (3-6 months recommended)
    """
    minimum_required = monthly_expenses * 3
    recommended_required = monthly_expenses * 6
    
    if current_savings >= recommended_required:
        status = "Excellent"
        severity = "success"
        months_covered = current_savings / monthly_expenses if monthly_expenses > 0 else 0
        message = f"You have {months_covered:.1f} months of expenses covered"
    elif current_savings >= minimum_required:
        status = "Adequate"
        severity = "success"
        shortfall = recommended_required - current_savings
        message = f"Build ₹{shortfall:,.0f} more to reach 6-month goal"
    elif current_savings > 0:
        status = "Insufficient"
        severity = "warning"
        shortfall = minimum_required - current_savings
        message = f"Need ₹{shortfall:,.0f} more to reach minimum (3 months)"
    else:
        status = "Missing"
        severity = "critical"
        message = f"Build emergency fund of ₹{minimum_required:,.0f} (3 months expenses)"
    
    return {
        "current_savings": current_savings,
        "minimum_required": minimum_required,
        "recommended_required": recommended_required,
        "months_covered": round(current_savings / monthly_expenses, 1) if monthly_expenses > 0 else 0,
        "status": status,
        "severity": severity,
        "message": message
    }

def validate_financial_feasibility(
    net_income: float,
    total_expenses: float,
    total_emi: float,
    required_savings: float
) -> dict:
    """
    Validate if financial plan is feasible
    """
    committed = total_expenses + total_emi
    available = net_income - committed
    shortfall = required_savings - available
    
    buffer_percentage = 10  # Recommend 10% buffer
    recommended_buffer = net_income * (buffer_percentage / 100)
    
    is_feasible = (committed + required_savings + recommended_buffer) <= net_income
    
    if is_feasible:
        surplus = net_income - (committed + required_savings)
        return {
            "feasible": True,
            "severity": "success",
            "message": f"Your plan is achievable with ₹{surplus:,.0f} buffer",
            "details": {
                "net_income": net_income,
                "committed": committed,
                "required_savings": required_savings,
                "available": available,
                "surplus": surplus
            }
        }
    else:
        return {
            "feasible": False,
            "severity": "critical",
            "message": f"Shortfall of ₹{abs(shortfall):,.0f}/month",
            "details": {
                "net_income": net_income,
                "committed": committed,
                "required_savings": required_savings,
                "available": available,
                "shortfall": abs(shortfall)
            },
            "suggestions": generate_shortfall_suggestions(shortfall, total_expenses, total_emi)
        }

def generate_shortfall_suggestions(shortfall: float, expenses: float, emi: float) -> List[str]:
    """
    Generate actionable suggestions to address shortfall
    """
    suggestions = []
    
    # Calculate what % reduction needed
    expense_reduction_needed = (shortfall / expenses) * 100 if expenses > 0 else 0
    
    suggestions.append(f"Option 1: Reduce expenses by ₹{shortfall:,.0f} ({expense_reduction_needed:.1f}%)")
    
    # Timeline extension suggestion
    months_needed = 12  # Default
    extended_months = int((shortfall / (shortfall * 0.3)) * months_needed) if shortfall > 0 else 12
    suggestions.append(f"Option 2: Extend savings timeline to {extended_months} months")
    
    # Income increase suggestion
    income_increase_needed = shortfall
    suggestions.append(f"Option 3: Increase income by ₹{income_increase_needed:,.0f}/month")
    
    # Debt prepayment suggestion (if applicable)
    if emi > 0:
        suggestions.append(f"Option 4: After clearing debts, ₹{emi:,.0f}/month becomes available")
    
    return suggestions

def calculate_expense_ratios(expenses_by_category: Dict[str, float], net_income: float) -> dict:
    """
    Calculate and validate expense ratios
    """
    warnings = []
    
    # Recommended maximum percentages
    thresholds = {
        "housing": 40,
        "food": 25,
        "transport": 15,
        "subscriptions": 10,
        "insurance": 15
    }
    
    total_expenses = sum(expenses_by_category.values())
    expense_ratios = {}
    
    for category, amount in expenses_by_category.items():
        ratio = (amount / net_income) * 100 if net_income > 0 else 0
        expense_ratios[category] = {
            "amount": amount,
            "percentage": round(ratio, 2)
        }
        
        # Check against thresholds
        if category.lower() in thresholds:
            threshold = thresholds[category.lower()]
            if ratio > threshold:
                warnings.append({
                    "category": category,
                    "current": round(ratio, 1),
                    "threshold": threshold,
                    "message": f"{category} expenses at {ratio:.1f}% (above {threshold}% limit)"
                })
    
    # Overall expense ratio
    overall_ratio = (total_expenses / net_income) * 100 if net_income > 0 else 0
    
    if overall_ratio > 70:
        warnings.append({
            "category": "Overall",
            "current": round(overall_ratio, 1),
            "threshold": 70,
            "message": f"Total expenses at {overall_ratio:.1f}% - limited savings capacity"
        })
    
    return {
        "total_expenses": total_expenses,
        "overall_ratio": round(overall_ratio, 2),
        "by_category": expense_ratios,
        "warnings": warnings
    }

def generate_smart_recommendations(user, debts, goals, expenses) -> List[dict]:
    """
    Generate smart financial recommendations based on user's profile.
    """
    recommendations = []
    
    net_income = user.net_monthly_income or 0
    total_emi = sum(d.monthly_emi for d in debts)
    total_expenses = sum(e.monthly_amount for e in expenses)
    total_savings_needed = sum(g.monthly_contribution_needed for g in goals)
    
    # DTI check
    if net_income > 0:
        dti = (total_emi / net_income) * 100
        if dti > 50:
            recommendations.append({
                "type": "debt",
                "priority": "high",
                "message": f"Your DTI ratio is {dti:.0f}% — critically high.",
                "action": "Consider consolidating loans or increasing income to reduce debt burden."
            })
        elif dti > 40:
            recommendations.append({
                "type": "debt",
                "priority": "medium",
                "message": f"Your DTI ratio is {dti:.0f}% — above safe threshold.",
                "action": "Avoid taking new loans and focus on debt repayment."
            })
    
    # Savings check
    available = net_income - total_expenses - total_emi
    if available < 0:
        recommendations.append({
            "type": "budget",
            "priority": "high",
            "message": "Your expenses exceed your income — you're in a deficit.",
            "action": "Review non-essential expenses immediately."
        })
    elif available < net_income * 0.1:
        recommendations.append({
            "type": "savings",
            "priority": "medium",
            "message": "Less than 10% of income is available after commitments.",
            "action": "Try to reduce variable expenses to build a savings buffer."
        })
    
    # Emergency fund check
    emergency_goal = next((g for g in goals if "emergency" in g.goal_name.lower()), None)
    if not emergency_goal:
        recommendations.append({
            "type": "emergency_fund",
            "priority": "high",
            "message": "No emergency fund goal found.",
            "action": f"Set up an emergency fund of at least ₹{total_expenses * 3:,.0f} (3 months expenses)."
        })
    
    # Investment check
    if net_income > 0 and total_emi / net_income < 0.4 and available > 0:
        if not any(g.goal_type.value == "long_term" for g in goals):
            recommendations.append({
                "type": "investment",
                "priority": "low",
                "message": "No long-term investment goal detected.",
                "action": "Consider SIPs or index funds for long-term wealth building."
            })
    
    return recommendations

"""
Complete API Testing Script
Run with: python test_api.py
"""

import requests
import json
from datetime import datetime, timedelta

API_URL = "http://localhost:8000"

def print_section(title):
    print("
" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_income_profile():
    print_section("Testing Income Profile")
    
    # Update income
    data = {
        "gross_monthly_salary": 100000,
        "income_type": "salaried",
        "state": "Maharashtra",
        "additional_incomes": [
            {"source_name": "Rental Income", "monthly_amount": 15000, "is_recurring": True}
        ]
    }
    
    response = requests.put(f"{API_URL}/api/profile/income", json=data)
    print(f"✓ Update Income: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  Net Income: ₹{result['income_breakdown']['net_monthly']:,.0f}")
        print(f"  Tax: ₹{result['income_breakdown']['tax_monthly']:,.0f}")
    
    # Get income profile
    response = requests.get(f"{API_URL}/api/profile/income")
    print(f"✓ Get Income: {response.status_code}")

def test_debts():
    print_section("Testing Debt Management")
    
    # Create home loan
    debt_data = {
        "debt_type": "home_loan",
        "debt_name": "HDFC Home Loan",
        "total_principal": 2000000,
        "outstanding_principal": 1800000,
        "interest_rate": 8.5,
        "tenure_months": 180,
        "remaining_months": 150,
        "monthly_emi": 19685,
        "start_date": "2022-01-01"
    }
    
    response = requests.post(f"{API_URL}/api/profile/debts", json=debt_data)
    print(f"✓ Create Debt: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  Debt Added: {result['debt']['debt_name']}")
        print(f"  DTI Ratio: {result['portfolio_summary']['dti_ratio']['ratio']}%")
        print(f"  Status: {result['portfolio_summary']['dti_ratio']['status']}")
    
    # Get all debts
    response = requests.get(f"{API_URL}/api/profile/debts")
    print(f"✓ Get Debts: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  Total Debts: {result['summary']['total_debts']}")
        print(f"  Total EMI: ₹{result['summary']['total_emi']:,.0f}")

def test_savings_goals():
    print_section("Testing Savings Goals")
    
    # Create emergency fund goal
    target_date = (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d")
    goal_data = {
        "goal_name": "Emergency Fund",
        "target_amount": 240000,
        "current_saved": 50000,
        "target_date": target_date,
        "priority": "high",
        "goal_type": "short_term"
    }
    
    response = requests.post(f"{API_URL}/api/profile/savings-goals", json=goal_data)
    print(f"✓ Create Goal: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  Goal: {result['goal']['goal_name']}")
        print(f"  Monthly Needed: ₹{result['goal']['monthly_contribution_needed']:,.0f}")
        print(f"  Feasible: {result['feasibility_check']['feasible']}")
        if not result['feasibility_check']['feasible']:
            print(f"  Shortfall: ₹{result['feasibility_check']['details']['shortfall']:,.0f}")
    
    # Get all goals
    response = requests.get(f"{API_URL}/api/profile/savings-goals")
    print(f"✓ Get Goals: {response.status_code}")

def test_expense_categories():
    print_section("Testing Expense Categories")
    
    # Create multiple expense categories
    categories = [
        {"category_name": "Rent", "monthly_amount": 15000, "is_essential": True, "is_fixed": True},
        {"category_name": "Food", "monthly_amount": 8000, "is_essential": True, "is_fixed": False},
        {"category_name": "Transport", "monthly_amount": 3000, "is_essential": True, "is_fixed": False},
        {"category_name": "Entertainment", "monthly_amount": 5000, "is_essential": False, "is_fixed": False}
    ]
    
    for cat in categories:
        response = requests.post(f"{API_URL}/api/profile/expense-categories", json=cat)
        print(f"✓ Create {cat['category_name']}: {response.status_code}")
    
    # Get all categories
    response = requests.get(f"{API_URL}/api/profile/expense-categories")
    print(f"✓ Get Expense Categories: {response.status_code}")
    if response.status_code == 200:
        result = response.json()
        print(f"  Total Expenses: ₹{result['summary']['total_expenses']:,.0f}")
        print(f"  Expense Ratio: {result['summary']['expense_ratio']:.1f}%")
        if result['analysis']['warnings']:
            print(f"  Warnings: {len(result['analysis']['warnings'])}")

def test_financial_overview():
    print_section("Testing Financial Overview")
    
    response = requests.get(f"{API_URL}/api/profile/financial-overview")
    print(f"✓ Get Overview: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        
        print("
📊 Financial Summary:")
        print(f"  Net Income: ₹{result['income']['net_monthly']:,.0f}")
        print(f"  Total Expenses: ₹{result['commitments']['total_expenses']:,.0f}")
        print(f"  Total EMI: ₹{result['commitments']['total_emi']:,.0f}")
        print(f"  Available: ₹{result['savings']['available_monthly']:,.0f}")
        
        print("
🏥 Health Indicators:")
        dti = result['health_indicators']['dti_ratio']
        print(f"  DTI Ratio: {dti['ratio']}% ({dti['status']})")
        
        emergency = result['health_indicators']['emergency_fund']
        print(f"  Emergency Fund: {emergency['status']}")
        print(f"    Current: ₹{emergency['current_savings']:,.0f}")
        print(f"    Recommended: ₹{emergency['recommended_required']:,.0f}")
        
        feas = result['health_indicators']['feasibility']
        print(f"  Feasibility: {'✅ Feasible' if feas['feasible'] else '❌ Not Feasible'}")
        
        if result['recommendations']:
            print("
💡 Recommendations:")
            for rec in result['recommendations']:
                print(f"  • [{rec['priority'].upper()}] {rec['message']}")

def run_all_tests():
    print("
🚀 Starting Complete API Test Suite
")
    
    try:
        # Test health endpoint first
        response = requests.get(f"{API_URL}/health")
        if response.status_code != 200:
            print("❌ API is not running! Please start the server first.")
            return
        
        print("✅ API is running
")
        
        # Run all tests
        test_income_profile()
        test_debts()
        test_savings_goals()
        test_expense_categories()
        test_financial_overview()
        
        print("
" + "="*60)
        print("  ✅ ALL TESTS COMPLETED")
        print("="*60 + "
")
        
    except Exception as e:
        print(f"
❌ Error during testing: {str(e)}
")

if __name__ == "__main__":
    run_all_tests()
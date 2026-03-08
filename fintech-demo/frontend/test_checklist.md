# Frontend Testing Checklist

## 1. Settings Page - Income Tab
- [ ] Navigate to Settings → Income & Tax
- [ ] Enter gross salary: 100000
- [ ] Select state: Maharashtra
- [ ] Click Save
- [ ] Verify tax calculation displays
- [ ] Verify net income shows correctly
- [ ] Check that values persist on reload

## 2. Settings Page - Debt Tab
- [ ] Navigate to Settings → Debt Portfolio
- [ ] Click "Add New Debt"
- [ ] Fill all fields:
  - Debt Type: Home Loan
  - Name: Test Loan
  - Principal: 2000000
  - Outstanding: 1800000
  - Interest: 8.5%
  - Tenure: 180 months
  - Remaining: 150 months
  - EMI: (click Calculate EMI)
  - Start Date: Today
- [ ] Verify preview updates as you type
- [ ] Click Save
- [ ] Verify debt appears in list
- [ ] Check DTI ratio displays
- [ ] Verify warning shows if DTI > 40%
- [ ] Test Delete debt button

## 3. Settings Page - Goals Tab
- [ ] Navigate to Settings → Savings Goals
- [ ] Click "Add New Goal"
- [ ] Fill fields:
  - Name: Emergency Fund
  - Target: 240000
  - Current: 50000
  - Date: 12 months from today
  - Priority: High
- [ ] Verify monthly contribution calculates
- [ ] Click Save
- [ ] If not feasible, verify warning modal shows
- [ ] Check suggestions display
- [ ] Verify goal appears in list

## 4. Settings Page - Expenses Tab
- [ ] Navigate to Settings → Monthly Expenses
- [ ] Click "Add Expense Category"
- [ ] Add Rent: 15000, Essential, Fixed
- [ ] Add Food: 8000, Essential, Variable
- [ ] Add Entertainment: 5000, Non-essential
- [ ] Verify total calculates
- [ ] Check expense ratio displays
- [ ] Verify warnings for high categories

## 5. Settings Page - Overview Tab
- [ ] Navigate to Settings → Overview
- [ ] Verify all sections load:
  - Income summary
  - Commitments
  - Savings
  - Health indicators
- [ ] Check DTI gauge shows correct status
- [ ] Verify emergency fund status
- [ ] Check feasibility shows green/red
- [ ] Verify recommendations display

## 6. Dashboard Integration
- [ ] Navigate to Dashboard (index.html)
- [ ] Verify Settings link in navigation
- [ ] Check metric cards show updated values
- [ ] Verify warning banners appear for:
  - High DTI
  - Missing emergency fund
  - Budget shortfall
- [ ] Click warning "Review" links
- [ ] Verify they navigate to correct Settings tab

## 7. Modals & Alerts
- [ ] Open debt modal - verify all fields
- [ ] Close modal with X button
- [ ] Close modal with Cancel button
- [ ] Submit form - verify success alert shows
- [ ] Submit invalid form - verify error alert
- [ ] Check auto-dismiss after 5 seconds
- [ ] Test DTI warning modal
- [ ] Test feasibility warning modal
- [ ] Test emergency fund warning modal

## 8. Responsive Design
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768x1024)
- [ ] Test on mobile (375x667)
- [ ] Verify tabs scroll on mobile
- [ ] Check modals fit on small screens
- [ ] Verify touch targets are 48px minimum

## 9. Cross-Browser
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

## 10. Data Persistence
- [ ] Add debt, reload page
- [ ] Verify debt still there
- [ ] Add goal, navigate away, come back
- [ ] Verify goal persists
- [ ] Update income, check dashboard
- [ ] Verify dashboard shows new values

## 11. Validation
- [ ] Try submitting empty debt form → Should block
- [ ] Try negative amounts → Should block
- [ ] Try future date for debt start → Should allow
- [ ] Try past date for goal target → Should block
- [ ] Try EMI > Income → Should warn

## 12. Calculations
- [ ] Add debt with 10% interest, 60 months
- [ ] Verify EMI calculation is correct
- [ ] Check total interest is accurate
- [ ] Verify progress percentage
- [ ] Add goal for 12 months
- [ ] Check monthly contribution = (target-current)/12
- [ ] Verify DTI = (total EMI / net income) * 100

## 13. Edge Cases
- [ ] Add 10 debts - verify list displays
- [ ] Add goal with 0 current saved
- [ ] Add expense with 0 amount → Should block
- [ ] Delete all debts - verify DTI shows 0%
- [ ] Set income to 0 → Should show warnings

## 14. Performance
- [ ] Load Settings page - should be < 2 seconds
- [ ] Submit form - should respond < 1 second
- [ ] Navigate between tabs - should be instant
- [ ] Open/close modals - should be smooth

## PASS/FAIL Summary:
- Total Tests: __/70
- Passed: __
- Failed: __
- Notes: ____________________
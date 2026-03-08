/**
 * Form Validation
 * Client-side validation before API calls
 */

const Validation = {
    
    /**
     * Validate income form
     */
    validateIncome(data) {
        const errors = [];
        
        if (!Utils.isPositive(data.gross_monthly_salary)) {
            errors.push('Gross salary must be a positive number');
        }
        
        if (!data.income_type) {
            errors.push('Please select income type');
        }
        
        if (!data.state) {
            errors.push('Please select your state');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Validate debt form
     */
    validateDebt(data) {
        const errors = [];
        
        if (!Utils.isPositive(data.total_principal)) {
            errors.push('Principal amount must be positive');
        }
        
        if (!Utils.isPositive(data.outstanding_principal)) {
            errors.push('Outstanding principal must be positive');
        }
        
        if (data.outstanding_principal > data.total_principal) {
            errors.push('Outstanding cannot exceed total principal');
        }
        
        if (!Utils.isValidNumber(data.interest_rate) || data.interest_rate < 0 || data.interest_rate > 30) {
            errors.push('Interest rate must be between 0% and 30%');
        }
        
        if (!Number.isInteger(data.tenure_months) || data.tenure_months <= 0 || data.tenure_months > 360) {
            errors.push('Tenure must be between 1 and 360 months');
        }
        
        if (!Number.isInteger(data.remaining_months) || data.remaining_months <= 0) {
            errors.push('Remaining months must be positive');
        }
        
        if (data.remaining_months > data.tenure_months) {
            errors.push('Remaining months cannot exceed total tenure');
        }
        
        if (!Utils.isPositive(data.monthly_emi)) {
            errors.push('EMI must be positive');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Validate savings goal form
     */
    validateSavingsGoal(data) {
        const errors = [];
        
        if (!data.goal_name || data.goal_name.trim().length === 0) {
            errors.push('Goal name is required');
        }
        
        if (!Utils.isPositive(data.target_amount)) {
            errors.push('Target amount must be positive');
        }
        
        if (!Utils.isValidNumber(data.current_saved) || data.current_saved < 0) {
            errors.push('Current saved must be zero or positive');
        }
        
        if (data.current_saved > data.target_amount) {
            errors.push('Current saved cannot exceed target');
        }
        
        // Validate date
        const targetDate = new Date(data.target_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (targetDate < today) {
            errors.push('Target date must be in the future');
        }
        
        if (!data.priority) {
            errors.push('Please select priority');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Validate expense category form
     */
    validateExpenseCategory(data) {
        const errors = [];
        
        if (!data.category_name || data.category_name.trim().length === 0) {
            errors.push('Category name is required');
        }
        
        if (!Utils.isPositive(data.monthly_amount)) {
            errors.push('Amount must be positive');
        }
        
        if (typeof data.is_essential !== 'boolean') {
            errors.push('Please specify if expense is essential');
        }
        
        if (typeof data.is_fixed !== 'boolean') {
            errors.push('Please specify if expense is fixed');
        }
        
        return {
            valid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Show validation errors
     */
    showErrors(errors) {
        const errorHtml = errors.map(error => `
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-2">
                <p class="text-sm text-red-700">${error}</p>
            </div>
        `).join('');
        
        Utils.showToast(errors[0], 'danger');
        
        return errorHtml;
    }
};

window.Validation = Validation;

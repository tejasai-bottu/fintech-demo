/**
 * API Communication Layer
 * ALL backend communication happens here
 * NO business logic or calculations
 */

class API {
    constructor(baseURL) {
        this.baseURL = baseURL || CONFIG.API.BASE_URL;
        this.timeout = CONFIG.API.TIMEOUT;
    }
    
    /**
     * Generic fetch wrapper with error handling
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };
        
        try {
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }
    
    // ========== INCOME ENDPOINTS ==========
    
    async getIncomeProfile() {
        return this.request('/api/profile/income');
    }
    
    async updateIncomeProfile(data) {
        return this.request('/api/profile/income', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    // ========== DEBT ENDPOINTS ==========
    
    async getDebts() {
        return this.request('/api/profile/debts');
    }
    
    async createDebt(data) {
        return this.request('/api/profile/debts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async updateDebt(debtId, data) {
        return this.request(`/api/profile/debts/${debtId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async deleteDebt(debtId) {
        return this.request(`/api/profile/debts/${debtId}`, {
            method: 'DELETE'
        });
    }
    
    async calculateEMI(data) {
        return this.request('/api/debt/calculate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    // ========== SAVINGS GOALS ENDPOINTS ==========
    
    async getSavingsGoals() {
        return this.request('/api/profile/savings-goals');
    }
    
    async createSavingsGoal(data) {
        return this.request('/api/profile/savings-goals', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async updateSavingsGoal(goalId, data) {
        return this.request(`/api/profile/savings-goals/${goalId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async deleteSavingsGoal(goalId) {
        return this.request(`/api/profile/savings-goals/${goalId}`, {
            method: 'DELETE'
        });
    }
    
    // ========== EXPENSE ENDPOINTS ==========
    
    async getExpenseCategories() {
        return this.request('/api/profile/expense-categories');
    }
    
    async createExpenseCategory(data) {
        return this.request('/api/profile/expense-categories', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async updateExpenseCategory(categoryId, data) {
        return this.request(`/api/profile/expense-categories/${categoryId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    
    async deleteExpenseCategory(categoryId) {
        return this.request(`/api/profile/expense-categories/${categoryId}`, {
            method: 'DELETE'
        });
    }
    
    async analyzeExpenses() {
        return this.request('/api/expense/analyze');
    }
    
    // ========== INVESTMENT ENDPOINTS ==========
    
    async predictInvestment(data) {
        return this.request('/api/investment/predict', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async createInvestment(data) {
        return this.request('/api/investment/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    
    async getRecommendations() {
        return this.request('/api/investment/recommendations');
    }
    
    // ========== DASHBOARD ENDPOINTS ==========
    
    async getDashboard() {
        return this.request('/api/dashboard/');
    }
    
    async getFinancialOverview() {
        return this.request('/api/profile/financial-overview');
    }
}

// Initialize global API instance
window.api = new API();

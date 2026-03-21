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
     * Generic fetch wrapper with error handling and JWT support
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Get stored token
        const token = localStorage.getItem('Fintrix_token');
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            ...options
        };
        
        // Merge headers if options has them
        if (options.headers) {
            defaultOptions.headers = { ...defaultOptions.headers, ...options.headers };
        }
        
        try {
            const response = await fetch(url, defaultOptions);
            
            // Redirect to login if unauthorized
            if (response.status === 401) {
                localStorage.removeItem('Fintrix_token');
                localStorage.removeItem('Fintrix_user');
                // Only redirect if not already on login/register pages
                if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
                    window.location.href = 'login.html';
                }
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }
    
    // ========== AUTH ENDPOINTS ==========

    async register(data) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async login(email, password) {
        const result = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        if (result && result.access_token) {
            localStorage.setItem('Fintrix_token', result.access_token);
            localStorage.setItem('Fintrix_user', JSON.stringify(result.user));
        }
        return result;
    }

    logout() {
        localStorage.removeItem('Fintrix_token');
        localStorage.removeItem('Fintrix_user');
        window.location.href = 'login.html';
    }

    getCurrentUser() {
        const stored = localStorage.getItem('Fintrix_user');
        return stored ? JSON.parse(stored) : null;
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

    // ========== BILLS ENDPOINTS ==========

    async getBills() {
        return this.request('/api/bills/list');
    }

    async createBill(data) {
        return this.request('/api/bills/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async payBill(billId, data) {
        return this.request(`/api/bills/${billId}/pay`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async getBillHistory(billId) {
        return this.request(`/api/bills/${billId}/history`);
    }

    async deleteBill(billId) {
        return this.request(`/api/bills/${billId}`, {
            method: 'DELETE'
        });
    }

    // ========== CALENDAR ENDPOINTS ==========

    async getCalendarEvents() {
        return this.request('/api/calendar/events');
    }

    // ========== FORECASTING ENDPOINTS ==========

    async getForecast(scenario = 'normal') {
        return this.request(`/api/profile/forecast?scenario=${scenario}`);
    }

    async getNetWorthHistory(days = 30) {
        return this.request(`/api/profile/net-worth-history?days=${days}`);
    }

    async simulateScenario(data) {
        return this.request('/api/profile/scenario/simulate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // ========== TRANSACTION ENDPOINTS ==========

    async createTransaction(data) {
        return this.request('/api/transactions/create', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async listTransactions(month = null, year = null, categoryId = null) {
        let url = '/api/transactions/list';
        const params = [];
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        if (categoryId) params.push(`category_id=${categoryId}`);
        if (params.length) url += '?' + params.join('&');
        return this.request(url);
    }

    async getMonthlySummary(month = null, year = null) {
        let url = '/api/transactions/monthly-summary';
        const params = [];
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        if (params.length) url += '?' + params.join('&');
        return this.request(url);
    }

    // ========== NOTIFICATION ENDPOINTS ==========

    async getNotifications() {
        return this.request('/api/notifications/');
    }

    async markNotificationRead(id) {
        return this.request(`/api/notifications/read/${id}`, { method: 'POST' });
    }

    async markAllNotificationsRead() {
        return this.request('/api/notifications/read-all', { method: 'POST' });
    }

    // ========== BILL SCANNER ENDPOINTS ==========

    async uploadReceipt(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const url = `${CONFIG.API.BILL_SCANNER_URL}/api/upload`;
        const response = await fetch(url, {
            method: 'POST',
            body: formData
            // Note: Don't set Content-Type header for FormData, browser will do it with boundary
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async getScannerStats() {
        const url = `${CONFIG.API.BILL_SCANNER_URL}/api/stats/dashboard`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch scanner stats');
        return await response.json();
    }
}

// Initialize global API instance
window.api = new API();

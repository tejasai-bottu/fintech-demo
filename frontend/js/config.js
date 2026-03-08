/**
 * Configuration & Constants
 * All environment and static configuration in ONE place
 */

const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'http://localhost:8000',
        TIMEOUT: 30000, // 30 seconds
        RETRY_ATTEMPTS: 3
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_ANIMATIONS: true,
        ENABLE_TOOLTIPS: true,
        AUTO_SAVE: true,
        DEBUG_MODE: false
    },
    
    // UI Constants
    UI: {
        ANIMATION_DURATION: 1000,
        DEBOUNCE_DELAY: 500,
        TOAST_DURATION: 5000,
        CHART_HEIGHT: 300
    },
    
    // Financial Constants
    FINANCE: {
        MAX_LOAN_TENURE: 360, // months
        MAX_INTEREST_RATE: 30, // percent
        EMERGENCY_FUND_MONTHS: 6,
        RECOMMENDED_SAVINGS_RATE: 20, // percent of income
        HEALTHY_DTI_THRESHOLD: 30,
        MAX_DTI_THRESHOLD: 50
    },
    
    // Category Configuration
    CATEGORIES: {
        EXPENSE: {
            rent: { icon: '🏠', color: '#3B82F6', label: 'Rent' },
            food: { icon: '🍔', color: '#10B981', label: 'Food' },
            transport: { icon: '🚗', color: '#F59E0B', label: 'Transport' },
            entertainment: { icon: '🎬', color: '#8B5CF6', label: 'Entertainment' },
            shopping: { icon: '🛍️', color: '#EC4899', label: 'Shopping' },
            other: { icon: '💼', color: '#6B7280', label: 'Other' }
        },
        DEBT: {
            home_loan: { icon: '🏠', label: 'Home Loan' },
            car_loan: { icon: '🚗', label: 'Car Loan' },
            personal_loan: { icon: '💰', label: 'Personal Loan' },
            credit_card: { icon: '💳', label: 'Credit Card' },
            education: { icon: '🎓', label: 'Education Loan' }
        }
    }
};

// Make available globally
window.CONFIG = CONFIG;

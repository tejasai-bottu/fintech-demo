/**
 * Display Utilities
 * Pure functions for formatting and display
 * NO API calls, NO calculations
 */

const Utils = {
    
    // ========== FORMATTING ==========
    
    /**
     * Format number as Indian currency
     */
    formatCurrency(amount, showSymbol = true) {
        const formatted = Math.round(amount).toLocaleString('en-IN');
        return showSymbol ? `₹${formatted}` : formatted;
    },
    
    /**
     * Format as percentage
     */
    formatPercent(value, decimals = 1) {
        return `${value.toFixed(decimals)}%`;
    },
    
    /**
     * Format large numbers (1L, 1Cr)
     */
    formatLargeNumber(amount) {
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(2)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(2)}L`;
        } else if (amount >= 1000) {
            return `₹${(amount / 1000).toFixed(1)}K`;
        }
        return this.formatCurrency(amount);
    },
    
    /**
     * Format date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },
    
    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
        return `${Math.floor(minutes / 1440)}d ago`;
    },
    
    // ========== DOM MANIPULATION ==========
    
    /**
     * Show element with animation
     */
    show(elementId, displayType = 'block') {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = displayType;
            element.classList.add('slide-in');
        }
    },
    
    /**
     * Hide element
     */
    hide(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.style.display = 'none';
        }
    },
    
    /**
     * Toggle element visibility
     */
    toggle(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            if (element.style.display === 'none') {
                this.show(elementId);
            } else {
                this.hide(elementId);
            }
        }
    },
    
    /**
     * Set text content safely
     */
    setText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    },
    
    /**
     * Set HTML content safely
     */
    setHTML(elementId, html) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = html;
        }
    },
    
    // ========== ANIMATIONS ==========
    
    /**
     * Animate number counting up
     */
    animateNumber(elementId, targetValue, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        const steps = 30;
        const increment = targetValue / steps;
        const stepDuration = duration / steps;
        let current = 0;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetValue) {
                current = targetValue;
                clearInterval(timer);
            }
            element.textContent = Math.round(current).toLocaleString('en-IN');
        }, stepDuration);
    },
    
    /**
     * Animate progress bar
     */
    animateProgress(elementId, targetPercent, duration = 1000) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        element.style.transition = `width ${duration}ms ease-out`;
        element.style.width = `${targetPercent}%`;
    },
    
    // ========== UI HELPERS ==========
    
    /**
     * Get severity color class
     */
    getSeverityColor(severity) {
        const colors = {
            'success': 'text-green-600',
            'warning': 'text-yellow-600',
            'danger': 'text-red-600',
            'critical': 'text-red-800',
            'info': 'text-blue-600'
        };
        return colors[severity] || 'text-gray-600';
    },
    
    /**
     * Get severity background class
     */
    getSeverityBg(severity) {
        const backgrounds = {
            'success': 'bg-green-50',
            'warning': 'bg-yellow-50',
            'danger': 'bg-red-50',
            'critical': 'bg-red-100',
            'info': 'bg-blue-50'
        };
        return backgrounds[severity] || 'bg-gray-50';
    },
    
    /**
     * Get category icon
     */
    getCategoryIcon(category) {
        const categoryData = CONFIG.CATEGORIES.EXPENSE[category];
        return categoryData ? categoryData.icon : '💼';
    },
    
    /**
     * Get category color
     */
    getCategoryColor(category) {
        const categoryData = CONFIG.CATEGORIES.EXPENSE[category];
        return categoryData ? categoryData.color : '#6B7280';
    },
    
    // ========== NOTIFICATIONS ==========
    
    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg ${this.getSeverityBg(type)} ${this.getSeverityColor(type)} z-50 slide-in`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, CONFIG.UI.TOAST_DURATION);
    },
    
    /**
     * Show loading spinner
     */
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            `;
        }
    },
    
    // ========== VALIDATION HELPERS ==========
    
    /**
     * Check if value is valid number
     */
    isValidNumber(value) {
        return !isNaN(value) && value !== null && value !== '';
    },
    
    /**
     * Check if value is positive
     */
    isPositive(value) {
        return this.isValidNumber(value) && parseFloat(value) > 0;
    },
    
    /**
     * Debounce function
     */
    debounce(func, delay = CONFIG.UI.DEBOUNCE_DELAY) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// Make available globally
window.Utils = Utils;

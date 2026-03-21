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
        const colors = {
            success: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', color: '#34d399' },
            danger:  { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)', color: '#f87171' },
            warning: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)', color: '#fbbf24' },
            info:    { bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', color: '#818cf8' }
        };
        const c = colors[type] || colors.info;
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed; top:20px; right:20px; z-index:9999;
            padding:12px 20px; border-radius:12px; font-size:13px; font-weight:500;
            background:${c.bg}; border:1px solid ${c.border}; color:${c.color};
            backdrop-filter:blur(16px); font-family:inherit;
            box-shadow:0 8px 24px rgba(0,0,0,0.4);
            animation:slideInUp 0.25s ease-out;
            max-width:320px;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity='0'; toast.style.transition='opacity 0.3s'; setTimeout(()=>toast.remove(), 300); }, CONFIG.UI.TOAST_DURATION);
    },
    
    /**
     * Show skeleton loading UI
     */
    showLoading(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;

        el.innerHTML = `
            <div class="skeleton-wrapper">
                ${Array(3).fill(`
                    <div class="skeleton-card">
                        <div class="skeleton-avatar"></div>
                        <div class="skeleton-lines">
                            <div class="skeleton-line short"></div>
                            <div class="skeleton-line long"></div>
                        </div>
                        <div class="skeleton-dot"></div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    /**
     * Hide global loading overlay with fade
     */
    hideGlobalLoading() {
        const el = document.getElementById('loading-overlay');
        if (!el) return;

        el.classList.add('hide');

        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, 400);
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
     * Disable a button for N milliseconds after click to prevent double-submit.
     * Usage: onClick="Utils.preventDouble(this, () => yourFunction())"
     */
    preventDouble(button, callback, delayMs = 3000) {
        if (button.disabled) return;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Processing...';

        try {
            callback();
        } finally {
            setTimeout(() => {
                button.disabled = false;
                button.textContent = originalText;
            }, delayMs);
        }
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
window.hideGlobalLoading = () => Utils.hideGlobalLoading();

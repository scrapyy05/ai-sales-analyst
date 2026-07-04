/**
 * ==========================================================================
 * AI Sales Analyst — Utility Functions (js/utils.js)
 * ==========================================================================
 */

class Utils {
    /**
     * Format number as USD currency ($1,234.56)
     */
    static formatCurrency(amount) {
        if (amount === undefined || amount === null) return "$0.00";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(amount));
    }

    /**
     * Format number with commas (1,234)
     */
    static formatNumber(num) {
        if (num === undefined || num === null) return "0";
        return new Intl.NumberFormat('en-US').format(Number(num));
    }

    /**
     * Format date string to clean readable date (Jan 15, 2026)
     */
    static formatDate(dateString) {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    /**
     * Format file size in bytes to readable KB/MB
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Debounce function for live search input
     */
    static debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Animate number counting upward (for statistic cards)
     */
    static animateCountUp(element, targetValue, isCurrency = false, duration = 1200) {
        if (!element) return;
        
        const startValue = 0;
        const startTime = performance.now();
        const target = Number(targetValue) || 0;

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out quart cubic bezier approximation
            const easeOut = 1 - Math.pow(1 - progress, 4);
            const currentVal = startValue + (target - startValue) * easeOut;

            if (isCurrency) {
                element.textContent = Utils.formatCurrency(currentVal);
            } else {
                element.textContent = Math.round(currentVal).toLocaleString();
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                // Ensure exact final value
                if (isCurrency) {
                    element.textContent = Utils.formatCurrency(target);
                } else {
                    element.textContent = Utils.formatNumber(target);
                }
            }
        }

        requestAnimationFrame(update);
    }
}

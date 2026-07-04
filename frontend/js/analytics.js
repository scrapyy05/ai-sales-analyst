/**
 * ==========================================================================
 * AI Sales Analyst — Analytics Page Controller (js/analytics.js)
 * ==========================================================================
 */

class AnalyticsController {
    static async init() {
        if (!Auth.guard()) return;
        await AnalyticsController.loadKPIs();
        await AnalyticsController.loadAllCharts();
        await AnalyticsController.loadCategoryTable();
    }

    static async loadKPIs() {
        try {
            const summary = await API.get('/analytics/summary');
            if (summary) {
                Utils.animateCountUp(document.getElementById('analytics-rev'), summary.total_revenue || 0, true);
                Utils.animateCountUp(document.getElementById('analytics-sales'), summary.total_sales || 0, false);
                Utils.animateCountUp(document.getElementById('analytics-cust'), summary.total_customers || 0, false);
                Utils.animateCountUp(document.getElementById('analytics-prod'), summary.total_products || 0, false);
            }
        } catch (error) {
            console.error("Analytics KPI error:", error);
        }
    }

    static async loadAllCharts() {
        try {
            // 1. Top Products Bar Chart
            const topProducts = await API.get('/analytics/top-products?limit=6');
            if (topProducts && topProducts.length > 0) {
                const labels = topProducts.map(p => p.product);
                const data = topProducts.map(p => p.revenue);
                ChartManager.createBarChart('analytics-bar-chart', labels, data, 'Revenue ($)');
            }

            // 2. Revenue by Category Pie Chart
            const categories = await API.get('/analytics/revenue-by-category');
            if (categories && categories.length > 0) {
                const labels = categories.map(c => c.category);
                const data = categories.map(c => c.revenue);
                ChartManager.createPieChart('analytics-pie-chart', labels, data);
            }

            // 3. Top Customers Line Chart (representing Revenue Trend across top accounts)
            const topCustomers = await API.get('/analytics/top-customers?limit=6');
            if (topCustomers && topCustomers.length > 0) {
                const labels = topCustomers.map(c => c.customer);
                const data = topCustomers.map(c => c.revenue);
                ChartManager.createLineChart('analytics-line-chart', labels, data, 'Customer Volume ($)');
            }
        } catch (error) {
            console.error("Analytics Charts error:", error);
        }
    }

    static async loadCategoryTable() {
        const tbody = document.getElementById('analytics-category-tbody');
        if (!tbody) return;

        UI.renderTableSkeleton(tbody, 3, 4);

        try {
            const categories = await API.get('/analytics/revenue-by-category');
            if (!categories || categories.length === 0) {
                tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 20px;">No category revenue data available.</td></tr>`;
                return;
            }

            const totalRev = categories.reduce((sum, c) => sum + Number(c.revenue || 0), 0) || 1;

            tbody.innerHTML = categories.map(c => {
                const pct = Math.round((Number(c.revenue) / totalRev) * 100);
                return `
                    <tr>
                        <td style="font-weight: 600;">${c.category}</td>
                        <td style="color: var(--color-primary); font-weight: 600;">${Utils.formatCurrency(c.revenue)}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <div style="flex: 1; height: 8px; background: var(--bg-surface); border-radius: 4px; overflow: hidden; width: 100px;">
                                    <div style="height: 100%; width: ${pct}%; background: var(--color-primary); border-radius: 4px;"></div>
                                </div>
                                <span class="text-muted" style="font-size: 12px;">${pct}%</span>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--color-danger);">Failed to load categories.</td></tr>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('analytics.html')) {
        AnalyticsController.init();
    }
});

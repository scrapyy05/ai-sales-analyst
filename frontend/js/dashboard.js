/**
 * ==========================================================================
 * AI Sales Analyst — Dashboard Controller (js/dashboard.js)
 * ==========================================================================
 */

class DashboardController {
    static async init() {
        if (!Auth.guard()) return;
        await DashboardController.loadKPIs();
        await DashboardController.loadCharts();
        await DashboardController.loadRecentActivity();
    }

    static async loadKPIs() {
        try {
            const summary = await API.get('/analytics/summary');
            if (summary) {
                Utils.animateCountUp(document.getElementById('stat-revenue'), summary.total_revenue || 0, true);
                Utils.animateCountUp(document.getElementById('stat-sales'), summary.total_sales || 0, false);
                Utils.animateCountUp(document.getElementById('stat-customers'), summary.total_customers || 0, false);
                Utils.animateCountUp(document.getElementById('stat-products'), summary.total_products || 0, false);
            }
        } catch (error) {
            console.error("Failed to load dashboard summary:", error);
        }
    }

    static async loadCharts() {
        try {
            // Top Products Bar Chart
            const topProducts = await API.get('/analytics/top-products?limit=5');
            if (topProducts && topProducts.length > 0) {
                const labels = topProducts.map(p => p.product);
                const data = topProducts.map(p => p.revenue);
                ChartManager.createBarChart('dashboard-bar-chart', labels, data, 'Revenue ($)');
            }

            // Category Revenue Doughnut Chart
            const categories = await API.get('/analytics/revenue-by-category');
            if (categories && categories.length > 0) {
                const labels = categories.map(c => c.category);
                const data = categories.map(c => c.revenue);
                ChartManager.createPieChart('dashboard-pie-chart', labels, data);
            }
        } catch (error) {
            console.error("Failed to load dashboard charts:", error);
        }
    }

    static async loadRecentActivity() {
        const tbody = document.getElementById('recent-activity-tbody');
        if (!tbody) return;

        UI.renderTableSkeleton(tbody, 4, 5);

        try {
            // Fetch recent sales to populate activity
            const sales = await API.get('/sales/');
            if (!sales || sales.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 24px;">No recent sales activity found.</td></tr>`;
                return;
            }

            // Show top 5 recent sales
            const recentSales = sales.slice(0, 5);
            tbody.innerHTML = recentSales.map(sale => `
                <tr>
                    <td><span class="badge badge-success">Sale Completed</span></td>
                    <td>Sale ID #${sale.id} (${sale.quantity} units)</td>
                    <td style="font-weight: 600; color: var(--color-primary);">${Utils.formatCurrency(sale.total_amount)}</td>
                    <td class="text-muted">${Utils.formatDate(sale.sale_date)}</td>
                </tr>
            `).join('');
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--color-danger);">Failed to load activity.</td></tr>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html') || window.location.pathname.endsWith('/')) {
        DashboardController.init();
    }
});

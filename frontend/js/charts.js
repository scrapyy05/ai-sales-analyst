/**
 * ==========================================================================
 * AI Sales Analyst — Chart.js Wrapper & Manager (js/charts.js)
 * ==========================================================================
 */

class ChartManager {
    static charts = {};

    /**
     * Get chart styling colors based on current theme
     */
    static getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        return {
            textColor: isDark ? '#94A3B8' : '#64748B',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
            tooltipBg: isDark ? '#1E293B' : '#FFFFFF',
            tooltipText: isDark ? '#F8FAFC' : '#0F172A',
            tooltipBorder: isDark ? '#334155' : '#E2E8F0'
        };
    }

    /**
     * Update all active charts when theme toggles
     */
    static updateTheme(theme) {
        const colors = ChartManager.getThemeColors();
        Object.values(ChartManager.charts).forEach(chart => {
            if (chart.options.scales && chart.options.scales.x && chart.options.scales.y) {
                chart.options.scales.x.ticks.color = colors.textColor;
                chart.options.scales.x.grid.color = colors.gridColor;
                chart.options.scales.y.ticks.color = colors.textColor;
                chart.options.scales.y.grid.color = colors.gridColor;
            }
            if (chart.options.plugins && chart.options.plugins.legend) {
                chart.options.plugins.legend.labels.color = colors.textColor;
            }
            if (chart.options.plugins && chart.options.plugins.tooltip) {
                chart.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
                chart.options.plugins.tooltip.titleColor = colors.tooltipText;
                chart.options.plugins.tooltip.bodyColor = colors.tooltipText;
                chart.options.plugins.tooltip.borderColor = colors.tooltipBorder;
            }
            chart.update();
        });
    }

    /**
     * Create a Line Chart (e.g., Monthly Revenue / Trend)
     */
    static createLineChart(canvasId, labels, dataPoints, labelName = "Revenue ($)") {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return null;

        if (ChartManager.charts[canvasId]) {
            ChartManager.charts[canvasId].destroy();
        }

        const colors = ChartManager.getThemeColors();
        const ctx = canvas.getContext('2d');

        // Elegant gradient fill
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(37, 99, 235, 0.25)');
        gradient.addColorStop(1, 'rgba(37, 99, 235, 0.0)');

        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: labelName,
                    data: dataPoints,
                    borderColor: '#2563EB',
                    backgroundColor: gradient,
                    borderWidth: 2.5,
                    pointBackgroundColor: '#2563EB',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.35
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipText,
                        bodyColor: colors.tooltipText,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => ` ${labelName}: $${Number(ctx.raw).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: colors.gridColor, drawBorder: false },
                        ticks: { color: colors.textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
                    },
                    y: {
                        grid: { color: colors.gridColor, drawBorder: false },
                        ticks: {
                            color: colors.textColor,
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                            callback: (value) => `$${Number(value).toLocaleString()}`
                        }
                    }
                }
            }
        });

        ChartManager.charts[canvasId] = chart;
        return chart;
    }

    /**
     * Create a Bar Chart (e.g., Top Products Revenue)
     */
    static createBarChart(canvasId, labels, dataPoints, labelName = "Revenue ($)") {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return null;

        if (ChartManager.charts[canvasId]) {
            ChartManager.charts[canvasId].destroy();
        }

        const colors = ChartManager.getThemeColors();
        const ctx = canvas.getContext('2d');

        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: labelName,
                    data: dataPoints,
                    backgroundColor: ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipText,
                        bodyColor: colors.tooltipText,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => ` ${labelName}: $${Number(ctx.raw).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.textColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 } }
                    },
                    y: {
                        grid: { color: colors.gridColor, drawBorder: false },
                        ticks: {
                            color: colors.textColor,
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                            callback: (value) => `$${Number(value).toLocaleString()}`
                        }
                    }
                }
            }
        });

        ChartManager.charts[canvasId] = chart;
        return chart;
    }

    /**
     * Create a Pie/Doughnut Chart (e.g., Category Revenue Distribution)
     */
    static createPieChart(canvasId, labels, dataPoints) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !window.Chart) return null;

        if (ChartManager.charts[canvasId]) {
            ChartManager.charts[canvasId].destroy();
        }

        const colors = ChartManager.getThemeColors();
        const ctx = canvas.getContext('2d');

        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataPoints,
                    backgroundColor: [
                        '#2563EB', '#22C55E', '#F59E0B', '#A855F7', '#EC4899', '#06B6D4'
                    ],
                    borderWidth: 2,
                    borderColor: colors.tooltipBg
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: colors.textColor,
                            font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
                            padding: 16,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        backgroundColor: colors.tooltipBg,
                        titleColor: colors.tooltipText,
                        bodyColor: colors.tooltipText,
                        borderColor: colors.tooltipBorder,
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (ctx) => ` ${ctx.label}: $${Number(ctx.raw).toLocaleString(undefined, {minimumFractionDigits: 2})}`
                        }
                    }
                }
            }
        });

        ChartManager.charts[canvasId] = chart;
        return chart;
    }
}

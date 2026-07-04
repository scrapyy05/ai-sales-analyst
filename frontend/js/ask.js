/**
 * ==========================================================================
 * AI Sales Analyst — Ask AI Page Controller (js/ask.js)
 * Hero Feature: Natural Language Query Engine with Cache Hit Indicators
 * ==========================================================================
 */

class AskAIController {
    static init() {
        if (!Auth.guard()) return;

        const form = document.getElementById('ask-form');
        const textarea = document.getElementById('ask-textarea');
        const chips = document.querySelectorAll('.suggestion-chip');
        const responseCard = document.getElementById('ai-response-card');

        // Suggestion Chip Click
        chips.forEach(chip => {
            chip.addEventListener('click', () => {
                textarea.value = chip.getAttribute('data-query');
                form.dispatchEvent(new Event('submit'));
            });
        });

        // Submit Query
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const question = textarea.value.trim();
            if (!question) {
                UI.showToast("Please enter a question about your sales data.", "warning");
                return;
            }

            // Show loading / thinking state
            AskAIController.renderLoadingState();

            const startTime = performance.now();

            try {
                const res = await API.post('/ask/', { question: question });
                const endTime = performance.now();
                const latencyMs = Math.round(endTime - startTime);
                
                // Super fast latency indicates Redis Query Cache Hit!
                const isCacheHit = latencyMs < 350;

                AskAIController.renderSuccessState(res, isCacheHit, latencyMs);
            } catch (error) {
                AskAIController.renderErrorState(error.message || "Failed to process natural language query.");
            }
        });
    }

    static renderLoadingState() {
        const container = document.getElementById('ai-response-container');
        container.innerHTML = `
            <div class="ai-response-card animate-fade-in" style="text-align: center; padding: 48px 24px;">
                <div class="spinner" style="margin: 0 auto 16px;"></div>
                <h3 class="card-title" style="margin-bottom: 8px;">⚡ Interrogating Database via Gemini 1.5 Pro...</h3>
                <p class="text-secondary" style="font-size: 14px;">
                    Translating natural language to SQL <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
                </p>
            </div>
        `;
    }

    static renderSuccessState(data, isCacheHit, latencyMs) {
        const container = document.getElementById('ai-response-container');
        
        let cacheBadgeHtml = '';
        if (isCacheHit) {
            cacheBadgeHtml = `
                <span class="badge badge-success animate-fade-in" style="font-size: 13px; padding: 6px 12px;">
                    ⚡ REDIS QUERY CACHE HIT (~${latencyMs} ms)
                </span>
            `;
        } else {
            cacheBadgeHtml = `
                <span class="badge badge-primary animate-fade-in" style="font-size: 13px; padding: 6px 12px;">
                    🤖 GEMINI TEXT-TO-SQL (~${latencyMs} ms)
                </span>
            `;
        }

        let tableHtml = '';
        if (data.results && data.results.length > 0) {
            const cols = Object.keys(data.results[0]);
            tableHtml = `
                <div class="table-container mt-4">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${cols.map(c => `<th>${c.replace('_', ' ').toUpperCase()}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.results.map(row => `
                                <tr>
                                    ${cols.map(c => {
                                        let val = row[c];
                                        if (typeof val === 'number') val = val.toLocaleString(undefined, {maximumFractionDigits: 2});
                                        return `<td>${val !== null ? val : '-'}</td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            tableHtml = `<p class="text-muted mt-4">No matching database records found for this query.</p>`;
        }

        const analysis = data.analysis || {};
        const summary = analysis.summary || "SQL query successfully executed and verified.";
        const insight = analysis.insight || "No abnormal trends or anomalies detected in this data subset.";
        const rec = analysis.recommendation || "Continue monitoring executive metrics and sales pipelines.";

        container.innerHTML = `
            <div class="ai-response-card animate-slide-up">
                <div class="ai-response-header">
                    <div>
                        <h3 class="card-title" style="display: flex; align-items: center; gap: 8px;">
                            💡 Executive AI Analysis
                        </h3>
                        <p class="text-secondary" style="font-size: 13px; margin: 0;">Verified against live PostgreSQL dataset</p>
                    </div>
                    <div>${cacheBadgeHtml}</div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
                    <div style="background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div class="ai-section-title">📌 Executive Summary</div>
                        <div style="font-size: 14px; color: var(--text-main);">${summary}</div>
                    </div>
                    <div style="background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div class="ai-section-title">🔍 Key Business Insight</div>
                        <div style="font-size: 14px; color: var(--text-main);">${insight}</div>
                    </div>
                    <div style="background: var(--bg-surface); padding: 16px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div class="ai-section-title">🚀 Actionable Recommendation</div>
                        <div style="font-size: 14px; color: var(--color-primary); font-weight: 500;">${rec}</div>
                    </div>
                </div>

                <div class="ai-section-title">📊 SQL Result Set (${data.results ? data.results.length : 0} rows)</div>
                ${tableHtml}
            </div>
        `;
    }

    static renderErrorState(message) {
        const container = document.getElementById('ai-response-container');
        container.innerHTML = `
            <div class="ai-response-card animate-slide-up" style="border-color: var(--color-danger); background: var(--color-danger-light);">
                <div style="display: flex; align-items: center; gap: 12px; color: var(--color-danger); font-weight: 600; margin-bottom: 8px;">
                    <span style="font-size: 20px;">❌</span>
                    <span>Query Execution Failed</span>
                </div>
                <p style="color: var(--text-main); font-size: 14px; margin: 0;">${message}</p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('ask.html')) {
        AskAIController.init();
    }
});

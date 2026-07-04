/**
 * ==========================================================================
 * AI Sales Analyst — UI Component Manager (js/ui.js)
 * Toasts, Modals, Theme Switcher, Responsive Sidebar, and Confirmation Dialogs
 * ==========================================================================
 */

class UI {
    /**
     * Initialize Global UI elements (Theme, Sidebar, Navigation highlighting)
     */
    static init() {
        UI.initTheme();
        UI.initSidebar();
        UI.highlightCurrentNav();
        UI.initClearDB();
    }

    /**
     * Clear Database Handler
     */
    static initClearDB() {
        const clearBtn = document.getElementById('clear-db-btn');
        if (!clearBtn) return;
        clearBtn.addEventListener('click', () => {
            UI.showConfirmDialog({
                title: 'Clear All Database Records',
                message: 'Are you sure you want to delete all sales transactions, products, and customers from the database? This cannot be undone.',
                confirmText: 'Yes, Clear DB',
                confirmVariant: 'danger',
                onConfirm: async () => {
                    const originalText = clearBtn.innerHTML;
                    clearBtn.disabled = true;
                    clearBtn.textContent = '⚡ Clearing...';
                    try {
                        const res = await API.delete('/upload/clear');
                        clearBtn.disabled = false;
                        clearBtn.innerHTML = originalText;
                        if (res && !res.error) {
                            UI.showToast('✅ All database records cleared successfully!', 'success');
                            setTimeout(() => window.location.reload(), 1000);
                        } else {
                            UI.showToast('❌ Failed to clear database.', 'danger');
                        }
                    } catch (err) {
                        clearBtn.disabled = false;
                        clearBtn.innerHTML = originalText;
                        UI.showToast('❌ Network error while clearing database.', 'danger');
                    }
                }
            });
        });
    }


    /**
     * Theme Toggle (Light / Dark Mode with smooth transition)
     */
    static initTheme() {
        const savedTheme = localStorage.getItem('app_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);

        const themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            UI.updateThemeIcon(savedTheme);
            themeToggleBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('app_theme', newTheme);
                UI.updateThemeIcon(newTheme);

                // Re-render Chart.js charts if they exist so font colors match theme
                if (window.ChartManager && typeof window.ChartManager.updateTheme === 'function') {
                    window.ChartManager.updateTheme(newTheme);
                }
            });
        }
    }

    static updateThemeIcon(theme) {
        const themeToggleBtn = document.getElementById('theme-toggle');
        if (!themeToggleBtn) return;
        themeToggleBtn.innerHTML = theme === 'dark' ? '☀️' : '🌙';
        themeToggleBtn.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
    }

    /**
     * Responsive Sidebar Collapse / Expand on Mobile
     */
    static initSidebar() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const sidebar = document.getElementById('sidebar');
        
        if (mobileMenuBtn && sidebar) {
            mobileMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });

            // Close sidebar when clicking outside on mobile
            document.addEventListener('click', (e) => {
                if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
                    if (!sidebar.contains(e.target) && e.target !== mobileMenuBtn) {
                        sidebar.classList.remove('open');
                    }
                }
            });
        }
    }

    /**
     * Highlight Current Active Page in Sidebar
     */
    static highlightCurrentNav() {
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href && (href === currentPath || (currentPath === '' && href === 'dashboard.html'))) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Toast Notifications (Success, Warning, Danger)
     */
    static showToast(message, type = 'success', duration = 4000) {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <span>${icon}</span>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" aria-label="Close Toast">×</button>
        `;

        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => toast.remove());

        container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(20px)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }

    /**
     * Modal Controller
     */
    static openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    }

    static closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('open');
            document.body.style.overflow = '';
        }
    }

    /**
     * Confirmation Dialog Modal
     */
    static showConfirmDialog({ title, message, confirmText = 'Confirm', confirmVariant = 'primary', onConfirm }) {
        let modal = document.getElementById('global-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'global-confirm-modal';
            modal.className = 'modal-backdrop';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3 class="card-title" id="confirm-title">Confirm Action</h3>
                        <button class="toast-close" id="confirm-close-x">×</button>
                    </div>
                    <div class="modal-body" id="confirm-message" style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                        Are you sure you want to proceed?
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirm-cancel-btn">Cancel</button>
                        <button class="btn" id="confirm-action-btn">Confirm</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            document.getElementById('confirm-close-x').addEventListener('click', () => UI.closeModal('global-confirm-modal'));
            document.getElementById('confirm-cancel-btn').addEventListener('click', () => UI.closeModal('global-confirm-modal'));
        }

        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        
        const actionBtn = document.getElementById('confirm-action-btn');
        actionBtn.textContent = confirmText;
        actionBtn.className = `btn btn-${confirmVariant}`;

        // Clone and replace to strip old event listeners
        const newActionBtn = actionBtn.cloneNode(true);
        actionBtn.parentNode.replaceChild(newActionBtn, actionBtn);

        newActionBtn.addEventListener('click', () => {
            UI.closeModal('global-confirm-modal');
            if (typeof onConfirm === 'function') onConfirm();
        });

        UI.openModal('global-confirm-modal');
    }

    /**
     * Render Table Skeleton Loader
     */
    static renderTableSkeleton(tbodyElement, cols = 5, rows = 5) {
        if (!tbodyElement) return;
        let html = '';
        for (let i = 0; i < rows; i++) {
            html += `<tr>`;
            for (let j = 0; j < cols; j++) {
                html += `<td><div class="skeleton skeleton-text" style="margin: 0; width: ${80 - (j * 10)}%;"></div></td>`;
            }
            html += `</tr>`;
        }
        tbodyElement.innerHTML = html;
    }

    /**
     * Render Empty State
     */
    static renderEmptyState(container, { icon = '📭', title = 'No Data Found', subtitle = 'There are no items to display at this time.' }) {
        if (!container) return;
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">${icon}</div>
                <div class="empty-title">${title}</div>
                <div class="empty-subtitle">${subtitle}</div>
            </div>
        `;
    }
}

// Auto-init UI when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});

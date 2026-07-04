/**
 * ==========================================================================
 * AI Sales Analyst — Sales CRUD & Filter Controller (js/sales.js)
 * ==========================================================================
 */

class SalesController {
    static allSales = [];
    static currentPage = 1;
    static itemsPerPage = 8;
    static searchQuery = '';
    static sortField = 'sale_date';
    static sortOrder = 'desc';

    static async init() {
        if (!Auth.guard()) return;
        SalesController.setupEventListeners();
        await SalesController.loadSales();
    }

    static setupEventListeners() {
        const searchInput = document.getElementById('sales-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                SalesController.searchQuery = e.target.value.toLowerCase().trim();
                SalesController.currentPage = 1;
                SalesController.renderTable();
            }, 300));
        }

        const addBtn = document.getElementById('add-sale-btn');
        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                document.getElementById('modal-sale-title').textContent = "Record New Sale";
                document.getElementById('sale-id').value = "";
                document.getElementById('sale-form').reset();
                await SalesController.populateSelects();
                UI.openModal('sale-modal');
            });
        }

        const form = document.getElementById('sale-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await SalesController.saveSale();
            });
        }

        const closeModalBtns = document.querySelectorAll('.close-sale-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => UI.closeModal('sale-modal'));
        });

        // Sorting Headers
        document.querySelectorAll('.th-sortable').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.getAttribute('data-sort');
                if (SalesController.sortField === field) {
                    SalesController.sortOrder = SalesController.sortOrder === 'asc' ? 'desc' : 'asc';
                } else {
                    SalesController.sortField = field;
                    SalesController.sortOrder = 'desc';
                }
                SalesController.renderTable();
            });
        });
    }

    static async loadSales() {
        const tbody = document.getElementById('sales-tbody');
        if (!tbody) return;

        UI.renderTableSkeleton(tbody, 6, 6);

        try {
            const res = await API.get('/sales/');
            SalesController.allSales = res || [];
            SalesController.renderTable();
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-danger);">Failed to load sales records.</td></tr>`;
        }
    }

    static async populateSelects() {
        try {
            const [products, customers] = await Promise.all([
                API.get('/products/'),
                API.get('/customers/')
            ]);

            const prodSelect = document.getElementById('sale-product');
            const custSelect = document.getElementById('sale-customer');

            if (prodSelect) {
                prodSelect.innerHTML = `<option value="">Select Product...</option>` + 
                    (products || []).map(p => `<option value="${p.id}" data-price="${p.price}">${p.name} ($${p.price})</option>`).join('');
            }

            if (custSelect) {
                custSelect.innerHTML = `<option value="">Select Customer...</option>` + 
                    (customers || []).map(c => `<option value="${c.id}">${c.name} (${c.company || 'Individual'})</option>`).join('');
            }

            // Auto calculate total on quantity/product change
            if (prodSelect) {
                prodSelect.addEventListener('change', SalesController.updateTotalCalc);
            }
            const qtyInput = document.getElementById('sale-quantity');
            if (qtyInput) {
                qtyInput.addEventListener('input', SalesController.updateTotalCalc);
            }

        } catch (error) {
            console.error("Failed to populate dropdowns:", error);
        }
    }

    static updateTotalCalc() {
        const prodSelect = document.getElementById('sale-product');
        const qtyInput = document.getElementById('sale-quantity');
        const totalInput = document.getElementById('sale-total');

        if (prodSelect && qtyInput && totalInput && prodSelect.selectedIndex > 0) {
            const price = Number(prodSelect.options[prodSelect.selectedIndex].getAttribute('data-price')) || 0;
            const qty = Number(qtyInput.value) || 0;
            totalInput.value = (price * qty).toFixed(2);
        }
    }

    static renderTable() {
        const tbody = document.getElementById('sales-tbody');
        if (!tbody) return;

        // Filter
        let filtered = SalesController.allSales.filter(s => 
            String(s.id).includes(SalesController.searchQuery) ||
            (s.product_name && s.product_name.toLowerCase().includes(SalesController.searchQuery)) ||
            (s.customer_name && s.customer_name.toLowerCase().includes(SalesController.searchQuery))
        );

        // Sort
        filtered.sort((a, b) => {
            let valA = a[SalesController.sortField];
            let valB = b[SalesController.sortField];
            if (SalesController.sortField === 'total_amount' || SalesController.sortField === 'quantity' || SalesController.sortField === 'id') {
                valA = Number(valA || 0);
                valB = Number(valB || 0);
            }
            if (valA < valB) return SalesController.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return SalesController.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6">`;
            UI.renderEmptyState(tbody.querySelector('td'), {
                icon: '📈',
                title: 'No Sales Records Found',
                subtitle: SalesController.searchQuery ? `No sales match "${SalesController.searchQuery}".` : 'Record your first sale transaction to see analytics.'
            });
            tbody.innerHTML += `</td></tr>`;
            document.getElementById('pagination-info').textContent = "Showing 0 items";
            return;
        }

        const totalPages = Math.ceil(filtered.length / SalesController.itemsPerPage);
        if (SalesController.currentPage > totalPages) SalesController.currentPage = 1;

        const startIdx = (SalesController.currentPage - 1) * SalesController.itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + SalesController.itemsPerPage);

        tbody.innerHTML = pageItems.map(s => `
            <tr>
                <td style="color: var(--text-muted);">#${s.id}</td>
                <td style="font-weight: 600; color: var(--text-main);">${s.product_name || `Product #${s.product_id}`}</td>
                <td style="color: var(--text-secondary);">${s.customer_name || `Customer #${s.customer_id}`}</td>
                <td><span class="badge badge-primary">${s.quantity} units</span></td>
                <td style="font-weight: 700; color: var(--color-success);">${Utils.formatCurrency(s.total_amount)}</td>
                <td class="text-muted">${Utils.formatDate(s.sale_date)}</td>
            </tr>
        `).join('');

        document.getElementById('pagination-info').textContent = `Showing ${startIdx + 1} to ${Math.min(startIdx + SalesController.itemsPerPage, filtered.length)} of ${filtered.length} sales`;
        SalesController.renderPaginationControls(totalPages);
    }

    static renderPaginationControls(totalPages) {
        const controls = document.getElementById('pagination-controls');
        if (!controls) return;

        let html = `
            <button class="btn btn-secondary btn-sm" ${SalesController.currentPage === 1 ? 'disabled' : ''} id="prev-sale-page">Previous</button>
            <span style="font-size: 14px; align-self: center; padding: 0 8px;">Page ${SalesController.currentPage} of ${totalPages || 1}</span>
            <button class="btn btn-secondary btn-sm" ${SalesController.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} id="next-sale-page">Next</button>
        `;
        controls.innerHTML = html;

        const prevBtn = document.getElementById('prev-sale-page');
        const nextBtn = document.getElementById('next-sale-page');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (SalesController.currentPage > 1) {
                SalesController.currentPage--;
                SalesController.renderTable();
            }
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (SalesController.currentPage < totalPages) {
                SalesController.currentPage++;
                SalesController.renderTable();
            }
        });
    }

    static async saveSale() {
        const product_id = Number(document.getElementById('sale-product').value);
        const customer_id = Number(document.getElementById('sale-customer').value);
        const quantity = Number(document.getElementById('sale-quantity').value);
        const total_amount = Number(document.getElementById('sale-total').value);

        if (!product_id || !customer_id || quantity <= 0 || isNaN(total_amount)) {
            UI.showToast("Please fill in all required sale fields correctly.", "warning");
            return;
        }

        const payload = {
            product_id,
            customer_id,
            quantity,
            total_amount,
            sale_date: new Date().toISOString()
        };

        const submitBtn = document.getElementById('save-sale-btn');
        submitBtn.disabled = true;

        try {
            await API.post('/sales/', payload);
            UI.showToast("🎉 Sale recorded successfully! Analytics updated.", "success");
            UI.closeModal('sale-modal');
            await SalesController.loadSales();
        } catch (error) {
            console.error("Save sale error:", error);
        } finally {
            submitBtn.disabled = false;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('sales.html')) {
        SalesController.init();
    }
});

/**
 * ==========================================================================
 * AI Sales Analyst — Customers CRUD Controller (js/customers.js)
 * ==========================================================================
 */

class CustomersController {
    static allCustomers = [];
    static currentPage = 1;
    static itemsPerPage = 8;
    static searchQuery = '';

    static async init() {
        if (!Auth.guard()) return;
        CustomersController.setupEventListeners();
        await CustomersController.loadCustomers();
    }

    static setupEventListeners() {
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                CustomersController.searchQuery = e.target.value.toLowerCase().trim();
                CustomersController.currentPage = 1;
                CustomersController.renderTable();
            }, 300));
        }

        const addBtn = document.getElementById('add-customer-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                document.getElementById('modal-customer-title').textContent = "Add New Customer";
                document.getElementById('customer-id').value = "";
                document.getElementById('customer-form').reset();
                UI.openModal('customer-modal');
            });
        }

        const form = document.getElementById('customer-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await CustomersController.saveCustomer();
            });
        }

        const closeModalBtns = document.querySelectorAll('.close-customer-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => UI.closeModal('customer-modal'));
        });
    }

    static async loadCustomers() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        UI.renderTableSkeleton(tbody, 5, 6);

        try {
            const res = await API.get('/customers/');
            CustomersController.allCustomers = res || [];
            CustomersController.renderTable();
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger);">Failed to load customer list.</td></tr>`;
        }
    }

    static renderTable() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        const filtered = CustomersController.allCustomers.filter(c => 
            c.name.toLowerCase().includes(CustomersController.searchQuery) ||
            (c.email && c.email.toLowerCase().includes(CustomersController.searchQuery)) ||
            (c.company && c.company.toLowerCase().includes(CustomersController.searchQuery))
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">`;
            UI.renderEmptyState(tbody.querySelector('td'), {
                icon: '👥',
                title: 'No Customers Found',
                subtitle: CustomersController.searchQuery ? `No customers match "${CustomersController.searchQuery}".` : 'Add your first enterprise account or customer to get started.'
            });
            tbody.innerHTML += `</td></tr>`;
            document.getElementById('pagination-info').textContent = "Showing 0 items";
            return;
        }

        const totalPages = Math.ceil(filtered.length / CustomersController.itemsPerPage);
        if (CustomersController.currentPage > totalPages) CustomersController.currentPage = 1;

        const startIdx = (CustomersController.currentPage - 1) * CustomersController.itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + CustomersController.itemsPerPage);

        tbody.innerHTML = pageItems.map(c => `
            <tr>
                <td style="color: var(--text-muted);">#${c.id}</td>
                <td style="font-weight: 600; color: var(--text-main);">${c.name}</td>
                <td style="color: var(--color-primary);">${c.email || '-'}</td>
                <td><span class="badge badge-warning">${c.company || 'Individual'}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm edit-cust-btn" data-id="${c.id}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-cust-btn" data-id="${c.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.edit-cust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const cust = CustomersController.allCustomers.find(item => item.id === id);
                if (cust) CustomersController.openEditModal(cust);
            });
        });

        tbody.querySelectorAll('.delete-cust-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                CustomersController.confirmDelete(id);
            });
        });

        document.getElementById('pagination-info').textContent = `Showing ${startIdx + 1} to ${Math.min(startIdx + CustomersController.itemsPerPage, filtered.length)} of ${filtered.length} customers`;
        CustomersController.renderPaginationControls(totalPages);
    }

    static renderPaginationControls(totalPages) {
        const controls = document.getElementById('pagination-controls');
        if (!controls) return;

        let html = `
            <button class="btn btn-secondary btn-sm" ${CustomersController.currentPage === 1 ? 'disabled' : ''} id="prev-cust-page">Previous</button>
            <span style="font-size: 14px; align-self: center; padding: 0 8px;">Page ${CustomersController.currentPage} of ${totalPages || 1}</span>
            <button class="btn btn-secondary btn-sm" ${CustomersController.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} id="next-cust-page">Next</button>
        `;
        controls.innerHTML = html;

        const prevBtn = document.getElementById('prev-cust-page');
        const nextBtn = document.getElementById('next-cust-page');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (CustomersController.currentPage > 1) {
                CustomersController.currentPage--;
                CustomersController.renderTable();
            }
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (CustomersController.currentPage < totalPages) {
                CustomersController.currentPage++;
                CustomersController.renderTable();
            }
        });
    }

    static openEditModal(cust) {
        document.getElementById('modal-customer-title').textContent = "Edit Customer";
        document.getElementById('customer-id').value = cust.id;
        document.getElementById('customer-name').value = cust.name;
        document.getElementById('customer-email').value = cust.email || '';
        document.getElementById('customer-company').value = cust.company || '';
        UI.openModal('customer-modal');
    }

    static async saveCustomer() {
        const id = document.getElementById('customer-id').value;
        const name = document.getElementById('customer-name').value.trim();
        const email = document.getElementById('customer-email').value.trim();
        const company = document.getElementById('customer-company').value.trim();

        if (!name || !email) {
            UI.showToast("Please enter required customer name and email.", "warning");
            return;
        }

        const payload = { name, email, company };
        const submitBtn = document.getElementById('save-customer-btn');
        submitBtn.disabled = true;

        try {
            if (id) {
                await API.put(`/customers/${id}`, payload);
                UI.showToast("✅ Customer profile updated successfully!", "success");
            } else {
                await API.post('/customers/', payload);
                UI.showToast("🎉 New customer added to system!", "success");
            }
            UI.closeModal('customer-modal');
            await CustomersController.loadCustomers();
        } catch (error) {
            console.error("Save customer error:", error);
        } finally {
            submitBtn.disabled = false;
        }
    }

    static confirmDelete(id) {
        const cust = CustomersController.allCustomers.find(c => c.id === id);
        UI.showConfirmDialog({
            title: "Delete Customer",
            message: `Are you sure you want to delete customer account "${cust ? cust.name : ''}"? All linked records will be affected.`,
            confirmText: "Delete Account",
            confirmVariant: "danger",
            onConfirm: async () => {
                try {
                    await API.delete(`/customers/${id}`);
                    UI.showToast("🗑️ Customer account deleted.", "success");
                    await CustomersController.loadCustomers();
                } catch (error) {
                    console.error("Delete customer error:", error);
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('customers.html')) {
        CustomersController.init();
    }
});

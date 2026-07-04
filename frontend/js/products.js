/**
 * ==========================================================================
 * AI Sales Analyst — Products CRUD Controller (js/products.js)
 * ==========================================================================
 */

class ProductsController {
    static allProducts = [];
    static currentPage = 1;
    static itemsPerPage = 8;
    static searchQuery = '';

    static async init() {
        if (!Auth.guard()) return;

        ProductsController.setupEventListeners();
        await ProductsController.loadProducts();
    }

    static setupEventListeners() {
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                ProductsController.searchQuery = e.target.value.toLowerCase().trim();
                ProductsController.currentPage = 1;
                ProductsController.renderTable();
            }, 300));
        }

        const addBtn = document.getElementById('add-product-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                document.getElementById('modal-product-title').textContent = "Add New Product";
                document.getElementById('product-id').value = "";
                document.getElementById('product-form').reset();
                UI.openModal('product-modal');
            });
        }

        const form = document.getElementById('product-form');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await ProductsController.saveProduct();
            });
        }

        const closeModalBtns = document.querySelectorAll('.close-product-modal');
        closeModalBtns.forEach(btn => {
            btn.addEventListener('click', () => UI.closeModal('product-modal'));
        });
    }

    static async loadProducts() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        UI.renderTableSkeleton(tbody, 5, 6);

        try {
            const res = await API.get('/products/');
            ProductsController.allProducts = res || [];
            ProductsController.renderTable();
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger);">Failed to load product catalog.</td></tr>`;
        }
    }

    static renderTable() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        // Filter by Search Query
        const filtered = ProductsController.allProducts.filter(p => 
            p.name.toLowerCase().includes(ProductsController.searchQuery) ||
            (p.category && p.category.toLowerCase().includes(ProductsController.searchQuery))
        );

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5">`;
            UI.renderEmptyState(tbody.querySelector('td'), {
                icon: '📦',
                title: 'No Products Found',
                subtitle: ProductsController.searchQuery ? `No products match "${ProductsController.searchQuery}".` : 'Get started by adding your first product to the catalog.'
            });
            tbody.innerHTML += `</td></tr>`;
            document.getElementById('pagination-info').textContent = "Showing 0 items";
            return;
        }

        // Pagination
        const totalPages = Math.ceil(filtered.length / ProductsController.itemsPerPage);
        if (ProductsController.currentPage > totalPages) ProductsController.currentPage = 1;

        const startIdx = (ProductsController.currentPage - 1) * ProductsController.itemsPerPage;
        const pageItems = filtered.slice(startIdx, startIdx + ProductsController.itemsPerPage);

        tbody.innerHTML = pageItems.map(p => `
            <tr>
                <td style="color: var(--text-muted);">#${p.id}</td>
                <td style="font-weight: 600; color: var(--text-main);">${p.name}</td>
                <td><span class="badge badge-primary">${p.category || 'General'}</span></td>
                <td style="font-weight: 600; color: var(--color-success);">${Utils.formatCurrency(p.price)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-secondary btn-sm edit-prod-btn" data-id="${p.id}">Edit</button>
                        <button class="btn btn-danger btn-sm delete-prod-btn" data-id="${p.id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Attach Edit / Delete event listeners
        tbody.querySelectorAll('.edit-prod-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                const prod = ProductsController.allProducts.find(item => item.id === id);
                if (prod) ProductsController.openEditModal(prod);
            });
        });

        tbody.querySelectorAll('.delete-prod-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = Number(btn.getAttribute('data-id'));
                ProductsController.confirmDelete(id);
            });
        });

        // Update Pagination Info
        document.getElementById('pagination-info').textContent = `Showing ${startIdx + 1} to ${Math.min(startIdx + ProductsController.itemsPerPage, filtered.length)} of ${filtered.length} products`;
        ProductsController.renderPaginationControls(totalPages);
    }

    static renderPaginationControls(totalPages) {
        const controls = document.getElementById('pagination-controls');
        if (!controls) return;

        let html = `
            <button class="btn btn-secondary btn-sm" ${ProductsController.currentPage === 1 ? 'disabled' : ''} id="prev-page-btn">Previous</button>
            <span style="font-size: 14px; align-self: center; padding: 0 8px;">Page ${ProductsController.currentPage} of ${totalPages || 1}</span>
            <button class="btn btn-secondary btn-sm" ${ProductsController.currentPage === totalPages || totalPages === 0 ? 'disabled' : ''} id="next-page-btn">Next</button>
        `;
        controls.innerHTML = html;

        const prevBtn = document.getElementById('prev-page-btn');
        const nextBtn = document.getElementById('next-page-btn');

        if (prevBtn) prevBtn.addEventListener('click', () => {
            if (ProductsController.currentPage > 1) {
                ProductsController.currentPage--;
                ProductsController.renderTable();
            }
        });

        if (nextBtn) nextBtn.addEventListener('click', () => {
            if (ProductsController.currentPage < totalPages) {
                ProductsController.currentPage++;
                ProductsController.renderTable();
            }
        });
    }

    static openEditModal(prod) {
        document.getElementById('modal-product-title').textContent = "Edit Product";
        document.getElementById('product-id').value = prod.id;
        document.getElementById('product-name').value = prod.name;
        document.getElementById('product-category').value = prod.category || '';
        document.getElementById('product-price').value = prod.price;
        UI.openModal('product-modal');
    }

    static async saveProduct() {
        const id = document.getElementById('product-id').value;
        const name = document.getElementById('product-name').value.trim();
        const category = document.getElementById('product-category').value.trim();
        const price = Number(document.getElementById('product-price').value);

        if (!name || isNaN(price)) {
            UI.showToast("Please enter valid product name and price.", "warning");
            return;
        }

        const payload = { name, category, price };
        const submitBtn = document.getElementById('save-product-btn');
        submitBtn.disabled = true;

        try {
            if (id) {
                // Update
                await API.put(`/products/${id}`, payload);
                UI.showToast("✅ Product updated successfully!", "success");
            } else {
                // Create
                await API.post('/products/', payload);
                UI.showToast("🎉 New product added to catalog!", "success");
            }
            UI.closeModal('product-modal');
            await ProductsController.loadProducts();
        } catch (error) {
            console.error("Save product error:", error);
        } finally {
            submitBtn.disabled = false;
        }
    }

    static confirmDelete(id) {
        const prod = ProductsController.allProducts.find(p => p.id === id);
        UI.showConfirmDialog({
            title: "Delete Product",
            message: `Are you sure you want to permanently delete "${prod ? prod.name : 'this product'}"? This cannot be undone.`,
            confirmText: "Delete Product",
            confirmVariant: "danger",
            onConfirm: async () => {
                try {
                    await API.delete(`/products/${id}`);
                    UI.showToast("🗑️ Product deleted from catalog.", "success");
                    await ProductsController.loadProducts();
                } catch (error) {
                    console.error("Delete product error:", error);
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('products.html')) {
        ProductsController.init();
    }
});

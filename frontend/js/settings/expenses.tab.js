/**
 * Settings - Expenses Tab
 * Handles expense category management and receipt scanning
 */

export async function loadExpensesTab(manager) {
    const container = document.getElementById('settings-content-expenses');
    Utils.showLoading('settings-content-expenses');

    try {
        manager.data.expenses = await api.getExpenseCategories();

        container.innerHTML = `
    <div class="settings-block">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <p class="settings-block-title" style="margin:0;border:none;padding:0;">Monthly Expenses</p>
            <div style="display:flex;gap:8px;">
                <button onclick="settingsManager.showAddExpenseModal()" class="glow-button">+ Add Category</button>
                <button onclick="settingsManager.showScanReceiptModal()" class="btn-ghost">📷 Scan Receipt</button>
            </div>
        </div>
        <div id="expenses-list" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            ${renderExpensesList(manager)}
        </div>
    </div>
    <div class="settings-block">
        <p class="settings-block-title">Expense Summary</p>
        <div class="summary-banner">
            <div class="summary-banner-stat"><span class="summary-banner-label">Total Expenses</span><span class="summary-banner-value">${Utils.formatCurrency(manager.data.expenses.summary.total_expenses)}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">Essential</span><span class="summary-banner-value">${Utils.formatCurrency(manager.data.expenses.summary.essential_expenses)}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">Non-Essential</span><span class="summary-banner-value">${Utils.formatCurrency(manager.data.expenses.summary.non_essential_expenses)}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">Expense Ratio</span><span class="summary-banner-value">${manager.data.expenses.summary.expense_ratio}%</span></div>
        </div>
        ${renderExpenseWarnings(manager)}
    </div>
    <div class="settings-block">
        <p class="settings-block-title">Scanned Receipts</p>
        <div id="receipt-list" style="color:#64748b;font-size:13px;">Loading...</div>
    </div>
`;

        await loadReceiptHistory();

    } catch (error) {
        console.error('Error loading expenses tab:', error);
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
                <p class="text-red-700 font-semibold">Failed to load expenses</p>
                <p class="text-sm text-red-600 mt-2">${error.message}</p>
                <div class="flex gap-2 mt-4">
                    <button onclick="settingsManager.loadTabData('expenses')" 
                            class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            </div>
        `;

        loadReceiptHistory();
    }
}

export function renderExpensesList(manager) {
    if (!manager.data.expenses.categories || manager.data.expenses.categories.length === 0) {
        return `<div style="grid-column:span 2;text-align:center;padding:40px;color:#64748b;font-size:13px;">No expense categories yet</div>`;
    }
    return manager.data.expenses.categories.map(cat => `
        <div class="item-card" style="flex-direction:column;gap:8px;">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div>
                    <div class="item-card-title">${cat.category_name}</div>
                    <div class="item-card-sub">${cat.is_essential ? 'Essential' : 'Non-essential'} · ${cat.is_fixed ? 'Fixed' : 'Variable'}</div>
                </div>
                <button onclick="settingsManager.deleteExpenseCategory(${cat.id})" class="btn-danger-ghost" style="padding:4px 10px;font-size:11px;">×</button>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="item-card-amount" style="font-size:16px;">${Utils.formatCurrency(cat.monthly_amount)}</span>
                <span style="font-size:11px;color:#64748b;">${cat.percentage_of_income}% of income</span>
            </div>
        </div>
    `).join('');
}

export function renderExpenseWarnings(manager) {
    if (!manager.data.expenses.analysis || !manager.data.expenses.analysis.warnings ||
        manager.data.expenses.analysis.warnings.length === 0) {
        return '';
    }

    return `
        <div class="mt-6 space-y-3">
            <h3 class="font-bold text-sm text-gray-400">⚠️ Warnings</h3>
            ${manager.data.expenses.analysis.warnings.map(warning => `
                <div style="padding:10px; background:rgba(251,191,36,0.1); border-left:3px solid #fbbf24; border-radius:4px;">
                    <p class="text-xs font-semibold text-yellow-500">${warning.message}</p>
                </div>
            `).join('')}
        </div>
    `;
}

export function showAddExpenseModal(manager) {
    const modalHtml = `
<div class="dark-modal-bg" id="add-expense-modal">
    <div class="dark-modal">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="dark-modal-title">Add Expense Category</h3>
                    <button onclick="settingsManager.closeModal('add-expense-modal')" 
                            class="text-gray-500 hover:text-gray-700 text-2xl" style="margin-top:-24px;">
                        ×
                    </button>
                </div>
                
                <form id="add-expense-form">
                    <div class="mb-4">
                        <label class="dark-label">Category Name *</label>
                        <input type="text" id="expense-category-name" 
                               class="dark-input" 
                               placeholder="e.g., Rent, Food, Transport" required>
                    </div>
                    
                    <div class="mb-4">
                        <label class="dark-label">Monthly Amount (₹) *</label>
                        <input type="number" id="expense-amount" 
                               class="dark-input" 
                               placeholder="15000" required>
                    </div>
                    
                    <div class="mb-4 space-y-2">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="expense-essential" checked>
                            <span class="text-sm">Essential expense</span>
                        </label>
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="expense-fixed" checked>
                            <span class="text-sm">Fixed amount (not variable)</span>
                        </label>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="button" 
                                onclick="settingsManager.closeModal('add-expense-modal')"
                                class="btn-ghost" style="flex:1;">
                            Cancel
                        </button>
                        <button type="submit" class="glow-button" style="flex:1;">
                            Add Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('add-expense-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveExpenseCategory(manager);
    });
}

export async function saveExpenseCategory(manager) {
    const data = {
        category_name: document.getElementById('expense-category-name').value,
        monthly_amount: parseFloat(document.getElementById('expense-amount').value),
        is_essential: document.getElementById('expense-essential').checked,
        is_fixed: document.getElementById('expense-fixed').checked
    };

    const validation = Validation.validateExpenseCategory(data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'danger');
        return;
    }

    try {
        await api.createExpenseCategory(data);
        Utils.showToast('✅ Category added successfully!', 'success');
        manager.closeModal('add-expense-modal');
        await loadExpensesTab(manager);
    } catch (error) {
        console.error('Error saving expense:', error);
        Utils.showToast('Failed to save expense', 'danger');
    }
}

export async function deleteExpenseCategory(manager, categoryId) {
    if (!confirm('Delete this expense category?')) return;

    try {
        await api.deleteExpenseCategory(categoryId);
        Utils.showToast('✅ Category deleted', 'success');
        await loadExpensesTab(manager);
    } catch (error) {
        console.error('Error deleting expense:', error);
        Utils.showToast('Failed to delete category', 'danger');
    }
}

export async function loadReceiptHistory() {
    try {
        const url = `${CONFIG.API.BILL_SCANNER_URL}/api/receipts`;
        const response = await fetch(url);
        const data = await response.json();

        const receipts = Array.isArray(data) ? data : (data.receipts || []);

        const historyContainer = document.getElementById('receipt-list');
        if (!historyContainer) return;

        historyContainer.innerHTML = receipts.length === 0
            ? '<p class="text-sm text-gray-400">No scanned receipts yet.</p>'
            : receipts.map(r => `
                <div class="item-card" style="padding:12px; margin-bottom:8px;">
                    <div style="flex:1;">
                        <p class="item-card-title" style="font-size:13px;">${r.vendor}</p>
                        <p class="item-card-sub" style="font-size:11px;">${r.date || 'No Date'} · ${r.category}</p>
                    </div>
                    <span class="item-card-amount" style="font-size:15px;">₹${r.amount}</span>
                </div>
            `).join('');
    } catch (error) {
        console.error("Could not load receipt history:", error);
    }
}

export function showScanReceiptModal() {
    const modalHtml = `
<div class="dark-modal-bg" id="scan-receipt-modal">
    <div class="dark-modal">
                <h3 class="dark-modal-title">📷 Scan Receipt</h3>
                <div id="scan-result" class="hidden mb-4 p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <p class="text-sm font-semibold text-green-400" id="scan-result-text"></p>
                </div>
                <div class="mb-4">
                    <label class="dark-label">Select Receipt Image</label>
                    <input type="file" id="receiptInput" accept="image/*" class="dark-input" style="padding:20px; border-style:dashed;">
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="settingsManager.closeModal('scan-receipt-modal')"
                            class="btn-ghost" style="flex:1;">
                        Cancel
                    </button>
                    <button type="button" onclick="settingsManager.handleReceiptUpload()"
                            id="scan-submit-btn" class="glow-button" style="flex:1;">
                        Upload & Scan
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

export async function handleReceiptUpload(manager) {
    const file = document.getElementById('receiptInput').files[0];
    if (!file) {
        Utils.showToast('Please select an image first', 'warning');
        return;
    }

    const btn = document.getElementById('scan-submit-btn');
    btn.textContent = 'Processing...';
    btn.disabled = true;

    try {
        const result = await window.api.uploadReceipt(file);

        const resultBox = document.getElementById('scan-result');
        document.getElementById('scan-result-text').textContent =
            `✅ ${result.vendor} — ₹${result.amount} (${result.category})`;
        resultBox.classList.remove('hidden');

        try {
            const essentialCategories = ['restaurant', 'grocery', 'pharmacy', 'fast_food'];
            const isEssential = essentialCategories.includes(result.category?.toLowerCase());

            await api.createExpenseCategory({
                category_name: result.vendor || "Unknown Vendor",
                monthly_amount: parseFloat(result.amount) || 0,
                is_essential: isEssential,
                is_fixed: false
            });

            if (manager.currentTab === 'expenses') {
                loadExpensesTab(manager);
            }

            Utils.showToast(`✅ Added ${result.vendor} to expenses`, 'success');
        } catch (bridgeError) {
            console.error("Auto-add to expenses failed:", bridgeError);
        }

        await loadReceiptHistory();

    } catch (error) {
        Utils.showToast('Failed to process receipt: ' + error.message, 'danger');
    } finally {
        btn.textContent = 'Upload & Scan';
        btn.disabled = false;
    }
}

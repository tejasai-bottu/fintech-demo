/**
 * Settings - Expenses Tab
 * Handles expense categories and receipt scanning
 */

export async function loadExpensesTab(manager) {
    const container = document.getElementById('settings-content-expenses');
    Utils.showLoading('settings-content-expenses');

    try {
        manager.data.expenses = await api.getExpenseCategories();

        container.innerHTML = `
            <div class="bg-white rounded-xl shadow-lg p-8">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">📊 Monthly Expenses</h2>
                    <div class="flex gap-2">
                        <button onclick="settingsManager.showAddExpenseModal()" 
                                class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                            ➕ Add Category
                        </button>
                        <button onclick="settingsManager.showScanReceiptModal()" 
                                style="padding:8px 20px; background:#0e9f6e; color:white; border:none; 
                                       border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                            📷 Scan Receipt
                        </button>
                    </div>
                </div>
                
                <!-- Categories List -->
                <div id="expenses-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    ${renderExpensesList(manager)}
                </div>
                
                <!-- Summary -->
                <div style="background:#1f4e79; color:white; padding:20px; border-radius:6px;">
                    <h3 class="font-bold mb-4">💰 Expense Summary</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <p class="text-sm opacity-90">Total Expenses</p>
                            <p class="text-3xl font-bold">${Utils.formatCurrency(manager.data.expenses.summary.total_expenses)}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Essential</p>
                            <p class="text-3xl font-bold">${Utils.formatCurrency(manager.data.expenses.summary.essential_expenses)}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Non-Essential</p>
                            <p class="text-3xl font-bold">${Utils.formatCurrency(manager.data.expenses.summary.non_essential_expenses)}</p>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                        <p class="text-sm font-semibold">Expense Ratio: ${manager.data.expenses.summary.expense_ratio}%</p>
                    </div>
                </div>
                
                ${renderExpenseWarnings(manager)}

                <div id="receipt-history-section" class="mt-6">
                    <h3 class="font-bold mb-3">🧾 Scanned Receipts</h3>
                    <div id="receipt-list">Loading...</div>
                </div>
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
                    <button onclick="settingsManager.showScanReceiptModal()" 
                            style="padding:8px 20px; background:#0e9f6e; color:white; border:none; 
                                   border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                        📷 Scan Receipt
                    </button>
                </div>
            </div>

            <div id="receipt-history-section" class="mt-6 bg-white rounded-xl shadow-lg p-8">
                <h3 class="font-bold mb-3">🧾 Scanned Receipts</h3>
                <div id="receipt-list">Loading...</div>
            </div>
        `;

        loadReceiptHistory();
    }
}

export function renderExpensesList(manager) {
    if (!manager.data.expenses.categories || manager.data.expenses.categories.length === 0) {
        return `
            <div class="col-span-2 text-center py-12">
                <p class="text-6xl mb-4">📊</p>
                <p class="text-gray-500">No expense categories yet</p>
                <p class="text-sm text-gray-400">Click "Add Category" to get started</p>
            </div>
        `;
    }

    return manager.data.expenses.categories.map(cat => `
        <div style="border:1px solid #e8eaed; border-radius:6px; padding:16px; 
                    background:white; transition:box-shadow 150ms;">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <h4 class="font-bold">${cat.category_name}</h4>
                    <p class="text-sm text-gray-600">
                        ${cat.is_essential ? '✓ Essential' : 'Non-essential'} • 
                        ${cat.is_fixed ? 'Fixed' : 'Variable'}
                    </p>
                </div>
                <button onclick="settingsManager.deleteExpenseCategory(${cat.id})" 
                        class="text-red-600 hover:underline text-sm">
                    ×
                </button>
            </div>
            <p class="text-2xl font-bold text-blue-600">${Utils.formatCurrency(cat.monthly_amount)}</p>
            <p class="text-xs text-gray-500">${cat.percentage_of_income}% of income</p>
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
            <h3 class="font-bold">⚠️ Warnings</h3>
            ${manager.data.expenses.analysis.warnings.map(warning => `
                <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                    <p class="text-sm font-semibold text-yellow-700">${warning.message}</p>
                </div>
            `).join('')}
        </div>
    `;
}

export function showAddExpenseModal(manager) {
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="add-expense-modal">
            <div style="background:white; border-radius:6px; padding:28px; 
                        max-width:600px; width:100%; margin:16px; 
                        box-shadow:0 4px 20px rgba(0,0,0,0.15);">
                <div class="flex justify-between items-center mb-6">
                    <h3 style="font-size:16px; font-weight:700; color:#1f4e79;">Add Expense Category</h3>
                    <button onclick="settingsManager.closeModal('add-expense-modal')" 
                            class="text-gray-500 hover:text-gray-700 text-2xl">
                        ×
                    </button>
                </div>
                
                <form id="add-expense-form">
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-2">Category Name *</label>
                        <input type="text" id="expense-category-name" 
                               class="w-full px-4 py-2 border-2 rounded-lg" 
                               placeholder="e.g., Rent, Food, Transport" required>
                    </div>
                    
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-2">Monthly Amount (₹) *</label>
                        <input type="number" id="expense-amount" 
                               class="w-full px-4 py-2 border-2 rounded-lg" 
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
                                style="flex:1; padding:10px; background:white; color:#555; 
                                       border:1px solid #ddd; border-radius:4px; font-size:13px; 
                                       font-weight:600; cursor:pointer;">
                            Cancel
                        </button>
                        <button type="submit"
                                style="flex:1; padding:10px; background:#1f4e79; color:white; border:none; 
                                       border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
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
                <div style="border:1px solid #e8eaed; border-radius:6px; padding:12px; 
                            margin-bottom:8px; background:white; display:flex; 
                            justify-content:space-between; align-items:center;">
                    <span class="text-sm text-gray-500">${r.date || 'No Date'}</span>
                    <strong>${r.vendor}</strong>
                    <span>₹${r.amount}</span>
                    <span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; 
                                 border-radius:99px; font-size:12px;">${r.category}</span>
                </div>
            `).join('');
    } catch (error) {
        console.error("Could not load receipt history:", error);
    }
}

export function showScanReceiptModal() {
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="scan-receipt-modal">
            <div style="background:white; border-radius:6px; padding:28px; 
                        max-width:500px; width:100%; margin:16px;">
                <h3 style="font-size:16px; font-weight:700; color:#1f4e79; margin-bottom:16px;">
                    📷 Scan Receipt
                </h3>
                <div id="scan-result" class="hidden mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <p class="text-sm font-semibold text-green-700" id="scan-result-text"></p>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-semibold mb-2">Select Receipt Image</label>
                    <input type="file" id="receiptInput" accept="image/*"
                           style="width:100%; padding:8px; border:2px dashed #cbd5e1; border-radius:6px;">
                </div>
                <div class="flex gap-3">
                    <button type="button" onclick="settingsManager.closeModal('scan-receipt-modal')"
                            style="flex:1; padding:10px; background:white; color:#555; 
                                   border:1px solid #ddd; border-radius:4px; cursor:pointer;">
                        Cancel
                    </button>
                    <button type="button" onclick="settingsManager.handleReceiptUpload()"
                            id="scan-submit-btn"
                            style="flex:1; padding:10px; background:#0e9f6e; color:white; 
                                   border:none; border-radius:4px; cursor:pointer; font-weight:600;">
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
            `✅ ${result.vendor} — ₹${result.amount} (${result.category})` +
            (result.expense_synced ? ' • Synced to dashboard' : '');
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
            Utils.showToast('Scanner sync failed, but receipt stored', 'warning');
        }

        await loadReceiptHistory();

    } catch (error) {
        Utils.showToast('Failed to process receipt: ' + error.message, 'danger');
    } finally {
        btn.textContent = 'Upload & Scan';
        btn.disabled = false;
    }
}

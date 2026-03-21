/**
 * Settings - Debts Tab
 * Handles debt portfolio management
 */

export async function loadDebtsTab(manager) {
    const container = document.getElementById('settings-content-debts');
    Utils.showLoading('settings-content-debts');

    try {
        manager.data.debts = await api.getDebts();

        container.innerHTML = `
            <div style="background:white; border-radius:6px; padding:28px; 
                        box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                <div class="flex justify-between items-center mb-6">
                    <h2 style="font-size:15px; font-weight:700; color:#1f4e79; 
                               text-transform:uppercase; letter-spacing:0.5px;">
                        Debt Portfolio
                    </h2>
                    <button onclick="settingsManager.showAddDebtModal()" 
                            style="padding:8px 20px; background:#1f4e79; color:white; border:none; 
                                   border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                        + Add New Debt
                    </button>
                </div>
                
                <!-- Debts List -->
                <div id="debts-list" class="space-y-4 mb-8">
                    ${renderDebtsList(manager)}
                </div>
                
                <!-- Portfolio Summary -->
                <div style="background:#1f4e79; color:white; padding:20px; 
                            border-radius:6px; margin-top:8px;">
                    <h3 class="font-bold mb-4">📊 Portfolio Summary</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <p class="text-sm opacity-90">Total Debts</p>
                            <p class="text-3xl font-bold">${manager.data.debts.summary.total_debts}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Monthly EMI</p>
                            <p class="text-3xl font-bold">${Utils.formatCurrency(manager.data.debts.summary.total_emi)}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">DTI Ratio</p>
                            <p class="text-3xl font-bold">${manager.data.debts.summary.dti_ratio.ratio}%</p>
                        </div>
                    </div>
                    <div class="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                        <p class="text-sm font-semibold">${manager.data.debts.summary.dti_ratio.status}</p>
                        <p class="text-xs opacity-90 mt-1">${manager.data.debts.summary.dti_ratio.message}</p>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading debts tab:', error);
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <p class="text-red-700 font-semibold">Failed to load debts</p>
                <button onclick="settingsManager.loadTabData('debts')" 
                        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    Retry
                </button>
            </div>
        `;
    }
}

export function renderDebtsList(manager) {
    if (!manager.data.debts.debts || manager.data.debts.debts.length === 0) {
        return `
            <div class="text-center py-12">
                <p class="text-6xl mb-4">💳</p>
                <p class="text-gray-500">No debts added yet</p>
                <p class="text-sm text-gray-400">Click "Add New Debt" to get started</p>
            </div>
        `;
    }

    return manager.data.debts.debts.map(debt => `
        <div class="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
            <div class="flex justify-between items-start mb-4">
                <div>
                    <h3 class="text-xl font-bold">${debt.debt_name}</h3>
                    <p class="text-sm text-gray-600 capitalize">${debt.debt_type.replace('_', ' ')}</p>
                </div>
                <button onclick="settingsManager.deleteDebt(${debt.id})" 
                        class="text-red-600 hover:underline text-sm">
                    🗑️ Delete
                </button>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                    <p class="text-xs text-gray-600">Outstanding</p>
                    <p class="text-lg font-bold">${Utils.formatCurrency(debt.outstanding_principal)}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-600">Monthly EMI</p>
                    <p class="text-lg font-bold text-orange-600">${Utils.formatCurrency(debt.monthly_emi)}</p>
                </div>
                <div>
                    <p class="text-xs text-gray-600">Interest Rate</p>
                    <p class="text-lg font-bold">${debt.interest_rate}% p.a.</p>
                </div>
                <div>
                    <p class="text-xs text-gray-600">Remaining</p>
                    <p class="text-lg font-bold">${debt.remaining_months} months</p>
                </div>
            </div>
            
            <!-- Progress Bar -->
            <div class="mb-2">
                <div class="flex justify-between text-sm mb-1">
                    <span class="text-gray-600">Progress</span>
                    <span class="font-semibold">${debt.progress_percentage}% paid</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-green-500 h-2 rounded-full transition-all" 
                         style="width: ${debt.progress_percentage}%"></div>
                </div>
            </div>
            
            ${debt.start_date ? `
                <p class="text-xs text-gray-500">Started: ${Utils.formatDate(debt.start_date)}</p>
            ` : ''}
        </div>
    `).join('');
}

export function showAddDebtModal(manager) {
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" id="add-debt-modal">
            <div style="background:white; border-radius:6px; padding:28px; 
                        max-width:600px; width:100%; margin:16px; 
                        box-shadow:0 4px 20px rgba(0,0,0,0.15);">
                <div class="flex justify-between items-center mb-6">
                    <h3 style="font-size:16px; font-weight:700; color:#1f4e79;">Add New Debt</h3>
                    <button onclick="settingsManager.closeModal('add-debt-modal')" 
                            class="text-gray-500 hover:text-gray-700 text-2xl">
                        ×
                    </button>
                </div>
                
                <form id="add-debt-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        
                        <!-- Debt Type -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Debt Type *</label>
                            <select id="debt-type" class="w-full px-4 py-2 border-2 rounded-lg" required>
                                <option value="">Select Type</option>
                                <option value="home_loan">Home Loan</option>
                                <option value="car_loan">Car Loan</option>
                                <option value="personal_loan">Personal Loan</option>
                                <option value="credit_card">Credit Card</option>
                                <option value="education">Education Loan</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        
                        <!-- Debt Name -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Debt Name *</label>
                            <input type="text" id="debt-name" 
                                   class="w-full px-4 py-2 border-2 rounded-lg" 
                                   placeholder="e.g., HDFC Home Loan" required>
                        </div>
                        
                        <!-- Total Principal -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Total Principal (₹) *</label>
                            <input type="number" id="debt-principal" 
                                   class="w-full px-4 py-2 border-2 rounded-lg" 
                                   placeholder="2000000" required>
                        </div>
                        
                        <!-- Outstanding Principal -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Outstanding (₹) *</label>
                            <input type="number" id="debt-outstanding" 
                                   class="w-full px-4 py-2 border-2 rounded-lg" 
                                   placeholder="1800000" required>
                        </div>
                        
                        <!-- Interest Rate -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Interest Rate (%) *</label>
                            <input type="number" id="debt-rate" step="0.1"
                                   class="w-full px-4 py-2 border-2 rounded-lg" 
                                   placeholder="8.5" required>
                        </div>
                        
                        <!-- Total Tenure -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Total Tenure (months) *</label>
                            <input type="number" id="debt-tenure" 
                                   class="w-full px-4 py-2 border-2 rounded-lg" 
                                   placeholder="180" required>
                        </div>
                        
                        <!-- Remaining Months -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Remaining (months) *</label>
                            <input type="number" id="debt-remaining" 
                                   class="w-full px-4 py-2 border-2 rounded-lg" 
                                   placeholder="150" required>
                        </div>
                        
                        <!-- Start Date -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">Start Date *</label>
                            <input type="date" id="debt-start-date" 
                                   class="w-full px-4 py-2 border-2 rounded-lg" required>
                        </div>
                        
                    </div>
                    
                    <!-- EMI Calculation -->
                    <div class="mb-6">
                        <button type="button" 
                                onclick="settingsManager.calculateEMIPreview()"
                                class="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200">
                            🧮 Calculate EMI
                        </button>
                        <div id="emi-preview" class="hidden mt-3 p-4 bg-blue-50 rounded-lg">
                            <p class="text-sm text-gray-600">Monthly EMI</p>
                            <p class="text-2xl font-bold text-blue-600" id="emi-preview-amount">₹0</p>
                        </div>
                    </div>
                    
                    <!-- Submit Buttons -->
                    <div class="flex gap-3">
                        <button type="button" 
                                onclick="settingsManager.closeModal('add-debt-modal')"
                                style="flex:1; padding:10px; background:white; color:#555; 
                                       border:1px solid #ddd; border-radius:4px; font-size:13px; 
                                       font-weight:600; cursor:pointer;">
                            Cancel
                        </button>
                        <button type="submit"
                                style="flex:1; padding:10px; background:#1f4e79; color:white; border:none; 
                                       border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                            Add Debt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('debt-start-date').valueAsDate = new Date();

    document.getElementById('add-debt-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveDebt(manager);
    });
}

export async function calculateEMIPreview() {
    const principal = parseFloat(document.getElementById('debt-principal').value);
    const rate = parseFloat(document.getElementById('debt-rate').value);
    const tenure = parseInt(document.getElementById('debt-tenure').value);

    if (!principal || !rate || !tenure) {
        Utils.showToast('Please fill in principal, rate, and tenure', 'warning');
        return;
    }

    try {
        const result = await api.calculateEMI({
            principal: principal,
            interest_rate: rate,
            tenure_months: tenure
        });

        document.getElementById('emi-preview').classList.remove('hidden');
        document.getElementById('emi-preview-amount').textContent = Utils.formatCurrency(result.emi);

    } catch (error) {
        console.error('Error calculating EMI:', error);
        Utils.showToast('Failed to calculate EMI', 'danger');
    }
}

export async function saveDebt(manager) {
    let emi = 0;
    const emiPreview = document.getElementById('emi-preview-amount').textContent;
    if (emiPreview && emiPreview !== '₹0') {
        emi = parseFloat(emiPreview.replace('₹', '').replace(/,/g, ''));
    } else {
        const principal = parseFloat(document.getElementById('debt-principal').value);
        const rate = parseFloat(document.getElementById('debt-rate').value);
        const tenure = parseInt(document.getElementById('debt-tenure').value);
        const result = await api.calculateEMI({ principal, interest_rate: rate, tenure_months: tenure });
        emi = result.emi;
    }

    const data = {
        debt_type: document.getElementById('debt-type').value,
        debt_name: document.getElementById('debt-name').value,
        total_principal: parseFloat(document.getElementById('debt-principal').value),
        outstanding_principal: parseFloat(document.getElementById('debt-outstanding').value),
        interest_rate: parseFloat(document.getElementById('debt-rate').value),
        tenure_months: parseInt(document.getElementById('debt-tenure').value),
        remaining_months: parseInt(document.getElementById('debt-remaining').value),
        monthly_emi: emi,
        start_date: document.getElementById('debt-start-date').value
    };

    const validation = Validation.validateDebt(data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'danger');
        return;
    }

    try {
        const result = await api.createDebt(data);

        if (result.portfolio_summary.dti_ratio.severity === 'danger' ||
            result.portfolio_summary.dti_ratio.severity === 'critical') {
            showDTIWarning(result.portfolio_summary.dti_ratio);
        }

        Utils.showToast('✅ Debt added successfully!', 'success');
        manager.closeModal('add-debt-modal');
        await loadDebtsTab(manager);

    } catch (error) {
        console.error('Error saving debt:', error);
        Utils.showToast('Failed to save debt', 'danger');
    }
}

export function showDTIWarning(dtiInfo) {
    const warningHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="dti-warning-modal">
            <div style="background:white; border-radius:6px; padding:28px; 
                        max-width:600px; width:100%; margin:16px; 
                        box-shadow:0 4px 20px rgba(0,0,0,0.15);">
                <div class="text-center mb-6">
                    <span class="text-6xl">⚠️</span>
                    <h3 style="font-size:16px; font-weight:700; color:#1f4e79; margin-top:16px;">High Debt Burden</h3>
                </div>
                
                <div class="bg-red-50 p-4 rounded-lg mb-6">
                    <p class="text-sm font-semibold text-red-700">DTI Ratio: ${dtiInfo.ratio}%</p>
                    <p class="text-sm text-red-600 mt-2">${dtiInfo.message}</p>
                </div>
                
                <div class="mb-6">
                    <p class="font-semibold mb-2">Recommendation:</p>
                    <p class="text-sm text-gray-700">${dtiInfo.recommendation}</p>
                </div>
                
                <button onclick="settingsManager.closeModal('dti-warning-modal')"
                        style="width:100%; padding:10px; background:#1f4e79; color:white; border:none; 
                               border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                    I Understand
                </button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', warningHtml);
}

export async function deleteDebt(manager, debtId) {
    if (!confirm('Are you sure you want to delete this debt?')) return;

    try {
        await api.deleteDebt(debtId);
        Utils.showToast('✅ Debt deleted successfully', 'success');
        await loadDebtsTab(manager);
    } catch (error) {
        console.error('Error deleting debt:', error);
        Utils.showToast('Failed to delete debt', 'danger');
    }
}

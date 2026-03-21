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
    <div class="settings-block">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <p class="settings-block-title" style="margin:0;border:none;padding:0;">Debt Portfolio</p>
            <button onclick="settingsManager.showAddDebtModal()" class="glow-button">+ Add Debt</button>
        </div>
        <div id="debts-list">${renderDebtsList(manager)}</div>
    </div>
    <div class="settings-block">
        <p class="settings-block-title">Portfolio Summary</p>
        <div class="summary-banner">
            <div class="summary-banner-stat"><span class="summary-banner-label">Total Debts</span><span class="summary-banner-value">${manager.data.debts.summary.total_debts}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">Monthly EMI</span><span class="summary-banner-value">${Utils.formatCurrency(manager.data.debts.summary.total_emi)}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">DTI Ratio</span><span class="summary-banner-value" style="color:${manager.data.debts.summary.dti_ratio.ratio > 40 ? '#f87171' : '#34d399'}">${manager.data.debts.summary.dti_ratio.ratio}%</span></div>
        </div>
    </div>
`;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load debts: ${error.message}</div>`;
    }
}

export function renderDebtsList(manager) {
    if (!manager.data.debts.debts || manager.data.debts.debts.length === 0) {
        return `<div style="text-align:center;padding:40px;color:#64748b;font-size:13px;">No debts added yet</div>`;
    }
    return manager.data.debts.debts.map(debt => `
        <div class="item-card">
            <div class="item-card-left">
                <div class="item-card-title">${debt.debt_name}</div>
                <div class="item-card-sub">${debt.debt_type.replace('_',' ')} · ${debt.interest_rate}% · ${debt.remaining_months} mo left</div>
                <div class="item-card-progress">
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px;">
                        <span>Paid off</span><span>${debt.progress_percentage}%</span>
                    </div>
                    <div class="item-card-progress-track">
                        <div class="item-card-progress-fill" style="width:${debt.progress_percentage}%"></div>
                    </div>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
                <div class="item-card-amount">${Utils.formatCurrency(debt.monthly_emi)}<span style="font-size:10px;color:#64748b;font-weight:400;">/mo</span></div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">₹${debt.outstanding_principal.toLocaleString('en-IN')} left</div>
                <div class="item-card-actions" style="margin-top:10px;">
                    <button onclick="settingsManager.deleteDebt(${debt.id})" class="btn-danger-ghost">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

export function showAddDebtModal(manager) {
    const modalHtml = `
<div class="dark-modal-bg" id="add-debt-modal">
    <div class="dark-modal">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="dark-modal-title">Add New Debt</h3>
                    <button onclick="settingsManager.closeModal('add-debt-modal')" 
                            class="text-gray-500 hover:text-gray-700 text-2xl" style="margin-top:-24px;">
                        ×
                    </button>
                </div>
                
                <form id="add-debt-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="dark-label">Debt Name *</label>
                            <input type="text" id="debt-name" class="dark-input" placeholder="HDFC Home Loan" required>
                        </div>
                        <div>
                            <label class="dark-label">Debt Type *</label>
                            <select id="debt-type" class="dark-input" required>
                                <option value="home_loan">Home Loan</option>
                                <option value="car_loan">Car Loan</option>
                                <option value="personal_loan">Personal Loan</option>
                                <option value="credit_card">Credit Card EMI</option>
                                <option value="education">Education Loan</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="dark-label">Outstanding Principal (₹) *</label>
                            <input type="number" id="principal" class="dark-input" placeholder="2500000" required>
                        </div>
                        <div>
                            <label class="dark-label">Monthly EMI (₹) *</label>
                            <input type="number" id="emi" class="dark-input" placeholder="25000" required>
                        </div>
                        <div>
                            <label class="dark-label">Interest Rate (% p.a.) *</label>
                            <input type="number" id="interest" class="dark-input" step="0.1" placeholder="8.5" required>
                        </div>
                        <div>
                            <label class="dark-label">Remaining Tenure (Months) *</label>
                            <input type="number" id="tenure" class="dark-input" placeholder="120" required>
                        </div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button type="button" onclick="settingsManager.closeModal('add-debt-modal')"
                                class="btn-ghost" style="flex:1;">
                            Cancel
                        </button>
                        <button type="submit" class="glow-button" style="flex:1;">
                            Add Debt
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('add-debt-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveDebt(manager);
    });
}

export async function saveDebt(manager) {
    const outstanding = parseFloat(document.getElementById('principal').value);
    const emi = parseFloat(document.getElementById('emi').value);
    const rate = parseFloat(document.getElementById('interest').value);
    const remaining = parseInt(document.getElementById('tenure').value);

    const data = {
        debt_name: document.getElementById('debt-name').value,
        debt_type: document.getElementById('debt-type').value,
        total_principal: outstanding,          // use outstanding as total too
        outstanding_principal: outstanding,
        monthly_emi: emi,
        interest_rate: rate,
        tenure_months: remaining,
        remaining_months: remaining,
        start_date: new Date().toISOString().split('T')[0]
    };

    const validation = Validation.validateDebt(data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'danger');
        return;
    }

    try {
        await api.createDebt(data);
        Utils.showToast('✅ Debt added successfully!', 'success');
        manager.closeModal('add-debt-modal');
        await loadDebtsTab(manager);
    } catch (error) {
        console.error('Error saving debt:', error);
        Utils.showToast('Failed to save debt', 'danger');
    }
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

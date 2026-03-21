/**
 * Settings - Income Tab
 * Handles income profile management
 */

export async function loadIncomeTab(manager) {
    const container = document.getElementById('settings-content-income');
    Utils.showLoading('settings-content-income');

    try {
        manager.data.income = await api.getIncomeProfile();

        container.innerHTML = `
    <div class="settings-block">
        <p class="settings-block-title">Income Configuration</p>
        <form id="income-form">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
                <div>
                    <label class="dark-label">Gross Monthly Salary (₹) *</label>
                    <input type="number" id="gross-salary" class="dark-input"
                           value="${manager.data.income.gross_monthly_salary || ''}"
                           placeholder="100000" required>
                </div>
                <div>
                    <label class="dark-label">Income Type *</label>
                    <select id="income-type" class="dark-select" required>
                        <option value="salaried"     ${manager.data.income.income_type === 'salaried'      ? 'selected' : ''}>Salaried</option>
                        <option value="self_employed"${manager.data.income.income_type === 'self_employed' ? 'selected' : ''}>Self Employed</option>
                        <option value="business"     ${manager.data.income.income_type === 'business'      ? 'selected' : ''}>Business</option>
                        <option value="freelance"    ${manager.data.income.income_type === 'freelance'     ? 'selected' : ''}>Freelance</option>
                    </select>
                </div>
                <div>
                    <label class="dark-label">State / Region *</label>
                    <select id="state" class="dark-select" required>
                        <option value="">Select State</option>
                        <option value="Maharashtra" ${manager.data.income.state === 'Maharashtra' ? 'selected':''}>Maharashtra</option>
                        <option value="Karnataka"   ${manager.data.income.state === 'Karnataka'   ? 'selected':''}>Karnataka</option>
                        <option value="Delhi"       ${manager.data.income.state === 'Delhi'       ? 'selected':''}>Delhi</option>
                        <option value="Tamil Nadu"  ${manager.data.income.state === 'Tamil Nadu'  ? 'selected':''}>Tamil Nadu</option>
                        <option value="Gujarat"     ${manager.data.income.state === 'Gujarat'     ? 'selected':''}>Gujarat</option>
                        <option value="West Bengal" ${manager.data.income.state === 'West Bengal' ? 'selected':''}>West Bengal</option>
                    </select>
                </div>
            </div>
            <button type="submit" class="glow-button">Save Income Profile</button>
        </form>
    </div>

    <div class="settings-block">
        <p class="settings-block-title">Income Breakdown</p>
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px;">
            <div><p class="dark-label">Gross</p><p style="font-size:18px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:#f1f5f9;" id="calc-gross">${Utils.formatCurrency(manager.data.income.gross_monthly_salary||0)}</p></div>
            <div><p class="dark-label">Tax</p><p style="font-size:18px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:#f87171;" id="calc-tax">-${Utils.formatCurrency(manager.data.income.tax_amount||0)}</p></div>
            <div><p class="dark-label">PF</p><p style="font-size:18px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:#fbbf24;" id="calc-pf">-${Utils.formatCurrency(manager.data.income.pf_amount||0)}</p></div>
            <div><p class="dark-label">Net Take-Home</p><p style="font-size:18px;font-weight:700;font-family:'IBM Plex Mono',monospace;color:#34d399;" id="calc-net">${Utils.formatCurrency(manager.data.income.net_monthly_income||0)}</p></div>
        </div>
    </div>

    <div class="settings-block">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <p class="settings-block-title" style="margin-bottom:0;border:none;padding:0;">Additional Income</p>
            <button type="button" onclick="settingsManager.addAdditionalIncome()" class="btn-ghost">+ Add Source</button>
        </div>
        <div id="additional-incomes-list">${renderAdditionalIncomes(manager)}</div>
    </div>
`;

        document.getElementById('income-form').addEventListener('submit', (e) => {
            e.preventDefault();
            saveIncome(manager);
        });

    } catch (error) {
        console.error('Error loading income tab:', error);
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <p class="text-red-700 font-semibold">Failed to load income data</p>
                <p class="text-sm text-red-600 mt-2">${error.message}</p>
                <button onclick="settingsManager.loadTabData('income')" 
                        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    Retry
                </button>
            </div>
        `;
    }
}

export function renderAdditionalIncomes(manager) {
    if (!manager.data.income.additional_incomes || manager.data.income.additional_incomes.length === 0) {
        return '<p style="font-size:13px; color:#64748b;">No additional income sources</p>';
    }
    return manager.data.income.additional_incomes.map((income, index) => `
        <div class="item-card" style="margin-bottom:8px;">
            <div style="flex:1;">
                <p style="font-size:13px; font-weight:600; color:#f1f5f9;">${income.source_name}</p>
                <p style="font-size:12px; color:#64748b;">${Utils.formatCurrency(income.monthly_amount)}/month · ${income.is_recurring ? 'Recurring' : 'One-time'}</p>
            </div>
            <button type="button" onclick="settingsManager.removeAdditionalIncome(${index})"
                    class="btn-danger-ghost" style="font-size:11px; padding:4px 10px;">Remove</button>
        </div>
    `).join('');
}

export function addAdditionalIncome(manager) {
    const modalHtml = `
    <div class="dark-modal-bg" id="add-income-modal">
        <div class="dark-modal">
            <h3 class="dark-modal-title">Add Additional Income</h3>
            <form id="add-income-form">
                <div style="margin-bottom:16px;">
                    <label class="dark-label">Source Name *</label>
                    <input type="text" id="income-source-name" class="dark-input"
                           placeholder="e.g., Rental Income, Freelance" required>
                </div>
                <div style="margin-bottom:16px;">
                    <label class="dark-label">Monthly Amount (₹) *</label>
                    <input type="number" id="income-source-amount" class="dark-input"
                           placeholder="15000" required>
                </div>
                <div style="margin-bottom:20px;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" id="income-source-recurring" checked
                               style="width:16px; height:16px; accent-color:#818cf8;">
                        <span style="font-size:13px; color:#94a3b8;">Recurring income</span>
                    </label>
                </div>
                <div style="display:flex; gap:10px;">
                    <button type="button" onclick="settingsManager.closeModal('add-income-modal')"
                            class="btn-ghost" style="flex:1;">Cancel</button>
                    <button type="submit" class="glow-button" style="flex:1;">Add</button>
                </div>
            </form>
        </div>
    </div>
`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    document.getElementById('add-income-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const newIncome = {
            source_name: document.getElementById('income-source-name').value,
            monthly_amount: parseFloat(document.getElementById('income-source-amount').value),
            is_recurring: document.getElementById('income-source-recurring').checked
        };

        if (!manager.data.income.additional_incomes) {
            manager.data.income.additional_incomes = [];
        }

        manager.data.income.additional_incomes.push(newIncome);
        manager.closeModal('add-income-modal');
        loadIncomeTab(manager);
    });
}

export function removeAdditionalIncome(manager, index) {
    if (confirm('Remove this income source?')) {
        manager.data.income.additional_incomes.splice(index, 1);
        loadIncomeTab(manager);
    }
}

export async function saveIncome(manager) {
    const data = {
        gross_monthly_salary: parseFloat(document.getElementById('gross-salary').value),
        income_type: document.getElementById('income-type').value,
        state: document.getElementById('state').value,
        additional_incomes: manager.data.income.additional_incomes || []
    };

    const validation = Validation.validateIncome(data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'danger');
        return;
    }

    try {
        const result = await api.updateIncomeProfile(data);

        const breakdown = result.income_breakdown;
        Utils.setText('calc-gross', Utils.formatCurrency(breakdown.gross_monthly, false));
        Utils.setText('calc-tax', Utils.formatCurrency(breakdown.tax_monthly, false));
        Utils.setText('calc-pf', Utils.formatCurrency(breakdown.pf_monthly, false));
        Utils.setText('calc-net', Utils.formatCurrency(breakdown.net_monthly, false));

        Utils.showToast('✅ Income profile saved successfully!', 'success');

    } catch (error) {
        console.error('Error saving income:', error);
        Utils.showToast('Failed to save income profile', 'danger');
    }
}

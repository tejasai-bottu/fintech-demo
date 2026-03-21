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
            <div style="background:white; border-radius:6px; padding:28px; 
                        max-width:900px; box-shadow:0 1px 3px rgba(0,0,0,0.08); 
                        border:1px solid #e8eaed;">
                <h2 style="font-size:15px; font-weight:700; color:#1f4e79; margin-bottom:20px; 
                           padding-bottom:12px; border-bottom:1px solid #f0f0f0; 
                           text-transform:uppercase; letter-spacing:0.5px;">
                    Income Configuration
                </h2>
                
                <form id="income-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        
                        <!-- Gross Salary -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">
                                Gross Monthly Salary (₹) <span class="text-red-500">*</span>
                            </label>
                            <input type="number" 
                                   id="gross-salary" 
                                   value="${manager.data.income.gross_monthly_salary || ''}"
                                   class="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none" 
                                   placeholder="100000"
                                   required>
                            <p class="text-xs text-gray-500 mt-1">Your monthly salary before deductions</p>
                        </div>
                        
                        <!-- Income Type -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">
                                Income Type <span class="text-red-500">*</span>
                            </label>
                            <select id="income-type" 
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                                    required>
                                <option value="salaried" ${manager.data.income.income_type === 'salaried' ? 'selected' : ''}>Salaried</option>
                                <option value="self_employed" ${manager.data.income.income_type === 'self_employed' ? 'selected' : ''}>Self Employed</option>
                                <option value="business" ${manager.data.income.income_type === 'business' ? 'selected' : ''}>Business</option>
                                <option value="freelance" ${manager.data.income.income_type === 'freelance' ? 'selected' : ''}>Freelance</option>
                            </select>
                        </div>
                        
                        <!-- State -->
                        <div>
                            <label class="block text-sm font-semibold mb-2">
                                State/Region <span class="text-red-500">*</span>
                            </label>
                            <select id="state" 
                                    class="w-full px-4 py-3 border-2 rounded-lg focus:border-blue-500 focus:outline-none"
                                    required>
                                <option value="">Select State</option>
                                <option value="Maharashtra" ${manager.data.income.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                                <option value="Karnataka" ${manager.data.income.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                                <option value="Delhi" ${manager.data.income.state === 'Delhi' ? 'selected' : ''}>Delhi</option>
                                <option value="Tamil Nadu" ${manager.data.income.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
                                <option value="Gujarat" ${manager.data.income.state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
                                <option value="West Bengal" ${manager.data.income.state === 'West Bengal' ? 'selected' : ''}>West Bengal</option>
                            </select>
                            <p class="text-xs text-gray-500 mt-1">For tax calculation purposes</p>
                        </div>
                        
                    </div>
                    
                    <!-- Additional Income Sources -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <label class="block text-sm font-semibold">
                                Additional Income Sources
                            </label>
                            <button type="button" 
                                    onclick="settingsManager.addAdditionalIncome()"
                                    class="text-sm text-blue-600 hover:underline">
                                + Add Source
                            </button>
                        </div>
                        <div id="additional-incomes-list" class="space-y-2">
                            ${renderAdditionalIncomes(manager)}
                        </div>
                    </div>
                    
                    <!-- Tax Calculation Display -->
                    <div style="background:#f4f6f9; padding:20px; border-radius:6px; 
                                margin-bottom:20px; border:1px solid #e8eaed;">
                        <h3 style="font-size:12px; font-weight:700; color:#888; margin-bottom:16px; 
                                   text-transform:uppercase; letter-spacing:0.5px;">
                            Income Breakdown — Auto Calculated
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p class="text-sm text-gray-600">Gross Income</p>
                                <p class="text-xl font-bold" id="calc-gross">${Utils.formatCurrency(manager.data.income.gross_monthly_salary || 0)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Income Tax</p>
                                <p class="text-xl font-bold text-red-600" id="calc-tax">-${Utils.formatCurrency(manager.data.income.tax_amount || 0)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">PF Deduction</p>
                                <p class="text-xl font-bold text-orange-600" id="calc-pf">-${Utils.formatCurrency(manager.data.income.pf_amount || 0)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Net Take-Home</p>
                                <p class="text-xl font-bold text-green-600" id="calc-net">${Utils.formatCurrency(manager.data.income.net_monthly_income || 0)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Submit Button -->
                    <button type="submit" 
                            style="padding:10px 28px; background:#1f4e79; color:white; border:none; 
                                   border-radius:4px; font-size:13px; font-weight:600; cursor:pointer; 
                                   letter-spacing:0.3px;">
                        Save Income Profile
                    </button>
                </form>
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
        return '<p class="text-sm text-gray-500">No additional income sources</p>';
    }

    return manager.data.income.additional_incomes.map((income, index) => `
        <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <div class="flex-1">
                <p class="font-semibold">${income.source_name}</p>
                <p class="text-sm text-gray-600">${Utils.formatCurrency(income.monthly_amount)}/month ${income.is_recurring ? '(Recurring)' : '(One-time)'}</p>
            </div>
            <button type="button" 
                    onclick="settingsManager.removeAdditionalIncome(${index})"
                    class="text-red-600 hover:underline text-sm">
                Remove
            </button>
        </div>
    `).join('');
}

export function addAdditionalIncome(manager) {
    const modalHtml = `
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="add-income-modal">
            <div style="background:white; border-radius:6px; padding:28px; 
                        max-width:600px; width:100%; margin:16px; 
                        box-shadow:0 4px 20px rgba(0,0,0,0.15);">
                <h3 style="font-size:16px; font-weight:700; color:#1f4e79; margin-bottom:16px;">Add Additional Income</h3>
                <form id="add-income-form">
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-2">Source Name</label>
                        <input type="text" id="income-source-name" 
                               class="w-full px-4 py-2 border-2 rounded-lg" 
                               placeholder="e.g., Rental Income, Freelance" required>
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-semibold mb-2">Monthly Amount (₹)</label>
                        <input type="number" id="income-source-amount" 
                               class="w-full px-4 py-2 border-2 rounded-lg" 
                               placeholder="15000" required>
                    </div>
                    <div class="mb-4">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" id="income-source-recurring" checked>
                            <span class="text-sm">Recurring income</span>
                        </label>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" onclick="settingsManager.closeModal('add-income-modal')"
                                style="flex:1; padding:10px; background:white; color:#555; 
                                       border:1px solid #ddd; border-radius:4px; font-size:13px; 
                                       font-weight:600; cursor:pointer;">
                            Cancel
                        </button>
                        <button type="submit"
                                style="flex:1; padding:10px; background:#1f4e79; color:white; border:none; 
                                       border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                            Add
                        </button>
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

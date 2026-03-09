/**
 * Settings Page Logic - COMPLETE
 * Handles all settings tabs and user profile management
 */

class SettingsManager {
    constructor() {
        this.currentTab = 'income';
        this.data = {};
        this.modals = {};
        this.init();
    }
    
    async init() {
        // Load initial tab
        await this.switchTab('income');
    }
    
    // ========================================
    // TAB MANAGEMENT
    // ========================================
    
    /**
     * Switch between tabs
     */
    async switchTab(tabName) {
        // Hide all content
        document.querySelectorAll('.settings-content').forEach(content => {
            content.classList.add('hidden');
        });
        
        // Remove active from all tabs
        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected content
        const selectedContent = document.getElementById(`settings-content-${tabName}`);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }
        
        const selectedTab = document.getElementById(`settings-tab-${tabName}`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Load tab data
        await this.loadTabData(tabName);
    }
    
    /**
     * Load data for specific tab
     */
    async loadTabData(tabName) {
        try {
            switch(tabName) {
                case 'income':
                    await this.loadIncomeTab();
                    break;
                case 'debts':
                    await this.loadDebtsTab();
                    break;
                case 'goals':
                    await this.loadGoalsTab();
                    break;
                case 'expenses':
                    await this.loadExpensesTab();
                    break;
                case 'bills':
                    await this.loadBillsTab();
                    break;
                case 'overview':
                    await this.loadOverviewTab();
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName} tab:`, error);
            Utils.showToast(`Failed to load ${tabName} data`, 'danger');
        }
    }
    
    // ========================================
    // INCOME TAB
    // ========================================
    
    /**
     * Load Income Tab
     */
    async loadIncomeTab() {
        const container = document.getElementById('settings-content-income');
        Utils.showLoading('settings-content-income');
        
        try {
            this.data.income = await api.getIncomeProfile();
            
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
                                       value="${this.data.income.gross_monthly_salary || ''}"
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
                                    <option value="salaried" ${this.data.income.income_type === 'salaried' ? 'selected' : ''}>Salaried</option>
                                    <option value="self_employed" ${this.data.income.income_type === 'self_employed' ? 'selected' : ''}>Self Employed</option>
                                    <option value="business" ${this.data.income.income_type === 'business' ? 'selected' : ''}>Business</option>
                                    <option value="freelance" ${this.data.income.income_type === 'freelance' ? 'selected' : ''}>Freelance</option>
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
                                    <option value="Maharashtra" ${this.data.income.state === 'Maharashtra' ? 'selected' : ''}>Maharashtra</option>
                                    <option value="Karnataka" ${this.data.income.state === 'Karnataka' ? 'selected' : ''}>Karnataka</option>
                                    <option value="Delhi" ${this.data.income.state === 'Delhi' ? 'selected' : ''}>Delhi</option>
                                    <option value="Tamil Nadu" ${this.data.income.state === 'Tamil Nadu' ? 'selected' : ''}>Tamil Nadu</option>
                                    <option value="Gujarat" ${this.data.income.state === 'Gujarat' ? 'selected' : ''}>Gujarat</option>
                                    <option value="West Bengal" ${this.data.income.state === 'West Bengal' ? 'selected' : ''}>West Bengal</option>
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
                                ${this.renderAdditionalIncomes()}
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
                                    <p class="text-xl font-bold" id="calc-gross">${Utils.formatCurrency(this.data.income.gross_monthly_salary || 0)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Income Tax</p>
                                    <p class="text-xl font-bold text-red-600" id="calc-tax">-${Utils.formatCurrency(this.data.income.tax_amount || 0)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">PF Deduction</p>
                                    <p class="text-xl font-bold text-orange-600" id="calc-pf">-${Utils.formatCurrency(this.data.income.pf_amount || 0)}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">Net Take-Home</p>
                                    <p class="text-xl font-bold text-green-600" id="calc-net">${Utils.formatCurrency(this.data.income.net_monthly_income || 0)}</p>
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
            
            // Attach form handler
            document.getElementById('income-form').addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveIncome();
            });
            
        } catch (error) {
            console.error('Error loading income tab:', error);
            container.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <p class="text-red-700 font-semibold">Failed to load income data</p>
                    <p class="text-sm text-red-600 mt-2">${error.message}</p>
                    <button onclick="settingsManager.loadIncomeTab()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Render additional income sources
     */
    renderAdditionalIncomes() {
        if (!this.data.income.additional_incomes || this.data.income.additional_incomes.length === 0) {
            return '<p class="text-sm text-gray-500">No additional income sources</p>';
        }
        
        return this.data.income.additional_incomes.map((income, index) => `
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
    
    /**
     * Add additional income source
     */
    addAdditionalIncome() {
        // Show modal for adding additional income
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
            
            if (!this.data.income.additional_incomes) {
                this.data.income.additional_incomes = [];
            }
            
            this.data.income.additional_incomes.push(newIncome);
            this.closeModal('add-income-modal');
            this.loadIncomeTab(); // Reload to show new income
        });
    }
    
    /**
     * Remove additional income
     */
    removeAdditionalIncome(index) {
        if (confirm('Remove this income source?')) {
            this.data.income.additional_incomes.splice(index, 1);
            this.loadIncomeTab();
        }
    }
    
    /**
     * Save income profile
     */
    async saveIncome() {
        const data = {
            gross_monthly_salary: parseFloat(document.getElementById('gross-salary').value),
            income_type: document.getElementById('income-type').value,
            state: document.getElementById('state').value,
            additional_incomes: this.data.income.additional_incomes || []
        };
        
        // Validate
        const validation = Validation.validateIncome(data);
        if (!validation.valid) {
            Utils.showToast(validation.errors[0], 'danger');
            return;
        }
        
        try {
            const result = await api.updateIncomeProfile(data);
            
            // Update display
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
    
    // ========================================
    // DEBTS TAB
    // ========================================
    
    /**
     * Load Debts Tab
     */
    async loadDebtsTab() {
        const container = document.getElementById('settings-content-debts');
        Utils.showLoading('settings-content-debts');
        
        try {
            this.data.debts = await api.getDebts();
            
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
                        ${this.renderDebtsList()}
                    </div>
                    
                    <!-- Portfolio Summary -->
                    <div style="background:#1f4e79; color:white; padding:20px; 
                                border-radius:6px; margin-top:8px;">
                        <h3 class="font-bold mb-4">📊 Portfolio Summary</h3>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm opacity-90">Total Debts</p>
                                <p class="text-3xl font-bold">${this.data.debts.summary.total_debts}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Monthly EMI</p>
                                <p class="text-3xl font-bold">${Utils.formatCurrency(this.data.debts.summary.total_emi)}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">DTI Ratio</p>
                                <p class="text-3xl font-bold">${this.data.debts.summary.dti_ratio.ratio}%</p>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                            <p class="text-sm font-semibold">${this.data.debts.summary.dti_ratio.status}</p>
                            <p class="text-xs opacity-90 mt-1">${this.data.debts.summary.dti_ratio.message}</p>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading debts tab:', error);
            container.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <p class="text-red-700 font-semibold">Failed to load debts</p>
                    <button onclick="settingsManager.loadDebtsTab()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Render debts list
     */
    renderDebtsList() {
        if (!this.data.debts.debts || this.data.debts.debts.length === 0) {
            return `
                <div class="text-center py-12">
                    <p class="text-6xl mb-4">💳</p>
                    <p class="text-gray-500">No debts added yet</p>
                    <p class="text-sm text-gray-400">Click "Add New Debt" to get started</p>
                </div>
            `;
        }
        
        return this.data.debts.debts.map(debt => `
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
    
    /**
     * Show add debt modal
     */
    showAddDebtModal() {
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
        
        // Set default date to today
        document.getElementById('debt-start-date').valueAsDate = new Date();
        
        document.getElementById('add-debt-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveDebt();
        });
    }
    
    /**
     * Calculate EMI preview in modal
     */
    async calculateEMIPreview() {
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
    
    /**
     * Save new debt
     */
    async saveDebt() {
        // Get EMI from preview or calculate
        let emi = 0;
        const emiPreview = document.getElementById('emi-preview-amount').textContent;
        if (emiPreview && emiPreview !== '₹0') {
            emi = parseFloat(emiPreview.replace('₹', '').replace(/,/g, ''));
        } else {
            // Calculate EMI
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
        
        // Validate
        const validation = Validation.validateDebt(data);
        if (!validation.valid) {
            Utils.showToast(validation.errors[0], 'danger');
            return;
        }
        
        try {
            const result = await api.createDebt(data);
            
            // Check DTI warning
            if (result.portfolio_summary.dti_ratio.severity === 'danger' || 
                result.portfolio_summary.dti_ratio.severity === 'critical') {
                this.showDTIWarning(result.portfolio_summary.dti_ratio);
            }
            
            Utils.showToast('✅ Debt added successfully!', 'success');
            this.closeModal('add-debt-modal');
            await this.loadDebtsTab();
            
        } catch (error) {
            console.error('Error saving debt:', error);
            Utils.showToast('Failed to save debt', 'danger');
        }
    }
    
    /**
     * Show DTI warning modal
     */
    showDTIWarning(dtiInfo) {
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
    
    /**
     * Delete debt
     */
    async deleteDebt(debtId) {
        if (!confirm('Are you sure you want to delete this debt?')) {
            return;
        }
        
        try {
            await api.deleteDebt(debtId);
            Utils.showToast('✅ Debt deleted successfully', 'success');
            await this.loadDebtsTab();
        } catch (error) {
            console.error('Error deleting debt:', error);
            Utils.showToast('Failed to delete debt', 'danger');
        }
    }
    
    // ========================================
    // SAVINGS GOALS TAB
    // ========================================
    
    /**
     * Load Savings Goals Tab
     */
    async loadGoalsTab() {
        const container = document.getElementById('settings-content-goals');
        Utils.showLoading('settings-content-goals');
        
        try {
            this.data.goals = await api.getSavingsGoals();
            
            container.innerHTML = `
                <div style="background:white; border-radius:6px; padding:28px; 
                            box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                    <div class="flex justify-between items-center mb-6">
                        <h2 style="font-size:15px; font-weight:700; color:#1f4e79; 
                                   text-transform:uppercase; letter-spacing:0.5px;">
                            Savings Goals
                        </h2>
                        <button onclick="settingsManager.showAddGoalModal()" 
                                style="padding:8px 20px; background:#1f4e79; color:white; border:none; 
                                       border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                            + Add New Goal
                        </button>
                    </div>
                    
                    <!-- Goals List -->
                    <div id="goals-list" class="space-y-4 mb-8">
                        ${this.renderGoalsList()}
                    </div>
                    
                    <!-- Summary -->
                    <div style="background:#1f4e79; color:white; padding:20px; border-radius:6px;">
                        <h3 class="font-bold mb-4">📊 Goals Summary</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-sm opacity-90">Active Goals</p>
                                <p class="text-3xl font-bold">${this.data.goals.summary.total_goals}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Monthly Contribution Needed</p>
                                <p class="text-3xl font-bold">${Utils.formatCurrency(this.data.goals.summary.total_monthly_contribution_needed)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading goals tab:', error);
            container.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <p class="text-red-700 font-semibold">Failed to load goals</p>
                    <button onclick="settingsManager.loadGoalsTab()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Render goals list
     */
    renderGoalsList() {
        if (!this.data.goals.goals || this.data.goals.goals.length === 0) {
            return `
                <div class="text-center py-12">
                    <p class="text-6xl mb-4">🎯</p>
                    <p class="text-gray-500">No savings goals yet</p>
                    <p class="text-sm text-gray-400">Click "Add New Goal" to get started</p>
                </div>
            `;
        }
        
        return this.data.goals.goals.map(goal => `
            <div class="border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-bold">${goal.goal_name}</h3>
                        <p class="text-sm text-gray-600 capitalize">${goal.goal_type.replace('_', ' ')} • ${goal.priority} priority</p>
                    </div>
                    <button onclick="settingsManager.deleteGoal(${goal.id})" 
                            class="text-red-600 hover:underline text-sm">
                        🗑️ Delete
                    </button>
                </div>
                
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <p class="text-xs text-gray-600">Target Amount</p>
                        <p class="text-lg font-bold">${Utils.formatCurrency(goal.target_amount)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600">Current Saved</p>
                        <p class="text-lg font-bold text-green-600">${Utils.formatCurrency(goal.current_saved)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600">Monthly Needed</p>
                        <p class="text-lg font-bold text-blue-600">${Utils.formatCurrency(goal.monthly_contribution_needed)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-gray-600">Target Date</p>
                        <p class="text-lg font-bold">${Utils.formatDate(goal.target_date)}</p>
                    </div>
                </div>
                
                <!-- Progress Bar -->
                <div class="mb-2">
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-600">Progress</span>
                        <span class="font-semibold">${goal.progress_percentage}% complete</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-blue-500 h-2 rounded-full transition-all" 
                             style="width: ${goal.progress_percentage}%"></div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    /**
     * Show add goal modal
     */
    showAddGoalModal() {
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" id="add-goal-modal">
                <div style="background:white; border-radius:6px; padding:28px; 
                            max-width:600px; width:100%; margin:16px; 
                            box-shadow:0 4px 20px rgba(0,0,0,0.15);">
                    <div class="flex justify-between items-center mb-6">
                        <h3 style="font-size:16px; font-weight:700; color:#1f4e79;">Add Savings Goal</h3>
                        <button onclick="settingsManager.closeModal('add-goal-modal')" 
                                class="text-gray-500 hover:text-gray-700 text-2xl">
                            ×
                        </button>
                    </div>
                    
                    <form id="add-goal-form">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            
                            <!-- Goal Name -->
                            <div class="col-span-2">
                                <label class="block text-sm font-semibold mb-2">Goal Name *</label>
                                <input type="text" id="goal-name" 
                                       class="w-full px-4 py-2 border-2 rounded-lg" 
                                       placeholder="e.g., Emergency Fund, Vacation" required>
                            </div>
                            
                            <!-- Target Amount -->
                            <div>
                                <label class="block text-sm font-semibold mb-2">Target Amount (₹) *</label>
                                <input type="number" id="goal-target" 
                                       class="w-full px-4 py-2 border-2 rounded-lg" 
                                       placeholder="240000" required>
                            </div>
                            
                            <!-- Current Saved -->
                            <div>
                                <label class="block text-sm font-semibold mb-2">Current Saved (₹)</label>
                                <input type="number" id="goal-current" 
                                       class="w-full px-4 py-2 border-2 rounded-lg" 
                                       placeholder="50000" value="0">
                            </div>
                            
                            <!-- Target Date -->
                            <div>
                                <label class="block text-sm font-semibold mb-2">Target Date *</label>
                                <input type="date" id="goal-date" 
                                       class="w-full px-4 py-2 border-2 rounded-lg" required>
                            </div>
                            
                            <!-- Priority -->
                            <div>
                                <label class="block text-sm font-semibold mb-2">Priority *</label>
                                <select id="goal-priority" class="w-full px-4 py-2 border-2 rounded-lg" required>
                                    <option value="">Select Priority</option>
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            
                            <!-- Goal Type (Auto-calculated but can override) -->
                            <div class="col-span-2">
                                <label class="block text-sm font-semibold mb-2">Goal Type</label>
                                <select id="goal-type" class="w-full px-4 py-2 border-2 rounded-lg">
                                    <option value="short_term">Short-term (&lt;1 year)</option>
                                    <option value="medium_term">Medium-term (1-5 years)</option>
                                    <option value="long_term">Long-term (&gt;5 years)</option>
                                </select>
                            </div>
                            
                        </div>
                        
                        <!-- Preview -->
                        <div id="goal-preview" class="hidden mb-6 p-4 bg-blue-50 rounded-lg">
                            <p class="text-sm text-gray-600 mb-1">Monthly Contribution Needed</p>
                            <p class="text-2xl font-bold text-blue-600" id="goal-preview-amount">₹0</p>
                            <p class="text-xs text-gray-500 mt-2" id="goal-preview-months">0 months</p>
                        </div>
                        
                        <!-- Submit Buttons -->
                        <div class="flex gap-3">
                            <button type="button" 
                                    onclick="settingsManager.closeModal('add-goal-modal')"
                                    style="flex:1; padding:10px; background:white; color:#555; 
                                           border:1px solid #ddd; border-radius:4px; font-size:13px; 
                                           font-weight:600; cursor:pointer;">
                                Cancel
                            </button>
                            <button type="submit"
                                    style="flex:1; padding:10px; background:#1f4e79; color:white; border:none; 
                                           border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                                Add Goal
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Set minimum date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        document.getElementById('goal-date').min = tomorrow.toISOString().split('T')[0];
        
        // Add preview calculation on input
        const targetInput = document.getElementById('goal-target');
        const currentInput = document.getElementById('goal-current');
        const dateInput = document.getElementById('goal-date');
        
        const updatePreview = Utils.debounce(() => {
            const target = parseFloat(targetInput.value) || 0;
            const current = parseFloat(currentInput.value) || 0;
            const targetDate = new Date(dateInput.value);
            const today = new Date();
            
            if (target > 0 && targetDate > today) {
                const months = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24 * 30));
                const needed = (target - current) / months;
                
                document.getElementById('goal-preview').classList.remove('hidden');
                document.getElementById('goal-preview-amount').textContent = Utils.formatCurrency(needed);
                document.getElementById('goal-preview-months').textContent = `Over ${months} months`;
            }
        }, 500);
        
        targetInput.addEventListener('input', updatePreview);
        currentInput.addEventListener('input', updatePreview);
        dateInput.addEventListener('change', updatePreview);
        
        document.getElementById('add-goal-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });
    }
    
    /**
     * Save new goal
     */
    async saveGoal() {
        const data = {
            goal_name: document.getElementById('goal-name').value,
            target_amount: parseFloat(document.getElementById('goal-target').value),
            current_saved: parseFloat(document.getElementById('goal-current').value) || 0,
            target_date: document.getElementById('goal-date').value,
            priority: document.getElementById('goal-priority').value,
            goal_type: document.getElementById('goal-type').value
        };
        
        // Validate
        const validation = Validation.validateSavingsGoal(data);
        if (!validation.valid) {
            Utils.showToast(validation.errors[0], 'danger');
            return;
        }
        
        try {
            const result = await api.createSavingsGoal(data);
            
            // Check feasibility
            if (result.feasibility_check && !result.feasibility_check.feasible) {
                this.showFeasibilityWarning(result.feasibility_check);
            }
            
            Utils.showToast('✅ Goal added successfully!', 'success');
            this.closeModal('add-goal-modal');
            await this.loadGoalsTab();
            
        } catch (error) {
            console.error('Error saving goal:', error);
            Utils.showToast('Failed to save goal', 'danger');
        }
    }
    
    /**
     * Show feasibility warning modal
     */
    showFeasibilityWarning(feasibility) {
        const warningHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="feasibility-warning-modal">
                <div style="background:white; border-radius:6px; padding:28px; 
                            max-width:600px; width:100%; margin:16px; 
                            box-shadow:0 4px 20px rgba(0,0,0,0.15);">
                    <div class="text-center mb-6">
                        <span class="text-6xl">⚠️</span>
                        <h3 style="font-size:16px; font-weight:700; color:#1f4e79; margin-top:16px;">Goal May Not Be Feasible</h3>
                    </div>
                    
                    <div class="bg-yellow-50 p-4 rounded-lg mb-6">
                        <p class="text-sm font-semibold text-yellow-700">${feasibility.message}</p>
                        ${feasibility.details && feasibility.details.shortfall ? `
                            <p class="text-sm text-yellow-600 mt-2">
                                Shortfall: ${Utils.formatCurrency(feasibility.details.shortfall)}/month
                            </p>
                        ` : ''}
                    </div>
                    
                    ${feasibility.suggestions && feasibility.suggestions.length > 0 ? `
                        <div class="mb-6">
                            <p class="font-semibold mb-2">Suggestions:</p>
                            <ul class="text-sm text-gray-700 space-y-2">
                                ${feasibility.suggestions.map(s => `
                                    <li>• ${s.description}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <button onclick="settingsManager.closeModal('feasibility-warning-modal')"
                            style="width:100%; padding:10px; background:#1f4e79; color:white; border:none; 
                                   border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                        I Understand
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', warningHtml);
    }
    
    /**
     * Delete goal
     */
    async deleteGoal(goalId) {
        if (!confirm('Are you sure you want to delete this goal?')) {
            return;
        }
        
        try {
            await api.deleteSavingsGoal(goalId);
            Utils.showToast('✅ Goal deleted successfully', 'success');
            await this.loadGoalsTab();
        } catch (error) {
            console.error('Error deleting goal:', error);
            Utils.showToast('Failed to delete goal', 'danger');
        }
    }
    
    // ========================================
    // EXPENSES TAB
    // ========================================
    
    /**
     * Load Expenses Tab
     */
    async loadExpensesTab() {
        const container = document.getElementById('settings-content-expenses');
        Utils.showLoading('settings-content-expenses');
        
        try {
            this.data.expenses = await api.getExpenseCategories();
            
            container.innerHTML = `
                <div class="bg-white rounded-xl shadow-lg p-8">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold">📊 Monthly Expenses</h2>
                        <button onclick="settingsManager.showAddExpenseModal()" 
                                class="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">
                            ➕ Add Category
                        </button>
                    </div>
                    
                    <!-- Categories List -->
                    <div id="expenses-list" class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                        ${this.renderExpensesList()}
                    </div>
                    
                    <!-- Summary -->
                    <div style="background:#1f4e79; color:white; padding:20px; border-radius:6px;">
                        <h3 class="font-bold mb-4">💰 Expense Summary</h3>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm opacity-90">Total Expenses</p>
                                <p class="text-3xl font-bold">${Utils.formatCurrency(this.data.expenses.summary.total_expenses)}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Essential</p>
                                <p class="text-3xl font-bold">${Utils.formatCurrency(this.data.expenses.summary.essential_expenses)}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Non-Essential</p>
                                <p class="text-3xl font-bold">${Utils.formatCurrency(this.data.expenses.summary.non_essential_expenses)}</p>
                            </div>
                        </div>
                        <div class="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                            <p class="text-sm font-semibold">Expense Ratio: ${this.data.expenses.summary.expense_ratio}%</p>
                        </div>
                    </div>
                    
                    ${this.renderExpenseWarnings()}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading expenses tab:', error);
            container.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <p class="text-red-700 font-semibold">Failed to load expenses</p>
                    <button onclick="settingsManager.loadExpensesTab()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Render expenses list
     */
    renderExpensesList() {
        if (!this.data.expenses.categories || this.data.expenses.categories.length === 0) {
            return `
                <div class="col-span-2 text-center py-12">
                    <p class="text-6xl mb-4">📊</p>
                    <p class="text-gray-500">No expense categories yet</p>
                    <p class="text-sm text-gray-400">Click "Add Category" to get started</p>
                </div>
            `;
        }
        
        return this.data.expenses.categories.map(cat => `
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
    
    /**
     * Render expense warnings
     */
    renderExpenseWarnings() {
        if (!this.data.expenses.analysis || !this.data.expenses.analysis.warnings || 
            this.data.expenses.analysis.warnings.length === 0) {
            return '';
        }
        
        return `
            <div class="mt-6 space-y-3">
                <h3 class="font-bold">⚠️ Warnings</h3>
                ${this.data.expenses.analysis.warnings.map(warning => `
                    <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
                        <p class="text-sm font-semibold text-yellow-700">${warning.message}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Show add expense category modal
     */
    showAddExpenseModal() {
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
            this.saveExpenseCategory();
        });
    }
    
    /**
     * Save expense category
     */
    async saveExpenseCategory() {
        const data = {
            category_name: document.getElementById('expense-category-name').value,
            monthly_amount: parseFloat(document.getElementById('expense-amount').value),
            is_essential: document.getElementById('expense-essential').checked,
            is_fixed: document.getElementById('expense-fixed').checked
        };
        
        // Validate
        const validation = Validation.validateExpenseCategory(data);
        if (!validation.valid) {
            Utils.showToast(validation.errors[0], 'danger');
            return;
        }
        
        try {
            await api.createExpenseCategory(data);
            Utils.showToast('✅ Category added successfully!', 'success');
            this.closeModal('add-expense-modal');
            await this.loadExpensesTab();
        } catch (error) {
            console.error('Error saving expense:', error);
            Utils.showToast('Failed to save expense', 'danger');
        }
    }
    
    /**
     * Delete expense category
     */
    async deleteExpenseCategory(categoryId) {
        if (!confirm('Delete this expense category?')) {
            return;
        }
        
        try {
            await api.deleteExpenseCategory(categoryId);
            Utils.showToast('✅ Category deleted', 'success');
            await this.loadExpensesTab();
        } catch (error) {
            console.error('Error deleting expense:', error);
            Utils.showToast('Failed to delete category', 'danger');
        }
    }
    
    // ========================================
    // BILLS TAB
    // ========================================

    async loadBillsTab() {
        const container = document.getElementById('settings-content-bills');
        Utils.showLoading('settings-content-bills');
        
        try {
            this.data.bills = await api.getBills();
            
            container.innerHTML = `
                <div style="background:white; border-radius:6px; padding:28px; 
                            box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                    <div class="flex justify-between items-center mb-6">
                        <h2 style="font-size:15px; font-weight:700; color:#1f4e79; 
                                   text-transform:uppercase; letter-spacing:0.5px;">
                            Bills & Credit Cards
                        </h2>
                        <button onclick="settingsManager.showAddBillModal()" 
                                style="padding:8px 20px; background:#1f4e79; color:white; border:none; 
                                       border-radius:4px; font-size:13px; font-weight:600; cursor:pointer;">
                            + Add Bill
                        </button>
                    </div>
                    
                    <div id="bills-list" class="space-y-4 mb-8">
                        ${this.renderBillsList()}
                    </div>
                    
                    <div style="background:#1f4e79; color:white; padding:20px; border-radius:6px;">
                        <h3 class="font-bold mb-4">📊 Bills Summary</h3>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm opacity-90">Total Bills</p>
                                <p class="text-3xl font-bold">${this.data.bills.summary.total_bills}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Min Due This Month</p>
                                <p class="text-3xl font-bold">₹${Math.round(this.data.bills.summary.total_minimum_due).toLocaleString('en-IN')}</p>
                            </div>
                            <div>
                                <p class="text-sm opacity-90">Overdue Bills</p>
                                <p class="text-3xl font-bold" style="color:${this.data.bills.summary.overdue_count > 0 ? '#ff6b6b' : '#69db7c'}">
                                    ${this.data.bills.summary.overdue_count}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger">Failed to load bills: ${error.message}</div>`;
        }
    }

    renderBillsList() {
        if (!this.data.bills || !this.data.bills.bills || this.data.bills.bills.length === 0) {
            return `<div class="text-center py-12">
                <p class="text-6xl mb-4">💳</p>
                <p class="text-gray-500">No bills added yet</p>
            </div>`;
        }
        
        return this.data.bills.bills.map(bill => {
            const ps = bill.payment_status;
            const statusColor = ps.status === 'overdue' ? '#c81e1e' : '#0e9f6e';
            const statusLabel = ps.status === 'overdue' 
                ? `⚠️ Overdue by ${ps.days_late} days — Penalty: ₹${ps.total_penalty}` 
                : `✓ Due in ${ps.days_until_due} days`;
            
            return `
                <div style="border:1px solid ${ps.status === 'overdue' ? '#fca5a5' : '#e8eaed'}; 
                            border-radius:6px; padding:16px; background:${ps.status === 'overdue' ? '#fff5f5' : 'white'};">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-bold">${bill.bill_name}</h4>
                            <p class="text-sm" style="color:${statusColor};">${statusLabel}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="settingsManager.showPayBillModal(${bill.id})"
                                    style="padding:6px 16px; background:#1f4e79; color:white; border:none; 
                                           border-radius:4px; font-size:12px; cursor:pointer;">
                                Pay Now
                            </button>
                            <button onclick="settingsManager.deleteBill(${bill.id})"
                                    style="padding:6px 12px; background:white; color:#c81e1e; border:1px solid #fca5a5; 
                                           border-radius:4px; font-size:12px; cursor:pointer;">
                                Delete
                            </button>
                        </div>
                    </div>
                    <div class="grid grid-cols-3 gap-3">
                        <div>
                            <p class="text-xs text-gray-500">Amount Due</p>
                            <p class="font-bold">₹${Math.round(bill.total_amount_due).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Min Due</p>
                            <p class="font-bold">₹${Math.round(bill.minimum_due).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500">Next Due</p>
                            <p class="font-bold">${bill.next_due_date ? new Date(bill.next_due_date).toLocaleDateString('en-IN') : 'N/A'}</p>
                        </div>
                    </div>
                    ${bill.credit_limit > 0 ? `
                        <div class="mt-3">
                            <div class="flex justify-between text-xs mb-1">
                                <span>Credit Used</span>
                                <span>${((bill.outstanding_balance / bill.credit_limit) * 100).toFixed(0)}% of ₹${Math.round(bill.credit_limit).toLocaleString('en-IN')}</span>
                            </div>
                            <div style="background:#f0f0f0; height:4px; border-radius:4px;">
                                <div style="background:${bill.outstanding_balance/bill.credit_limit > 0.7 ? '#c81e1e' : '#1a56db'}; 
                                            height:4px; border-radius:4px; 
                                            width:${Math.min(100,(bill.outstanding_balance/bill.credit_limit)*100).toFixed(0)}%;"></div>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
    }

    showPayBillModal(billId) {
        const bill = this.data.bills.bills.find(b => b.id === billId);
        if (!bill) return;
        
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" id="pay-bill-modal">
                <div style="background:white; border-radius:6px; padding:28px; max-width:500px; width:100%; margin:16px;">
                    <h3 style="font-size:16px; font-weight:700; color:#1f4e79; margin-bottom:16px;">
                        Pay: ${bill.bill_name}
                    </h3>
                    <div style="background:#f4f6f9; padding:12px; border-radius:4px; margin-bottom:16px;">
                        <p class="text-sm">Amount Due: <strong>₹${Math.round(bill.total_amount_due).toLocaleString('en-IN')}</strong></p>
                        <p class="text-sm">Minimum Due: <strong>₹${Math.round(bill.minimum_due).toLocaleString('en-IN')}</strong></p>
                    </div>
                    <form id="pay-bill-form">
                        <div class="mb-4">
                            <label class="block text-sm font-semibold mb-2">Payment Amount (₹) *</label>
                            <input type="number" id="pay-amount" 
                                   value="${bill.total_amount_due}"
                                   class="w-full px-4 py-2 border-2 rounded-lg" required>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-semibold mb-2">Payment Method</label>
                            <select id="pay-method" class="w-full px-4 py-2 border-2 rounded-lg">
                                <option value="upi">UPI</option>
                                <option value="net_banking">Net Banking</option>
                                <option value="debit_card">Debit Card</option>
                                <option value="auto_debit">Auto Debit</option>
                            </select>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" onclick="settingsManager.closeModal('pay-bill-modal')"
                                    style="flex:1; padding:10px; background:white; color:#555; border:1px solid #ddd; border-radius:4px; cursor:pointer;">
                                Cancel
                            </button>
                            <button type="submit"
                                    style="flex:1; padding:10px; background:#0e9f6e; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600;">
                                Confirm Payment
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('pay-bill-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await api.payBill(billId, {
                    amount_paid: parseFloat(document.getElementById('pay-amount').value),
                    payment_method: document.getElementById('pay-method').value
                });
                Utils.showToast('✅ Payment recorded successfully!', 'success');
                this.closeModal('pay-bill-modal');
                await this.loadBillsTab();
            } catch (err) {
                Utils.showToast('Failed to record payment', 'danger');
            }
        });
    }

    showAddBillModal() {
        const modalHtml = `
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" id="add-bill-modal">
                <div style="background:white; border-radius:6px; padding:28px; max-width:600px; width:100%; margin:16px;">
                    <h3 style="font-size:16px; font-weight:700; color:#1f4e79; margin-bottom:16px;">Add New Bill</h3>
                    <form id="add-bill-form">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label class="block text-sm font-semibold mb-2">Bill Name *</label>
                                <input type="text" id="bill-name" class="w-full px-4 py-2 border-2 rounded-lg" placeholder="HDFC Credit Card" required>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Bill Type *</label>
                                <select id="bill-type" class="w-full px-4 py-2 border-2 rounded-lg" required>
                                    <option value="credit_card">Credit Card</option>
                                    <option value="electricity">Electricity</option>
                                    <option value="internet">Internet</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="subscription">Subscription</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Total Amount Due (₹) *</label>
                                <input type="number" id="bill-amount" class="w-full px-4 py-2 border-2 rounded-lg" placeholder="5000" required>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Minimum Due (₹)</label>
                                <input type="number" id="bill-min-due" class="w-full px-4 py-2 border-2 rounded-lg" placeholder="500" value="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Billing Cycle Day (1-31) *</label>
                                <input type="number" id="bill-cycle-day" class="w-full px-4 py-2 border-2 rounded-lg" min="1" max="31" value="1" required>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Due Date Day (1-31) *</label>
                                <input type="number" id="bill-due-day" class="w-full px-4 py-2 border-2 rounded-lg" min="1" max="31" value="15" required>
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Interest Rate (% p.a.)</label>
                                <input type="number" id="bill-interest" class="w-full px-4 py-2 border-2 rounded-lg" step="0.1" value="0">
                            </div>
                            <div>
                                <label class="block text-sm font-semibold mb-2">Late Fee (₹)</label>
                                <input type="number" id="bill-late-fee" class="w-full px-4 py-2 border-2 rounded-lg" value="0">
                            </div>
                            <div class="col-span-2">
                                <label class="block text-sm font-semibold mb-2">Credit Limit (₹) — for Cards</label>
                                <input type="number" id="bill-credit-limit" class="w-full px-4 py-2 border-2 rounded-lg" placeholder="100000" value="0">
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <button type="button" onclick="settingsManager.closeModal('add-bill-modal')"
                                    style="flex:1; padding:10px; background:white; color:#555; border:1px solid #ddd; border-radius:4px; cursor:pointer;">
                                Cancel
                            </button>
                            <button type="submit"
                                    style="flex:1; padding:10px; background:#1f4e79; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:600;">
                                Add Bill
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('add-bill-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                bill_name: document.getElementById('bill-name').value,
                bill_type: document.getElementById('bill-type').value,
                total_amount_due: parseFloat(document.getElementById('bill-amount').value),
                minimum_due: parseFloat(document.getElementById('bill-min-due').value),
                outstanding_balance: parseFloat(document.getElementById('bill-amount').value), // Initial balance same as amount due
                credit_limit: parseFloat(document.getElementById('bill-credit-limit').value),
                billing_cycle_day: parseInt(document.getElementById('bill-cycle-day').value),
                due_date_day: parseInt(document.getElementById('bill-due-day').value),
                interest_rate: parseFloat(document.getElementById('bill-interest').value),
                late_fee: parseFloat(document.getElementById('bill-late-fee').value)
            };
            
            try {
                await api.createBill(data);
                Utils.showToast('✅ Bill added successfully!', 'success');
                this.closeModal('add-bill-modal');
                await this.loadBillsTab();
            } catch (err) {
                Utils.showToast('Failed to add bill', 'danger');
            }
        });
    }

    async deleteBill(billId) {
        if (!confirm('Are you sure you want to deactivate this bill?')) return;
        try {
            await api.deleteBill(billId);
            Utils.showToast('✅ Bill deactivated', 'success');
            await this.loadBillsTab();
        } catch (err) {
            Utils.showToast('Failed to delete bill', 'danger');
        }
    }
    
    // ========================================
    // OVERVIEW TAB
    // ========================================
    
    /**
     * Load Overview Tab
     */
    async loadOverviewTab() {
        const container = document.getElementById('settings-content-overview');
        Utils.showLoading('settings-content-overview');
        
        try {
            this.data.overview = await api.getFinancialOverview();
            
            container.innerHTML = `
                <div class="space-y-8">
                    <!-- Income Section -->
                    <div style="background:white; border-radius:6px; padding:24px; 
                                box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                        <h3 style="font-size:13px; font-weight:700; color:#888; margin-bottom:20px; 
                                   text-transform:uppercase; letter-spacing:0.5px; 
                                   padding-bottom:10px; border-bottom:1px solid #f0f0f0;">
                            Income
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p class="text-sm text-gray-600">Gross Monthly</p>
                                <p class="text-2xl font-bold">${Utils.formatCurrency(this.data.overview.income.gross_monthly)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Tax</p>
                                <p class="text-2xl font-bold text-red-600">-${Utils.formatCurrency(this.data.overview.income.tax)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">PF</p>
                                <p class="text-2xl font-bold text-orange-600">-${Utils.formatCurrency(this.data.overview.income.pf)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Net Take-Home</p>
                                <p class="text-2xl font-bold text-green-600">${Utils.formatCurrency(this.data.overview.income.net_monthly)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Commitments Section -->
                    <div style="background:white; border-radius:6px; padding:24px; 
                                box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                        <h3 style="font-size:13px; font-weight:700; color:#888; margin-bottom:20px; 
                                   text-transform:uppercase; letter-spacing:0.5px; 
                                   padding-bottom:10px; border-bottom:1px solid #f0f0f0;">
                            Monthly Commitments
                        </h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                            <div>
                                <p class="text-sm text-gray-600">Expenses</p>
                                <p class="text-2xl font-bold">${Utils.formatCurrency(this.data.overview.commitments.total_expenses)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">EMI</p>
                                <p class="text-2xl font-bold">${Utils.formatCurrency(this.data.overview.commitments.total_emi)}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600">Total Committed</p>
                                <p class="text-2xl font-bold text-red-600">${Utils.formatCurrency(this.data.overview.commitments.total_committed)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Health Indicators -->
                    <div style="background:white; border-radius:6px; padding:24px; 
                                box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                        <h3 style="font-size:13px; font-weight:700; color:#888; margin-bottom:20px; 
                                   text-transform:uppercase; letter-spacing:0.5px; 
                                   padding-bottom:10px; border-bottom:1px solid #f0f0f0;">
                            Financial Health Indicators
                        </h3>
                        ${this.renderHealthIndicators()}
                    </div>
                    
                    <!-- Recommendations -->
                    ${this.renderRecommendations()}
                </div>
            `;
            
        } catch (error) {
            console.error('Error loading overview tab:', error);
            container.innerHTML = `
                <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                    <p class="text-red-700 font-semibold">Failed to load overview</p>
                    <button onclick="settingsManager.loadOverviewTab()" 
                            class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                        Retry
                    </button>
                </div>
            `;
        }
    }
    
    /**
     * Render health indicators
     */
    renderHealthIndicators() {
        const indicators = this.data.overview.health_indicators;
        
        return `
            <div class="space-y-6">
                <!-- DTI Ratio -->
                <div class="p-6 ${Utils.getSeverityBg(indicators.dti_ratio.severity)} rounded-xl">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold">Debt-to-Income Ratio</h4>
                        <span class="text-2xl font-bold ${Utils.getSeverityColor(indicators.dti_ratio.severity)}">
                            ${indicators.dti_ratio.ratio}%
                        </span>
                    </div>
                    <p class="text-sm font-semibold ${Utils.getSeverityColor(indicators.dti_ratio.severity)}">
                        ${indicators.dti_ratio.status}
                    </p>
                    <p class="text-sm text-gray-700 mt-2">${indicators.dti_ratio.message}</p>
                </div>
                
                <!-- Emergency Fund -->
                <div class="p-6 ${Utils.getSeverityBg(indicators.emergency_fund.severity)} rounded-xl">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold">Emergency Fund</h4>
                        <span class="text-2xl font-bold ${Utils.getSeverityColor(indicators.emergency_fund.severity)}">
                            ${indicators.emergency_fund.months_covered} months
                        </span>
                    </div>
                    <p class="text-sm font-semibold ${Utils.getSeverityColor(indicators.emergency_fund.severity)}">
                        ${indicators.emergency_fund.status}
                    </p>
                    <p class="text-sm text-gray-700 mt-2">${indicators.emergency_fund.message}</p>
                </div>
                
                <!-- Feasibility -->
                <div class="p-6 ${Utils.getSeverityBg(indicators.feasibility.severity)} rounded-xl">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold">Savings Feasibility</h4>
                        <span class="text-2xl font-bold ${Utils.getSeverityColor(indicators.feasibility.severity)}">
                            ${indicators.feasibility.feasible ? '✓' : '✗'}
                        </span>
                    </div>
                    <p class="text-sm text-gray-700">${indicators.feasibility.message}</p>
                </div>
            </div>
        `;
    }
    
    /**
     * Render recommendations
     */
    renderRecommendations() {
        if (!this.data.overview.recommendations || this.data.overview.recommendations.length === 0) {
            return '';
        }
        
        return `
            <div style="background:white; border-radius:6px; padding:24px; 
                        box-shadow:0 1px 3px rgba(0,0,0,0.08); border:1px solid #e8eaed;">
                <h3 style="font-size:13px; font-weight:700; color:#888; margin-bottom:20px; 
                           text-transform:uppercase; letter-spacing:0.5px; 
                           padding-bottom:10px; border-bottom:1px solid #f0f0f0;">
                    Recommendations
                </h3>
                <div class="space-y-4">
                    ${this.data.overview.recommendations.map(rec => `
                        <div class="p-4 ${Utils.getSeverityBg(rec.priority)} rounded-lg border-l-4 ${
                            rec.priority === 'high' ? 'border-red-500' :
                            rec.priority === 'medium' ? 'border-yellow-500' :
                            'border-blue-500'
                        }">
                            <p class="font-semibold text-sm mb-1 capitalize">${rec.type} • ${rec.priority} Priority</p>
                            <p class="text-sm text-gray-700 mb-2">${rec.message}</p>
                            <p class="text-xs text-gray-600">${rec.action}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // ========================================
    // MODAL MANAGEMENT
    // ========================================
    
    /**
     * Close modal by ID
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    }
}

// Initialize settings manager when DOM is ready
let settingsManager;
document.addEventListener('DOMContentLoaded', () => {
    settingsManager = new SettingsManager();
});

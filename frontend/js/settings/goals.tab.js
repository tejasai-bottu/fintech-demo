/**
 * Settings - Goals Tab
 * Handles savings goals management
 */

export async function loadGoalsTab(manager) {
    const container = document.getElementById('settings-content-goals');
    Utils.showLoading('settings-content-goals');

    try {
        manager.data.goals = await api.getSavingsGoals();

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
                    ${renderGoalsList(manager)}
                </div>
                
                <!-- Summary -->
                <div style="background:#1f4e79; color:white; padding:20px; border-radius:6px;">
                    <h3 class="font-bold mb-4">📊 Goals Summary</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm opacity-90">Active Goals</p>
                            <p class="text-3xl font-bold">${manager.data.goals.summary.total_goals}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Monthly Contribution Needed</p>
                            <p class="text-3xl font-bold">${Utils.formatCurrency(manager.data.goals.summary.total_monthly_contribution_needed)}</p>
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
                <button onclick="settingsManager.loadTabData('goals')" 
                        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    Retry
                </button>
            </div>
        `;
    }
}

export function renderGoalsList(manager) {
    if (!manager.data.goals.goals || manager.data.goals.goals.length === 0) {
        return `
            <div class="text-center py-12">
                <p class="text-6xl mb-4">🎯</p>
                <p class="text-gray-500">No savings goals yet</p>
                <p class="text-sm text-gray-400">Click "Add New Goal" to get started</p>
            </div>
        `;
    }

    return manager.data.goals.goals.map(goal => `
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

export function showAddGoalModal(manager) {
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
                        
                        <!-- Goal Type -->
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
        saveGoal(manager);
    });
}

export async function saveGoal(manager) {
    const data = {
        goal_name: document.getElementById('goal-name').value,
        target_amount: parseFloat(document.getElementById('goal-target').value),
        current_saved: parseFloat(document.getElementById('goal-current').value) || 0,
        target_date: document.getElementById('goal-date').value,
        priority: document.getElementById('goal-priority').value,
        goal_type: document.getElementById('goal-type').value
    };

    const validation = Validation.validateSavingsGoal(data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'danger');
        return;
    }

    try {
        const result = await api.createSavingsGoal(data);

        if (result.feasibility_check && !result.feasibility_check.feasible) {
            showFeasibilityWarning(result.feasibility_check);
        }

        Utils.showToast('✅ Goal added successfully!', 'success');
        manager.closeModal('add-goal-modal');
        await loadGoalsTab(manager);

    } catch (error) {
        console.error('Error saving goal:', error);
        Utils.showToast('Failed to save goal', 'danger');
    }
}

export function showFeasibilityWarning(feasibility) {
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

export async function deleteGoal(manager, goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
        await api.deleteSavingsGoal(goalId);
        Utils.showToast('✅ Goal deleted successfully', 'success');
        await loadGoalsTab(manager);
    } catch (error) {
        console.error('Error deleting goal:', error);
        Utils.showToast('Failed to delete goal', 'danger');
    }
}

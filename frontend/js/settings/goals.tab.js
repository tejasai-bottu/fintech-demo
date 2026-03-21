/**
 * Settings - Goals Tab
 * goal_category = free text (user types anything)
 * goal_type     = dropdown (short_term | medium_term | long_term)
 * priority      = dropdown (high | medium | low)
 */

export async function loadGoalsTab(manager) {
    const container = document.getElementById('settings-content-goals');
    Utils.showLoading('settings-content-goals');

    try {
        manager.data.goals = await api.getSavingsGoals();

        container.innerHTML = `
    <div class="settings-block">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <p class="settings-block-title" style="margin:0;border:none;padding:0;">Savings Goals</p>
            <button onclick="settingsManager.showAddGoalModal()" class="glow-button">+ Add Goal</button>
        </div>
        <div id="goals-list">${renderGoalsList(manager)}</div>
    </div>
    <div class="settings-block">
        <p class="settings-block-title">Goals Summary</p>
        <div class="summary-banner">
            <div class="summary-banner-stat">
                <span class="summary-banner-label">Active Goals</span>
                <span class="summary-banner-value">${manager.data.goals.summary.total_goals}</span>
            </div>
            <div class="summary-banner-stat">
                <span class="summary-banner-label">Monthly Contribution Needed</span>
                <span class="summary-banner-value">${Utils.formatCurrency(manager.data.goals.summary.total_monthly_contribution_needed)}</span>
            </div>
        </div>
    </div>
`;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load goals: ${error.message}</div>`;
    }
}

export function renderGoalsList(manager) {
    if (!manager.data.goals.goals || manager.data.goals.goals.length === 0) {
        return `<div style="text-align:center;padding:40px;color:#64748b;font-size:13px;">No goals yet — add one to get started</div>`;
    }

    const typeLabel = {
        short_term:  'Short term',
        medium_term: 'Medium term',
        long_term:   'Long term'
    };

    return manager.data.goals.goals.map(goal => `
        <div class="item-card">
            <div class="item-card-left">
                <div class="item-card-title">${goal.goal_name}</div>
                <div class="item-card-sub">
                    ${goal.goal_category ? `<span style="background:rgba(129,140,248,0.12);color:#818cf8;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:600;margin-right:6px;">${goal.goal_category}</span>` : ''}
                    ${typeLabel[goal.goal_type] || goal.goal_type}
                    · ${goal.priority} priority
                    · ${Utils.formatDate(goal.target_date)}
                </div>
                <div class="item-card-progress">
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px;">
                        <span>Progress</span><span>${goal.progress_percentage}%</span>
                    </div>
                    <div class="item-card-progress-track">
                        <div class="item-card-progress-fill" style="width:${goal.progress_percentage}%"></div>
                    </div>
                </div>
            </div>
            <div style="text-align:right;flex-shrink:0;">
                <div class="item-card-amount">
                    ${Utils.formatCurrency(goal.monthly_contribution_needed)}<span style="font-size:10px;color:#64748b;font-weight:400;">/mo</span>
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:2px;">of ${Utils.formatCurrency(goal.target_amount)}</div>
                <div class="item-card-actions" style="margin-top:10px;">
                    <button onclick="settingsManager.deleteGoal(${goal.id})" class="btn-danger-ghost">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

export function showAddGoalModal(manager) {
    const modalHtml = `
<div class="dark-modal-bg" id="add-goal-modal">
    <div class="dark-modal">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
            <h3 class="dark-modal-title" style="margin:0;">Add Savings Goal</h3>
            <button onclick="settingsManager.closeModal('add-goal-modal')"
                    style="background:none;border:none;color:#64748b;font-size:22px;cursor:pointer;line-height:1;">×</button>
        </div>

        <form id="add-goal-form">

            <!-- Row 1: Goal name + Category (free text) -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div>
                    <label class="dark-label">Goal Name *</label>
                    <input type="text" id="goal-name" class="dark-input"
                           placeholder="e.g. Emergency Fund, Trip to Europe" required>
                </div>
                <div>
                    <label class="dark-label">Category <span style="color:#64748b;font-weight:400;">(type anything)</span></label>
                    <input type="text" id="goal-category" class="dark-input"
                           placeholder="e.g. Savings, Travel, Health, Wedding">
                </div>
            </div>

            <!-- Row 2: Target amount + Current savings -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div>
                    <label class="dark-label">Target Amount (₹) *</label>
                    <input type="number" id="target-amount" class="dark-input"
                           placeholder="500000" min="1" required>
                </div>
                <div>
                    <label class="dark-label">Already Saved (₹)</label>
                    <input type="number" id="current-savings" class="dark-input"
                           placeholder="0" value="0" min="0">
                </div>
            </div>

            <!-- Row 3: Target date + Priority dropdown -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
                <div>
                    <label class="dark-label">Target Date *</label>
                    <input type="date" id="target-date" class="dark-input" required>
                </div>
                <div>
                    <label class="dark-label">Priority *</label>
                    <select id="priority" class="dark-select" required>
                        <option value="high">High — urgent</option>
                        <option value="medium" selected>Medium — balanced</option>
                        <option value="low">Low — someday</option>
                    </select>
                </div>
            </div>

            <!-- Row 4: Timeline dropdown (goal_type) — full width -->
            <div style="margin-bottom:20px;">
                <label class="dark-label">Timeline *</label>
                <select id="goal-type" class="dark-select" required>
                    <option value="short_term">Short term — under 1 year</option>
                    <option value="medium_term" selected>Medium term — 1 to 5 years</option>
                    <option value="long_term">Long term — over 5 years</option>
                </select>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:10px;">
                <button type="button" onclick="settingsManager.closeModal('add-goal-modal')"
                        class="btn-ghost" style="flex:1;">Cancel</button>
                <button type="submit" class="glow-button" style="flex:1;">Add Goal</button>
            </div>

        </form>
    </div>
</div>
`;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Block past dates at browser level
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('target-date').min = tomorrow.toISOString().split('T')[0];

    document.getElementById('add-goal-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveGoal(manager);
    });
}

export async function saveGoal(manager) {
    const data = {
        goal_name:     document.getElementById('goal-name').value.trim(),
        goal_category: document.getElementById('goal-category').value.trim(), // free text, no enum
        goal_type:     document.getElementById('goal-type').value,            // short_term | medium_term | long_term
        target_amount: parseFloat(document.getElementById('target-amount').value),
        current_saved: parseFloat(document.getElementById('current-savings').value) || 0,
        target_date:   document.getElementById('target-date').value,
        priority:      document.getElementById('priority').value
    };

    const validation = Validation.validateSavingsGoal(data);
    if (!validation.valid) {
        Utils.showToast(validation.errors[0], 'danger');
        return;
    }

    try {
        await api.createSavingsGoal(data);
        Utils.showToast('Goal created successfully!', 'success');
        manager.closeModal('add-goal-modal');
        await loadGoalsTab(manager);
    } catch (error) {
        console.error('Error saving goal:', error);
        Utils.showToast(error.message || 'Failed to save goal', 'danger');
    }
}

export async function deleteGoal(manager, goalId) {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
        await api.deleteSavingsGoal(goalId);
        Utils.showToast('Goal deleted successfully', 'success');
        await loadGoalsTab(manager);
    } catch (error) {
        console.error('Error deleting goal:', error);
        Utils.showToast('Failed to delete goal', 'danger');
    }
}

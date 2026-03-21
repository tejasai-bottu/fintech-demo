/**
 * Settings Page Logic - MAIN ENTRY POINT
 * Imports and wires all tab modules.
 * No logic lives here — only delegation to tab files.
 */

import {
    loadIncomeTab,
    renderAdditionalIncomes,
    addAdditionalIncome,
    removeAdditionalIncome,
    saveIncome
} from './settings/income.tab.js';

import {
    loadDebtsTab,
    renderDebtsList,
    showAddDebtModal,
    saveDebt,
    deleteDebt
} from './settings/debts.tab.js';

import {
    loadGoalsTab,
    renderGoalsList,
    showAddGoalModal,
    saveGoal,
    deleteGoal
} from './settings/goals.tab.js';

import {
    loadExpensesTab,
    renderExpensesList,
    renderExpenseWarnings,
    showAddExpenseModal,
    saveExpenseCategory,
    deleteExpenseCategory,
    loadReceiptHistory,
    showScanReceiptModal,
    handleReceiptUpload
} from './settings/expenses.tab.js';

import {
    loadBillsTab,
    renderBillsList,
    showPayBillModal,
    showAddBillModal,
    deleteBill
} from './settings/bills.tab.js';

import {
    loadOverviewTab,
    renderHealthIndicators,
    renderRecommendations
} from './settings/overview.tab.js';

// ============================================================
// SettingsManager — orchestrates tab switching and delegates
// all logic to the imported tab modules
// ============================================================

class SettingsManager {
    constructor() {
        this.currentTab = 'income';
        this.data = {};
        this.modals = {};
        this.init();
    }

    async init() {
        try {
            await this.switchTab('income');
        } finally {
            Utils.hideGlobalLoading();
        }
    }

    // --------------------------------------------------------
    // TAB MANAGEMENT
    // --------------------------------------------------------

    async switchTab(tabName) {
        document.querySelectorAll('.settings-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.querySelectorAll('.settings-tab').forEach(btn => {
            btn.classList.remove('active');
        });

        const selectedContent = document.getElementById(`settings-content-${tabName}`);
        if (selectedContent) {
            selectedContent.classList.remove('hidden');
        }

        const selectedTab = document.getElementById(`settings-tab-${tabName}`);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        this.currentTab = tabName;
        await this.loadTabData(tabName);
    }

    async loadTabData(tabName) {
        try {
            switch (tabName) {
                case 'income':   await loadIncomeTab(this);   break;
                case 'debts':    await loadDebtsTab(this);    break;
                case 'goals':    await loadGoalsTab(this);    break;
                case 'expenses': await loadExpensesTab(this); break;
                case 'bills':    await loadBillsTab(this);    break;
                case 'overview': await loadOverviewTab(this); break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName} tab:`, error);
            Utils.showToast(`Failed to load ${tabName} data`, 'danger');
        } finally {
            Utils.hideGlobalLoading(); // Always ensure global loader hides
        }
    }

    // --------------------------------------------------------
    // INCOME — delegated to income.tab.js
    // --------------------------------------------------------

    addAdditionalIncome()              { addAdditionalIncome(this); }
    removeAdditionalIncome(index)      { removeAdditionalIncome(this, index); }
    saveIncome()                       { saveIncome(this); }

    // --------------------------------------------------------
    // DEBTS — delegated to debts.tab.js
    // --------------------------------------------------------

    showAddDebtModal()                 { showAddDebtModal(this); }
    saveDebt()                         { saveDebt(this); }
    deleteDebt(debtId)                 { deleteDebt(this, debtId); }

    // --------------------------------------------------------
    // GOALS — delegated to goals.tab.js
    // --------------------------------------------------------

    showAddGoalModal()                 { showAddGoalModal(this); }
    saveGoal()                         { saveGoal(this); }
    deleteGoal(goalId)                 { deleteGoal(this, goalId); }

    // --------------------------------------------------------
    // EXPENSES — delegated to expenses.tab.js
    // --------------------------------------------------------

    showAddExpenseModal()              { showAddExpenseModal(this); }
    saveExpenseCategory()              { saveExpenseCategory(this); }
    deleteExpenseCategory(categoryId)  { deleteExpenseCategory(this, categoryId); }
    showScanReceiptModal()             { showScanReceiptModal(); }
    handleReceiptUpload()              { handleReceiptUpload(this); }

    // --------------------------------------------------------
    // BILLS — delegated to bills.tab.js
    // --------------------------------------------------------

    showAddBillModal()                 { showAddBillModal(this); }
    showPayBillModal(billId)           { showPayBillModal(this, billId); }
    deleteBill(billId)                 { deleteBill(this, billId); }

    // --------------------------------------------------------
    // MODAL MANAGEMENT
    // --------------------------------------------------------

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.remove();
    }
}

// Initialise on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    const manager = new SettingsManager();
    window.settingsManager = manager;                    // overwrite proxy
    document.dispatchEvent(new Event('settingsReady')); // signal ready

    // Safety fallback: ensure loader hides even if app crashes
    setTimeout(() => {
        const el = document.getElementById('loading-overlay');
        if (el) {
            el.classList.add('hide');
            setTimeout(() => { if (el.parentNode) el.remove(); }, 400);
        }
    }, 8000);
});

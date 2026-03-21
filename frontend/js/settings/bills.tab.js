/**
 * Settings - Bills Tab
 * Handles bills and credit card management
 */

export async function loadBillsTab(manager) {
    const container = document.getElementById('settings-content-bills');
    Utils.showLoading('settings-content-bills');

    try {
        manager.data.bills = await api.getBills();

        container.innerHTML = `
    <div class="settings-block">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <p class="settings-block-title" style="margin:0;border:none;padding:0;">Bills & Credit Cards</p>
            <button onclick="settingsManager.showAddBillModal()" class="glow-button">+ Add Bill</button>
        </div>
        <div id="bills-list">${renderBillsList(manager)}</div>
    </div>
    <div class="settings-block">
        <p class="settings-block-title">Bills Summary</p>
        <div class="summary-banner">
            <div class="summary-banner-stat"><span class="summary-banner-label">Total Bills</span><span class="summary-banner-value">${manager.data.bills.summary.total_bills}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">Min Due This Month</span><span class="summary-banner-value">₹${Math.round(manager.data.bills.summary.total_minimum_due).toLocaleString('en-IN')}</span></div>
            <div class="summary-banner-stat"><span class="summary-banner-label">Overdue</span><span class="summary-banner-value" style="color:${manager.data.bills.summary.overdue_count > 0 ? '#f87171' : '#34d399'}">${manager.data.bills.summary.overdue_count}</span></div>
        </div>
    </div>
`;
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Failed to load bills: ${error.message}</div>`;
    }
}

export function renderBillsList(manager) {
    if (!manager.data.bills?.bills?.length) {
        return `<div style="text-align:center;padding:40px;color:#64748b;font-size:13px;">No bills added yet</div>`;
    }
    return manager.data.bills.bills.map(bill => {
        const ps = bill.payment_status;
        const isOverdue = ps.status === 'overdue';
        return `
            <div class="item-card" style="${isOverdue ? 'border-color:rgba(248,113,113,0.25);' : ''}">
                <div class="item-card-left">
                    <div class="item-card-title">${bill.bill_name}</div>
                    <div class="item-card-sub" style="color:${isOverdue ? '#f87171' : '#64748b'};">
                        ${isOverdue ? `⚠ Overdue ${ps.days_late}d` : `Due in ${ps.days_until_due} days`}
                        ${bill.credit_limit > 0 ? ` · ${((bill.outstanding_balance/bill.credit_limit)*100).toFixed(0)}% utilization` : ''}
                    </div>
                </div>
                <div style="text-align:right;flex-shrink:0;">
                    <div class="item-card-amount">${Utils.formatCurrency(bill.total_amount_due)}</div>
                    <div style="font-size:11px;color:#64748b;">min ₹${Math.round(bill.minimum_due).toLocaleString('en-IN')}</div>
                    <div class="item-card-actions" style="margin-top:10px;">
                        <button onclick="settingsManager.showPayBillModal(${bill.id})" class="btn-ghost" style="font-size:11px;">Pay</button>
                        <button onclick="settingsManager.deleteBill(${bill.id})" class="btn-danger-ghost" style="font-size:11px;">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function showPayBillModal(manager, billId) {
    const bill = manager.data.bills.bills.find(b => b.id === billId);
    if (!bill) return;

    const modalHtml = `
<div class="dark-modal-bg" id="pay-bill-modal">
    <div class="dark-modal">
                <h3 class="dark-modal-title">Pay: ${bill.bill_name}</h3>
                <div style="background:rgba(255,255,255,0.05); padding:16px; border-radius:8px; margin-bottom:20px;">
                    <p class="text-sm">Amount Due: <strong>₹${Math.round(bill.total_amount_due).toLocaleString('en-IN')}</strong></p>
                    <p class="text-sm text-gray-400">Minimum Due: <strong>₹${Math.round(bill.minimum_due).toLocaleString('en-IN')}</strong></p>
                </div>
                <form id="pay-bill-form">
                    <div class="mb-4">
                        <label class="dark-label">Payment Amount (₹) *</label>
                        <input type="number" id="pay-amount" 
                               value="${bill.total_amount_due}"
                               class="dark-input" required>
                    </div>
                    <div class="mb-4">
                        <label class="dark-label">Payment Method</label>
                        <select id="pay-method" class="dark-select">
                            <option value="upi">UPI</option>
                            <option value="net_banking">Net Banking</option>
                            <option value="debit_card">Debit Card</option>
                            <option value="auto_debit">Auto Debit</option>
                        </select>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" onclick="settingsManager.closeModal('pay-bill-modal')"
                                class="btn-ghost" style="flex:1;">
                            Cancel
                        </button>
                        <button type="submit" class="glow-button" style="flex:1;">
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
            manager.closeModal('pay-bill-modal');
            await loadBillsTab(manager);
        } catch (err) {
            Utils.showToast('Failed to record payment', 'danger');
        }
    });
}

export function showAddBillModal(manager) {
    const modalHtml = `
<div class="dark-modal-bg" id="add-bill-modal">
    <div class="dark-modal">
                <h3 class="dark-modal-title">Add New Bill</h3>
                <form id="add-bill-form">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label class="dark-label">Bill Name *</label>
                            <input type="text" id="bill-name" class="dark-input" placeholder="HDFC Credit Card" required>
                        </div>
                        <div>
                            <label class="dark-label">Bill Type *</label>
                            <select id="bill-type" class="dark-select" required>
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
                            <label class="dark-label">Total Amount Due (₹) *</label>
                            <input type="number" id="bill-amount" class="dark-input" placeholder="5000" required>
                        </div>
                        <div>
                            <label class="dark-label">Minimum Due (₹)</label>
                            <input type="number" id="bill-min-due" class="dark-input" placeholder="500" value="0">
                        </div>
                        <div>
                            <label class="dark-label">Billing Cycle Day (1-31) *</label>
                            <input type="number" id="bill-cycle-day" class="dark-input" min="1" max="31" value="1" required>
                        </div>
                        <div>
                            <label class="dark-label">Due Date Day (1-31) *</label>
                            <input type="number" id="bill-due-day" class="dark-input" min="1" max="31" value="15" required>
                        </div>
                        <div>
                            <label class="dark-label">Interest Rate (% p.a.)</label>
                            <input type="number" id="bill-interest" class="dark-input" step="0.1" value="0">
                        </div>
                        <div>
                            <label class="dark-label">Late Fee (₹)</label>
                            <input type="number" id="bill-late-fee" class="dark-input" value="0">
                        </div>
                        <div class="col-span-2">
                            <label class="dark-label">Credit Limit (₹) — for Cards</label>
                            <input type="number" id="bill-credit-limit" class="dark-input" placeholder="100000" value="0">
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <button type="button" onclick="settingsManager.closeModal('add-bill-modal')"
                                class="btn-ghost" style="flex:1;">
                            Cancel
                        </button>
                        <button type="submit" class="glow-button" style="flex:1;">
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
            outstanding_balance: parseFloat(document.getElementById('bill-amount').value),
            credit_limit: parseFloat(document.getElementById('bill-credit-limit').value),
            billing_cycle_day: parseInt(document.getElementById('bill-cycle-day').value),
            due_date_day: parseInt(document.getElementById('bill-due-day').value),
            interest_rate: parseFloat(document.getElementById('bill-interest').value),
            late_fee: parseFloat(document.getElementById('bill-late-fee').value)
        };

        try {
            await api.createBill(data);
            Utils.showToast('✅ Bill added successfully!', 'success');
            manager.closeModal('add-bill-modal');
            await loadBillsTab(manager);
        } catch (err) {
            Utils.showToast('Failed to add bill', 'danger');
        }
    });
}

export async function deleteBill(manager, billId) {
    if (!confirm('Are you sure you want to deactivate this bill?')) return;
    try {
        await api.deleteBill(billId);
        Utils.showToast('✅ Bill deactivated', 'success');
        await loadBillsTab(manager);
    } catch (err) {
        Utils.showToast('Failed to delete bill', 'danger');
    }
}

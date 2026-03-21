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
                    ${renderBillsList(manager)}
                </div>
                
                <div style="background:#1f4e79; color:white; padding:20px; border-radius:6px;">
                    <h3 class="font-bold mb-4">📊 Bills Summary</h3>
                    <div class="grid grid-cols-3 gap-4">
                        <div>
                            <p class="text-sm opacity-90">Total Bills</p>
                            <p class="text-3xl font-bold">${manager.data.bills.summary.total_bills}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Min Due This Month</p>
                            <p class="text-3xl font-bold">₹${Math.round(manager.data.bills.summary.total_minimum_due).toLocaleString('en-IN')}</p>
                        </div>
                        <div>
                            <p class="text-sm opacity-90">Overdue Bills</p>
                            <p class="text-3xl font-bold" style="color:${manager.data.bills.summary.overdue_count > 0 ? '#ff6b6b' : '#69db7c'}">
                                ${manager.data.bills.summary.overdue_count}
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

export function renderBillsList(manager) {
    if (!manager.data.bills || !manager.data.bills.bills || manager.data.bills.bills.length === 0) {
        return `<div class="text-center py-12">
            <p class="text-6xl mb-4">💳</p>
            <p class="text-gray-500">No bills added yet</p>
        </div>`;
    }

    return manager.data.bills.bills.map(bill => {
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

export function showPayBillModal(manager, billId) {
    const bill = manager.data.bills.bills.find(b => b.id === billId);
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
            manager.closeModal('pay-bill-modal');
            await loadBillsTab(manager);
        } catch (err) {
            Utils.showToast('Failed to record payment', 'danger');
        }
    });
}

export function showAddBillModal(manager) {
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

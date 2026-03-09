/**
 * DASHBOARD.JS — Enterprise Analytics Dashboard
 * WealthFlow AI
 *
 * Renders: KPI Row, Alert Strip, EMI Bar Chart, Cashflow Bars,
 *          Expense Treemap, Goals Donut, Health Gauge, Debt Table,
 *          Upcoming Payments, Net Worth Trend
 *
 * Backend calls (via api.js):
 *   GET /api/dashboard/
 *   GET /api/profile/savings-goals
 *   GET /api/profile/expense-categories
 *   GET /api/profile/debts
 *   GET /api/calendar/events
 *   GET /api/profile/net-worth-history
 */

// Auth guard — redirect to login if no token
if (!localStorage.getItem('wealthflow_token')) {
    window.location.href = 'login.html';
}

class Dashboard {

    constructor() {
        this.data     = null;
        this.charts   = {};
        this.init();
    }

    // ─────────────────────────────────────────────
    // INIT
    // ─────────────────────────────────────────────

    async init() {
        try {
            await this.loadAllData();
            this.hideLoading();

            this.renderKPIs();
            this.renderAlertStrip();
            this.renderUpcomingPayments();
            this.renderCashflowBars();
            this.renderEMIBarChart();
            this.renderExpenseTreemap();
            this.renderGoalsDonut();
            this.renderHealthGauge();
            this.renderHealthIndicators();
            this.renderNetWorthChart();
            this.renderDebtTable();
            this.updateToolbar();

            // Respond to window resize
            window.addEventListener('resize', () => this.resizeCharts());

        } catch (err) {
            console.error('[Dashboard] Init failed:', err);
            this.hideLoading();
            this.showFatalError(err.message);
        }
    }

    // ─────────────────────────────────────────────
    // DATA LOADING
    // ─────────────────────────────────────────────

    async loadAllData() {
        const [dashboard, goals, expenses, debts, calendar] = await Promise.all([
            api.getDashboard(),
            api.getSavingsGoals(),
            api.getExpenseCategories(),
            api.getDebts(),
            api.getCalendarEvents()
        ]);

        this.data = dashboard;
        this.data.goals    = goals;
        this.data.expenses = expenses;
        this.data.debts    = debts;
        this.data.calendar = calendar;

        // Recalculate with real settings data
        this._recalculate();
    }

    _recalculate() {
        const d   = this.data;
        const s   = d.financial_summary;
        const inc = d.user.monthly_income || 0;

        s.monthly_expenses      = d.expenses.summary.total_expenses || 0;
        s.monthly_savings_goals = d.goals.summary.total_monthly_contribution_needed || 0;

        d.totalCommitments  = s.monthly_expenses + s.monthly_emi + s.monthly_savings_goals;
        s.monthly_savings   = inc - d.totalCommitments;
        s.savings_rate      = inc > 0 ? (s.monthly_savings / inc) * 100 : 0;
        d.dtiRatio          = inc > 0 ? (s.monthly_emi / inc) * 100 : 0;
    }

    // ─────────────────────────────────────────────
    // TOOLBAR UPDATE
    // ─────────────────────────────────────────────

    updateToolbar() {
        const name = this.data.user.name || 'Demo User';
        const el   = document.getElementById('user-name');
        if (el) el.textContent = name;

        const av = document.getElementById('user-avatar');
        if (av) av.textContent = name.charAt(0).toUpperCase();

        const sync = document.getElementById('last-sync');
        if (sync) {
            const now = new Date();
            sync.textContent = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        }
    }

    // ─────────────────────────────────────────────
    // KPI ROW
    // ─────────────────────────────────────────────

    renderKPIs() {
        const container = document.getElementById('kpi-row');
        if (!container) return;

        const d   = this.data;
        const s   = d.financial_summary;
        const inc = d.user.monthly_income || 0;

        const savingsIsDeficit = s.monthly_savings < 0;
        const dti = d.dtiRatio || 0;

        const dtiBadgeClass = dti < 30 ? 'good' : dti < 40 ? 'warn' : 'bad';
        const dtiBadgeText  = dti < 30 ? 'Healthy' : dti < 40 ? 'Moderate' : 'High';

        const srBadgeClass  = s.savings_rate >= 20 ? 'good' : s.savings_rate >= 10 ? 'warn' : 'bad';
        const srBadgeText   = s.savings_rate >= 20 ? 'On Track' : s.savings_rate >= 0 ? 'Low' : 'Deficit';

        const kpis = [
            {
                id: 'kpi-income',
                cls: 'kpi-income',
                icon: '↑',
                label: 'Net Monthly Income',
                value: this._fmt(inc),
                sub: 'After tax & PF',
                badge: { cls: 'good', text: 'Take-home' }
            },
            {
                id: 'kpi-invest',
                cls: 'kpi-invest',
                icon: '◆',
                label: 'Total Investments',
                value: this._fmt(s.total_investments),
                sub: 'Portfolio value',
                badge: { cls: 'neutral', text: 'Holdings' }
            },
            {
                id: 'kpi-commit',
                cls: 'kpi-commit',
                icon: '▼',
                label: 'Monthly Commitments',
                value: this._fmt(d.totalCommitments),
                sub: `EMI ${this._fmt(s.monthly_emi)} · Goals ${this._fmt(s.monthly_savings_goals)}`,
                badge: { cls: dtiBadgeClass, text: `DTI ${dti.toFixed(0)}%` }
            },
            {
                id: 'kpi-savings',
                cls: `kpi-savings${savingsIsDeficit ? ' kpi-deficit' : ''}`,
                icon: savingsIsDeficit ? '!' : '✓',
                label: savingsIsDeficit ? 'Budget Deficit' : 'Available Savings',
                value: this._fmt(s.monthly_savings),
                valueClass: savingsIsDeficit ? 'kpi-deficit' : '',
                sub: `${Math.abs(s.savings_rate).toFixed(0)}% of income`,
                badge: { cls: srBadgeClass, text: srBadgeText }
            }
        ];

        container.innerHTML = kpis.map(k => `
            <div class="kpi-card ${k.cls}" id="${k.id}">
                <div class="kpi-label">
                    <span class="kpi-icon">${k.icon}</span>
                    ${k.label}
                </div>
                <div class="kpi-value ${k.valueClass || ''}">${k.value}</div>
                <div class="kpi-footer">
                    <span class="kpi-sub">${k.sub}</span>
                    <span class="kpi-badge ${k.badge.cls}">${k.badge.text}</span>
                </div>
            </div>
        `).join('');
    }

    // ─────────────────────────────────────────────
    // ALERT STRIP
    // ─────────────────────────────────────────────

    renderAlertStrip() {
        const container = document.getElementById('alert-strip');
        if (!container) return;

        const s   = this.data.financial_summary;
        const dti = this.data.dtiRatio || 0;

        const alerts = [];

        if (s.monthly_savings < 0) {
            alerts.push({
                cls: 'danger',
                text: `Budget deficit of ${this._fmt(Math.abs(s.monthly_savings))}/month — reduce commitments or increase income`
            });
        }

        if (dti > 40) {
            alerts.push({
                cls: 'warning',
                text: `High DTI of ${dti.toFixed(0)}% — debt payments are ${dti.toFixed(0)}% of your income`
            });
        }

        if (this.data.goals.summary.total_goals === 0) {
            alerts.push({
                cls: 'info',
                text: 'No savings goals set — add goals in Profile Settings'
            });
        }

        if (alerts.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'flex';
        container.innerHTML = alerts.map(a => `
            <div class="alert-chip ${a.cls}">
                <div class="chip-dot"></div>
                ${a.text}
            </div>
        `).join('');
    }

    // ─────────────────────────────────────────────
    // UPCOMING PAYMENTS
    // ─────────────────────────────────────────────

    renderUpcomingPayments() {
        const container = document.getElementById('upcoming-payments');
        if (!container || !this.data.calendar) return;
        
        const next7 = this.data.calendar.summary.next_7_days || [];
        const overdue = this.data.calendar.overdue || [];
        
        if (next7.length === 0 && overdue.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        const allItems = [...overdue, ...next7].slice(0, 6);
        
        container.style.display = 'block';
        container.innerHTML = `
            <div style="background:white; border-radius:8px; border:1px solid #e5e7eb; 
                        padding:16px 20px; box-shadow:0 1px 3px rgba(0,0,0,0.07); margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <p style="font-size:13px; font-weight:600; color:#111928;">Upcoming Payments</p>
                    <a href="settings.html" style="font-size:12px; color:#1a56db;">View All →</a>
                </div>
                <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:4px;">
                    ${allItems.map(item => {
                        const isOverdue = item.status === 'overdue';
                        const date = new Date(item.date);
                        return `
                            <div style="min-width:160px; padding:12px; border-radius:6px; 
                                        border:1px solid ${isOverdue ? '#fca5a5' : '#e5e7eb'}; 
                                        background:${isOverdue ? '#fef2f2' : '#f9fafb'}; flex-shrink:0;">
                                <p style="font-size:10px; font-weight:600; text-transform:uppercase; 
                                          color:${isOverdue ? '#c81e1e' : '#6b7280'}; letter-spacing:0.4px;">
                                    ${isOverdue ? '⚠ OVERDUE' : item.type.replace('_', ' ').toUpperCase()}
                                </p>
                                <p style="font-size:12px; font-weight:600; color:#111928; margin:4px 0;">
                                    ${item.title}
                                </p>
                                <p style="font-size:13px; font-weight:700; color:${isOverdue ? '#c81e1e' : '#1a56db'}; 
                                          font-family:'IBM Plex Mono',monospace;">
                                    ₹${Math.round(item.amount || 0).toLocaleString('en-IN')}
                                </p>
                                <p style="font-size:10px; color:#9ca3af; margin-top:3px;">
                                    ${date.toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                                </p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // ─────────────────────────────────────────────
    // CASHFLOW BARS
    // ─────────────────────────────────────────────

    renderCashflowBars() {
        const container = document.getElementById('cashflow-bars');
        if (!container) return;

        const s   = this.data.financial_summary;
        const inc = this.data.user.monthly_income || 1;

        const rows = [
            { label: 'Expenses',      amount: s.monthly_expenses,      color: '#1a56db' },
            { label: 'EMI Payments',  amount: s.monthly_emi,           color: '#c27803' },
            { label: 'Savings Goals', amount: s.monthly_savings_goals, color: '#7e3af2' },
            { label: 'Available',     amount: s.monthly_savings,       color: s.monthly_savings < 0 ? '#c81e1e' : '#0e9f6e' }
        ];

        container.innerHTML = rows.map(r => {
            const pct = Math.min(100, Math.abs((r.amount / inc) * 100));
            return `
                <div class="cf-row">
                    <div class="cf-meta">
                        <span class="cf-label">${r.label}</span>
                        <span class="cf-amount">${this._fmt(r.amount)}<span class="cf-pct">${pct.toFixed(0)}%</span></span>
                    </div>
                    <div class="cf-track">
                        <div class="cf-fill" style="width:${pct}%; background:${r.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ─────────────────────────────────────────────
    // EMI BAR CHART (ECharts)
    // ─────────────────────────────────────────────

    renderEMIBarChart() {
        const el = document.getElementById('chart-emi-bar');
        if (!el || typeof echarts === 'undefined') return;

        const debts = this.data.debts.debts || [];

        // Destroy previous
        if (this.charts.emi) { this.charts.emi.dispose(); }

        if (debts.length === 0) {
            el.innerHTML = '<div style="height:220px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">No debts added yet</div>';
            return;
        }

        const names  = debts.map(d => this._truncate(d.debt_name, 14));
        const emis   = debts.map(d => d.monthly_emi);
        const colors = ['#1a56db','#0e9f6e','#c27803','#e02424','#7e3af2','#0694a2'];

        // Update badge
        const totalEMI = emis.reduce((a, b) => a + b, 0);
        const badge = document.getElementById('emi-total-badge');
        if (badge) badge.textContent = this._fmt(totalEMI);

        this.charts.emi = echarts.init(el);
        this.charts.emi.setOption({
            animation: true,
            animationDuration: 600,
            grid: { top: 8, right: 8, bottom: 4, left: 4, containLabel: true },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'none' },
                formatter: (params) => {
                    const p = params[0];
                    return `<strong>${p.name}</strong><br/>EMI: <strong>₹${p.value.toLocaleString('en-IN')}</strong>`;
                },
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                textStyle: { color: '#f9fafb', fontSize: 12 }
            },
            xAxis: {
                type: 'value',
                axisLabel: {
                    fontSize: 10,
                    color: '#9ca3af',
                    formatter: (v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}K` : `₹${v}`
                },
                splitLine: { lineStyle: { color: '#f3f4f6' } },
                axisLine: { show: false }
            },
            yAxis: {
                type: 'category',
                data: names,
                axisLabel: { fontSize: 11, color: '#374151', fontFamily: 'IBM Plex Sans' },
                axisLine: { show: false },
                axisTick: { show: false }
            },
            series: [{
                type: 'bar',
                data: emis.map((v, i) => ({
                    value: v,
                    itemStyle: { color: colors[i % colors.length], borderRadius: [0, 3, 3, 0] }
                })),
                barMaxWidth: 22,
                emphasis: { itemStyle: { opacity: 0.85 } }
            }]
        });
    }

    // ─────────────────────────────────────────────
    // EXPENSE TREEMAP (ECharts)
    // ─────────────────────────────────────────────

    renderExpenseTreemap() {
        const el = document.getElementById('chart-treemap');
        if (!el || typeof echarts === 'undefined') return;

        if (this.charts.treemap) { this.charts.treemap.dispose(); }

        const cats = this.data.expenses.categories || [];

        if (cats.length === 0) {
            el.innerHTML = '<div style="height:420px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">No expense categories yet — add them in Settings</div>';
            return;
        }

        const palette = [
            '#1a56db','#0e9f6e','#c27803','#7e3af2',
            '#e02424','#0694a2','#8d5524','#d61f69'
        ];

        const treeData = cats.map((c, i) => ({
            name: c.category_name,
            value: c.monthly_amount,
            itemStyle: { color: palette[i % palette.length] }
        }));

        // Build legend
        const legend = document.getElementById('treemap-legend');
        if (legend) {
            legend.innerHTML = cats.slice(0, 6).map((c, i) => `
                <div class="legend-item">
                    <div class="legend-dot" style="background:${palette[i % palette.length]};"></div>
                    ${this._truncate(c.category_name, 10)}
                </div>
            `).join('');
        }

        this.charts.treemap = echarts.init(el);
        this.charts.treemap.setOption({
            animation: true,
            animationDuration: 700,
            tooltip: {
                formatter: (info) => {
                    const total = cats.reduce((a, c) => a + c.monthly_amount, 0);
                    const pct   = total > 0 ? ((info.value / total) * 100).toFixed(1) : 0;
                    return `
                        <strong>${info.name}</strong><br/>
                        Amount: <strong>₹${info.value.toLocaleString('en-IN')}</strong><br/>
                        Share: <strong>${pct}%</strong>
                    `;
                },
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                textStyle: { color: '#f9fafb', fontSize: 12 }
            },
            series: [{
                type: 'treemap',
                data: treeData,
                roam: false,
                nodeClick: false,
                breadcrumb: { show: false },
                label: {
                    show: true,
                    formatter: (p) => {
                        const total = cats.reduce((a, c) => a + c.monthly_amount, 0);
                        const pct   = total > 0 ? ((p.value / total) * 100).toFixed(0) : 0;
                        return `{name|${p.name}}\n{val|₹${(p.value/1000).toFixed(1)}K  ${pct}%}`;
                    },
                    rich: {
                        name: { fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.95)', fontFamily: 'IBM Plex Sans' },
                        val:  { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: 'IBM Plex Mono' }
                    }
                },
                emphasis: {
                    label: { show: true },
                    itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' }
                },
                levels: [{
                    itemStyle: { gapWidth: 3, borderRadius: 4, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 2 }
                }]
            }]
        });
    }

    // ─────────────────────────────────────────────
    // GOALS DONUT (ECharts)
    // ─────────────────────────────────────────────

    renderGoalsDonut() {
        const el = document.getElementById('chart-goals-donut');
        if (!el || typeof echarts === 'undefined') return;

        if (this.charts.goals) { this.charts.goals.dispose(); }

        const goals = this.data.goals.goals || [];

        if (goals.length === 0) {
            el.innerHTML = '<div style="height:180px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:12px;">No goals yet</div>';
            return;
        }

        const slices = goals.slice(0, 5).map(g => ({
            name: g.goal_name,
            value: g.target_amount
        }));

        this.charts.goals = echarts.init(el);
        this.charts.goals.setOption({
            animation: true,
            animationDuration: 700,
            tooltip: {
                trigger: 'item',
                formatter: (p) => `<strong>${p.name}</strong><br/>Target: ₹${p.value.toLocaleString('en-IN')}`,
                backgroundColor: '#1f2937',
                borderColor: '#374151',
                textStyle: { color: '#f9fafb', fontSize: 12 }
            },
            color: ['#1a56db','#0e9f6e','#c27803','#7e3af2','#0694a2'],
            series: [{
                type: 'pie',
                radius: ['50%', '78%'],
                center: ['50%', '50%'],
                data: slices,
                label: { show: false },
                emphasis: {
                    itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.2)' }
                }
            }]
        });

        // Render goal list below chart
        const listEl = document.getElementById('goal-list');
        if (listEl) {
            listEl.innerHTML = goals.slice(0, 4).map(g => `
                <div class="goal-row">
                    <div class="goal-meta">
                        <span class="goal-name">${g.goal_name}</span>
                        <span class="goal-pct">${g.progress_percentage}%</span>
                    </div>
                    <div class="goal-track">
                        <div class="goal-fill" style="width:${g.progress_percentage}%;"></div>
                    </div>
                </div>
            `).join('');
        }
    }

    // ─────────────────────────────────────────────
    // HEALTH GAUGE (ECharts)
    // ─────────────────────────────────────────────

    renderHealthGauge() {
        const el = document.getElementById('chart-health-gauge');
        if (!el || typeof echarts === 'undefined') return;

        if (this.charts.health) { this.charts.health.dispose(); }

        const score = this._calcHealthScore();
        const color = score >= 75 ? '#0e9f6e' : score >= 50 ? '#c27803' : '#c81e1e';

        this.charts.health = echarts.init(el);
        this.charts.health.setOption({
            animation: true,
            animationDuration: 1000,
            series: [{
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                min: 0,
                max: 100,
                splitNumber: 4,
                radius: '100%',
                center: ['50%', '80%'],
                axisLine: {
                    lineStyle: {
                        width: 14,
                        color: [
                            [score / 100, color],
                            [1, '#e5e7eb']
                        ]
                    }
                },
                pointer: {
                    length: '55%',
                    width: 4,
                    itemStyle: { color: color }
                },
                axisTick: { show: false },
                splitLine: { show: false },
                axisLabel: { show: false },
                detail: {
                    valueAnimation: true,
                    formatter: '{value}',
                    color: color,
                    fontSize: 26,
                    fontWeight: 700,
                    fontFamily: 'IBM Plex Mono',
                    offsetCenter: [0, '-20%']
                },
                title: {
                    offsetCenter: [0, '-55%'],
                    color: '#6b7280',
                    fontSize: 11,
                    fontFamily: 'IBM Plex Sans'
                },
                data: [{ value: score, name: 'Health Score' }]
            }]
        });
    }

    // ─────────────────────────────────────────────
    // HEALTH INDICATORS
    // ─────────────────────────────────────────────

    renderHealthIndicators() {
        const container = document.getElementById('health-indicators');
        if (!container) return;

        const d   = this.data;
        const s   = d.financial_summary;
        const inc = d.user.monthly_income || 1;

        const dti = d.dtiRatio || 0;
        const sr  = s.savings_rate || 0;

        const dtiCls = dti < 30 ? 'good' : dti < 40 ? 'warn' : 'danger';
        const srCls  = sr >= 20 ? 'good' : sr >= 0 ? 'warn' : 'danger';
        const invCls = s.total_investments > 0 ? 'good' : 'warn';

        container.innerHTML = `
            <div class="hi-row">
                <span class="hi-label">DTI Ratio</span>
                <span class="hi-val ${dtiCls}">${dti.toFixed(1)}%</span>
            </div>
            <div class="hi-row">
                <span class="hi-label">Savings Rate</span>
                <span class="hi-val ${srCls}">${sr.toFixed(1)}%</span>
            </div>
            <div class="hi-row">
                <span class="hi-label">Investments</span>
                <span class="hi-val ${invCls}">${this._fmtShort(s.total_investments)}</span>
            </div>
        `;
    }

    // ─────────────────────────────────────────────
    // NET WORTH TREND
    // ─────────────────────────────────────────────

    async renderNetWorthChart() {
        const el = document.getElementById('chart-networth');
        if (!el || typeof echarts === 'undefined') return;

        if (this.charts.networth) { this.charts.networth.dispose(); }

        try {
            const data = await api.getNetWorthHistory(30);
            const badge = document.getElementById('nw-change-badge');

            if (badge && data.change !== undefined) {
                const sign = data.change >= 0 ? '+' : '';
                badge.textContent = `${sign}${this._fmt(data.change)}`;
                badge.style.color = data.change >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
            }

            const dates = data.snapshots.map(s => s.date);
            const values = data.snapshots.map(s => s.net_worth);

            this.charts.networth = echarts.init(el);
            this.charts.networth.setOption({
                animation: true,
                grid: { top: 8, right: 8, bottom: 24, left: 4, containLabel: true },
                tooltip: {
                    trigger: 'axis',
                    formatter: (params) => `${params[0].name}<br/>Net Worth: <strong>${this._fmt(params[0].value)}</strong>`,
                    backgroundColor: '#1f2937',
                    textStyle: { color: '#f9fafb', fontSize: 11 }
                },
                xAxis: {
                    type: 'category',
                    data: dates,
                    axisLabel: { fontSize: 9, color: '#9ca3af' },
                    axisLine: { show: false },
                    axisTick: { show: false }
                },
                yAxis: {
                    type: 'value',
                    axisLabel: {
                        fontSize: 9,
                        color: '#9ca3af',
                        formatter: v => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${(v/1000).toFixed(0)}K`
                    },
                    splitLine: { lineStyle: { color: '#f3f4f6' } }
                },
                series: [{
                    type: 'line',
                    data: values,
                    smooth: true,
                    symbol: 'none',
                    lineStyle: { color: data.trend === 'up' ? '#0e9f6e' : '#c81e1e', width: 2 },
                    areaStyle: {
                        color: {
                            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: data.trend === 'up' ? 'rgba(14,159,110,0.2)' : 'rgba(200,30,30,0.2)' },
                                { offset: 1, color: 'rgba(255,255,255,0)' }
                            ]
                        }
                    }
                }]
            });
        } catch (e) {
            el.innerHTML = '<div style="height:160px;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:11px;">No history yet</div>';
        }
    }

    // ─────────────────────────────────────────────
    // DEBT TABLE
    // ─────────────────────────────────────────────

    renderDebtTable() {
        const tbody = document.getElementById('debt-table-body');
        if (!tbody) return;

        const debts = this.data.debts.debts || [];

        if (debts.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-table-row">
                    <td colspan="8">
                        No debts recorded. <a href="settings.html" style="color:#1a56db;">Add debts in Profile Settings →</a>
                    </td>
                </tr>
            `;
            return;
        }

        const typeLabels = {
            home_loan: 'Home Loan',
            car_loan: 'Car Loan',
            personal_loan: 'Personal',
            credit_card: 'Credit Card',
            education: 'Education',
            other: 'Other'
        };

        tbody.innerHTML = debts.map(debt => {
            const statusCls  = debt.progress_percentage >= 75 ? 'good' : debt.progress_percentage >= 40 ? 'warn' : 'danger';
            const statusText = debt.progress_percentage >= 75 ? 'Near Closure' : debt.progress_percentage >= 40 ? 'Active' : 'Early Stage';

            return `
                <tr>
                    <td style="font-weight:600;">${debt.debt_name}</td>
                    <td>
                        <span class="td-type-badge">${typeLabels[debt.debt_type] || debt.debt_type}</span>
                    </td>
                    <td class="td-mono">₹${debt.outstanding_principal.toLocaleString('en-IN')}</td>
                    <td class="td-mono" style="color:#c27803;font-weight:600;">₹${debt.monthly_emi.toLocaleString('en-IN')}</td>
                    <td class="td-mono">${debt.interest_rate}%</td>
                    <td class="td-mono">${debt.remaining_months} mo</td>
                    <td>
                        <div class="td-progress-wrap">
                            <div class="td-progress-track">
                                <div class="td-progress-fill" style="width:${debt.progress_percentage}%;"></div>
                            </div>
                            <span class="td-pct">${debt.progress_percentage}%</span>
                        </div>
                    </td>
                    <td>
                        <span class="td-status-dot">
                            <div class="dot-circle ${statusCls}"></div>
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────

    _calcHealthScore() {
        const s   = this.data.financial_summary;
        const inc = this.data.user.monthly_income || 1;
        let score = 50;

        const sr  = (s.monthly_savings / inc) * 100;
        const dti = (s.monthly_emi / inc) * 100;

        if (sr >= 20) score += 25; else if (sr >= 10) score += 15; else if (sr >= 0) score += 5; else score -= 15;
        if (dti < 15) score += 25; else if (dti < 30) score += 15; else if (dti < 40) score += 5; else score -= 15;
        if (s.total_investments > inc * 3) score += 15; else if (s.total_investments > 0) score += 7;
        if (this.data.goals.goals.length > 0) score += 8;

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    _fmt(n) {
        return `₹${Math.round(n).toLocaleString('en-IN')}`;
    }

    _fmtShort(n) {
        if (n >= 10000000) return `₹${(n/10000000).toFixed(1)}Cr`;
        if (n >= 100000)   return `₹${(n/100000).toFixed(1)}L`;
        if (n >= 1000)     return `₹${(n/1000).toFixed(0)}K`;
        return `₹${Math.round(n).toLocaleString('en-IN')}`;
    }

    _truncate(str, len) {
        return str.length > len ? str.slice(0, len) + '…' : str;
    }

    resizeCharts() {
        Object.values(this.charts).forEach(c => { if (c && c.resize) c.resize(); });
    }

    hideLoading() {
        const el = document.getElementById('loading-overlay');
        if (el) el.remove();
    }

    showFatalError(msg) {
        const main = document.getElementById('dashboard-main');
        if (main) {
            main.innerHTML = `
                <div style="background:#fff;border:1px solid #fca5a5;border-radius:8px;padding:40px;text-align:center;color:#c81e1e;max-width:500px;margin:40px auto;">
                    <div style="font-size:32px;margin-bottom:12px;">⚠</div>
                    <p style="font-weight:600;font-size:14px;margin-bottom:6px;">Failed to load dashboard</p>
                    <p style="font-size:12px;color:#6b7280;margin-bottom:20px;">${msg || 'Check that the backend is running on localhost:8000'}</p>
                    <button onclick="location.reload()" style="padding:8px 20px;background:#1a56db;color:white;border:none;border-radius:4px;cursor:pointer;font-size:13px;">
                        Retry
                    </button>
                </div>
            `;
        }
    }
}

// ── Notification System ─────────────────────────────────────────────────────

async function loadNotifications() {
    try {
        const data = await api.getNotifications();
        const badge = document.getElementById('notif-badge');
        const list  = document.getElementById('notif-list');

        if (data.unread_count > 0) {
            badge.textContent = data.unread_count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        if (!data.notifications.length) {
            list.innerHTML = '<p style="padding:20px; color:#9ca3af; font-size:12px; text-align:center;">No notifications</p>';
            return;
        }

        list.innerHTML = data.notifications.map(n => {
            const timeAgo = _timeAgo(n.created_at);
            const cls = `notif-item ${n.is_read ? '' : 'unread'} ${n.severity}`;
            return `
                <div class="${cls}" onclick="markRead(${n.id})">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${timeAgo}</div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error('Failed to load notifications:', e);
    }
}

function toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function markRead(id) {
    await api.markNotificationRead(id);
    loadNotifications();
}

async function markAllRead() {
    await api.markAllNotificationsRead();
    loadNotifications();
}

function _timeAgo(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins/60)}h ago`;
    return `${Math.floor(mins/1440)}d ago`;
}

// Boot
document.addEventListener('DOMContentLoaded', () => { 
    new Dashboard(); 
    loadNotifications();
    // Refresh notifications every 5 minutes
    setInterval(loadNotifications, 5 * 60 * 1000);
});

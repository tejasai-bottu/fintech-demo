/**
 * Settings — Assets Tab
 * frontend/js/settings/assets.tab.js
 *
 * Full CRUD for user assets + live net-worth summary banner.
 * Follows the exact same patterns as debts.tab.js, goals.tab.js, etc.
 */

// ─── Asset type catalogue ─────────────────────────────────────────────────────
const ASSET_TYPES = [
    { value: "cash",          label: "Cash",           icon: "💵", color: "#34d399" },
    { value: "bank_balance",  label: "Bank Balance",   icon: "🏦", color: "#60a5fa" },
    { value: "real_estate",   label: "Real Estate",    icon: "🏠", color: "#a78bfa" },
    { value: "stocks",        label: "Stocks",         icon: "📈", color: "#f59e0b" },
    { value: "mutual_funds",  label: "Mutual Funds",   icon: "📊", color: "#818cf8" },
    { value: "fixed_deposit", label: "Fixed Deposit",  icon: "🔒", color: "#38bdf8" },
    { value: "gold",          label: "Gold",           icon: "🥇", color: "#fbbf24" },
    { value: "crypto",        label: "Cryptocurrency", icon: "₿",  color: "#fb923c" },
    { value: "vehicle",       label: "Vehicle",        icon: "🚗", color: "#94a3b8" },
    { value: "business",      label: "Business",       icon: "🏢", color: "#c084fc" },
    { value: "insurance",     label: "Insurance",      icon: "🛡️", color: "#2dd4bf" },
    { value: "other",         label: "Other",          icon: "💼", color: "#64748b" },
];

const TYPE_MAP = Object.fromEntries(ASSET_TYPES.map(t => [t.value, t]));

// ─── API helpers ─────────────────────────────────────────────────────────────

async function _apiFetch(path, options = {}) {
    const token = localStorage.getItem('Fintrix_token');
    const res = await fetch(`${CONFIG.API.BASE_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...options,
    });
    if (res.status === 401) { window.location.href = 'login.html'; return; }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

const assetsApi = {
    list:       ()           => _apiFetch('/api/assets/'),
    create:     (d)          => _apiFetch('/api/assets/', { method: 'POST',   body: JSON.stringify(d) }),
    update:     (id, d)      => _apiFetch(`/api/assets/${id}`, { method: 'PUT',    body: JSON.stringify(d) }),
    delete:     (id)         => _apiFetch(`/api/assets/${id}`, { method: 'DELETE' }),
    projection: (months = 24) => _apiFetch(`/api/assets/projection?months=${months}`),
};

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// ─── Main tab loader ─────────────────────────────────────────────────────────

export async function loadAssetsTab(manager) {
    const container = document.getElementById('settings-content-assets');
    Utils.showLoading('settings-content-assets');

    try {
        const [listData, projData] = await Promise.all([
            assetsApi.list(),
            assetsApi.projection(24),
        ]);
        manager.data.assets     = listData;
        manager.data.projection = projData;

        container.innerHTML = _buildTabHTML(manager);
        _renderNetWorthChart(manager);
    } catch (err) {
        container.innerHTML = `
            <div class="settings-block" style="border-color:rgba(248,113,113,0.2);">
                <p style="color:#f87171; font-size:13px; font-weight:600;">Failed to load assets</p>
                <p style="color:#64748b; font-size:12px; margin-top:4px;">${err.message}</p>
                <button onclick="settingsManager.loadTabData('assets')" class="btn-ghost" style="margin-top:12px;">
                    ↺ Retry
                </button>
            </div>`;
    }
}

// ─── Tab HTML skeleton ────────────────────────────────────────────────────────

function _buildTabHTML(manager) {
    const nw  = manager.data.assets.net_worth;
    const proj = manager.data.projection;

    const trendIcon  = proj.overall_trend === 'growth' ? '↑' : proj.overall_trend === 'decline' ? '↓' : '→';
    const trendColor = proj.overall_trend === 'growth' ? '#34d399' : proj.overall_trend === 'decline' ? '#f87171' : '#fbbf24';
    const sign       = proj.change >= 0 ? '+' : '';

    return `
<!-- ══ NET WORTH SUMMARY ══════════════════════════════════════════════════ -->
<div class="settings-block" style="
    background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.07));
    border-color: rgba(129,140,248,0.2);
    margin-bottom: 16px;
">
    <p class="settings-block-title">Net Worth Overview</p>

    <!-- KPI row -->
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:20px;">
        ${[
            { label: 'Total Assets',       val: fmt(nw.total_assets),           color: '#34d399' },
            { label: 'Investments',         val: fmt(nw.total_investments),      color: '#818cf8' },
            { label: 'Total Debt',          val: fmt(nw.total_debt),             color: '#f87171' },
            { label: 'Net Worth',           val: fmt(nw.net_worth),              color: nw.net_worth >= 0 ? '#34d399' : '#f87171' },
        ].map(k => `
            <div style="background:rgba(255,255,255,0.04); border-radius:12px; padding:14px;">
                <p style="font-size:11px; color:#64748b; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${k.label}</p>
                <p style="font-size:20px; font-weight:700; font-family:'IBM Plex Mono',monospace; color:${k.color};">${k.val}</p>
            </div>
        `).join('')}
    </div>

    <!-- Chart -->
    <div style="position:relative; background:rgba(0,0,0,0.2); border-radius:12px; padding:16px; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <div>
                <p style="font-size:12px; font-weight:600; color:#f1f5f9;">Net Worth Trajectory — 24 Month Projection</p>
                <p style="font-size:11px; color:#64748b;">Current vs future based on asset growth rates & debt repayment</p>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:22px; font-weight:700; font-family:'IBM Plex Mono',monospace; color:${trendColor};">
                    ${trendIcon} ${sign}${fmt(proj.change)}
                </span>
                <span style="font-size:11px; color:${trendColor}; background:${trendColor}18; padding:3px 10px; border-radius:99px; font-weight:600;">
                    ${sign}${proj.change_pct.toFixed(1)}%
                </span>
            </div>
        </div>
        <canvas id="assets-nw-chart" style="width:100%; height:220px;"></canvas>
        <!-- Divider marker -->
        <div id="chart-divider" style="
            position:absolute; top:48px; bottom:16px;
            width:1px; background:rgba(255,255,255,0.15);
            border-left: 1px dashed rgba(255,255,255,0.2);
            pointer-events:none;
        "></div>
        <div style="display:flex; gap:16px; margin-top:10px;">
            <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:#94a3b8;">
                <div style="width:20px; height:2px; background:#818cf8; border-radius:99px;"></div>
                Current Net Worth
            </div>
            <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:#94a3b8;">
                <div style="width:20px; height:2px; background:${trendColor}; border-radius:99px; opacity:0.7;
                            background: repeating-linear-gradient(90deg, ${trendColor} 0, ${trendColor} 4px, transparent 4px, transparent 8px);"></div>
                Projection
            </div>
        </div>
    </div>
</div>

<!-- ══ ASSETS LIST ════════════════════════════════════════════════════════ -->
<div class="settings-block">
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <p class="settings-block-title" style="margin:0; border:none; padding:0;">My Assets</p>
        <button onclick="settingsManager.showAddAssetModal()" class="glow-button">+ Add Asset</button>
    </div>

    <!-- Asset type filter pills -->
    <div id="asset-type-filters" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
        <button class="asset-filter-pill active" data-filter="all"
                onclick="filterAssets('all')" style="
            background:rgba(129,140,248,0.15); border:1px solid rgba(129,140,248,0.3);
            color:#818cf8; border-radius:99px; padding:4px 14px; font-size:11px; font-weight:600;
            cursor:pointer; font-family:inherit; transition:all 0.15s;
        ">All</button>
        ${ASSET_TYPES.filter(t =>
            (manager.data.assets.assets || []).some(a => a.asset_type === t.value)
        ).map(t => `
            <button class="asset-filter-pill" data-filter="${t.value}"
                    onclick="filterAssets('${t.value}')" style="
                background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
                color:#94a3b8; border-radius:99px; padding:4px 14px; font-size:11px; font-weight:600;
                cursor:pointer; font-family:inherit; transition:all 0.15s;
            ">${t.icon} ${t.label}</button>
        `).join('')}
    </div>

    <div id="assets-list">${renderAssetsList(manager)}</div>
</div>

<!-- ══ ASSET ALLOCATION ════════════════════════════════════════════════════ -->
${_buildAllocationSection(manager)}
`;
}

// ─── Assets list ─────────────────────────────────────────────────────────────

export function renderAssetsList(manager, filterType = 'all') {
    const assets = (manager.data.assets?.assets || []).filter(a =>
        filterType === 'all' || a.asset_type === filterType
    );

    if (!assets.length) {
        return `
            <div style="text-align:center; padding:48px 24px; color:#64748b;">
                <div style="font-size:40px; margin-bottom:12px;">🏦</div>
                <p style="font-size:14px; font-weight:600; color:#94a3b8; margin-bottom:4px;">No assets yet</p>
                <p style="font-size:12px;">Add your cash, property, investments, or any other asset</p>
            </div>`;
    }

    return assets.map(asset => {
        const meta  = TYPE_MAP[asset.asset_type] || TYPE_MAP.other;
        const gr    = asset.growth_rate;
        const grSign = gr >= 0 ? '+' : '';
        const grColor = gr >= 0 ? '#34d399' : '#f87171';

        return `
        <div class="item-card asset-card" data-type="${asset.asset_type}" data-id="${asset.id}">
            <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
                <!-- Icon badge -->
                <div style="
                    width:42px; height:42px; border-radius:12px; flex-shrink:0;
                    background:${meta.color}18; border:1px solid ${meta.color}30;
                    display:flex; align-items:center; justify-content:center; font-size:18px;
                ">${meta.icon}</div>

                <!-- Info -->
                <div style="flex:1; min-width:0;">
                    <div class="item-card-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${asset.name}</div>
                    <div class="item-card-sub" style="display:flex; align-items:center; gap:8px;">
                        <span style="background:${meta.color}15; color:${meta.color};
                                     border-radius:4px; padding:1px 8px; font-size:10px; font-weight:600;">
                            ${meta.label}
                        </span>
                        <span style="color:${grColor}; font-size:11px; font-weight:600;">
                            ${grSign}${gr.toFixed(1)}% p.a.
                        </span>
                        ${asset.notes ? `<span style="color:#475569; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:140px;" title="${asset.notes}">${asset.notes}</span>` : ''}
                    </div>
                </div>
            </div>

            <!-- Value + actions -->
            <div style="text-align:right; flex-shrink:0;">
                <div class="item-card-amount">${fmt(asset.current_value)}</div>
                <div class="item-card-actions" style="margin-top:8px; justify-content:flex-end;">
                    <button onclick="settingsManager.showEditAssetModal(${asset.id})" class="btn-ghost" style="font-size:11px; padding:4px 12px;">Edit</button>
                    <button onclick="settingsManager.deleteAsset(${asset.id})" class="btn-danger-ghost" style="font-size:11px; padding:4px 12px;">Delete</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ─── Allocation donut ─────────────────────────────────────────────────────────

function _buildAllocationSection(manager) {
    const assets = manager.data.assets?.assets || [];
    if (!assets.length) return '';

    const nw = manager.data.assets.net_worth;

    // Group by type
    const byType = {};
    for (const a of assets) {
        byType[a.asset_type] = (byType[a.asset_type] || 0) + a.current_value;
    }
    const total = Object.values(byType).reduce((s, v) => s + v, 0);

    const slices = Object.entries(byType)
        .sort((a, b) => b[1] - a[1])
        .map(([type, val]) => {
            const meta = TYPE_MAP[type] || TYPE_MAP.other;
            const pct  = total > 0 ? (val / total * 100) : 0;
            return { type, label: meta.label, icon: meta.icon, color: meta.color, val, pct };
        });

    return `
<div class="settings-block">
    <p class="settings-block-title">Asset Allocation</p>
    <div style="display:grid; grid-template-columns:280px 1fr; gap:24px; align-items:center;">
        <!-- Donut chart -->
        <div style="position:relative; width:220px; height:220px; margin:0 auto;">
            <canvas id="assets-donut-chart" width="220" height="220"></canvas>
            <div style="
                position:absolute; inset:0; display:flex; flex-direction:column;
                align-items:center; justify-content:center; pointer-events:none;
            ">
                <p style="font-size:11px; color:#64748b; margin-bottom:2px;">Total</p>
                <p style="font-size:16px; font-weight:700; font-family:'IBM Plex Mono',monospace; color:#f1f5f9;">
                    ${fmt(nw.total_combined_assets)}
                </p>
            </div>
        </div>

        <!-- Legend -->
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${slices.map(s => `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:10px; height:10px; border-radius:3px; background:${s.color}; flex-shrink:0;"></div>
                <span style="font-size:13px; color:#f1f5f9; flex:1;">${s.icon} ${s.label}</span>
                <span style="font-family:'IBM Plex Mono',monospace; font-size:13px; font-weight:600; color:#f1f5f9;">${fmt(s.val)}</span>
                <span style="font-size:11px; color:#64748b; min-width:36px; text-align:right;">${s.pct.toFixed(1)}%</span>
            </div>
            `).join('')}
        </div>
    </div>
</div>

<script>
(function() {
    // Donut
    const donutCtx = document.getElementById('assets-donut-chart');
    if (!donutCtx || typeof Chart === 'undefined') return;

    new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels:   ${JSON.stringify(slices.map(s => s.label))},
            datasets: [{
                data:            ${JSON.stringify(slices.map(s => Math.round(s.val)))},
                backgroundColor: ${JSON.stringify(slices.map(s => s.color + '99'))},
                borderColor:     ${JSON.stringify(slices.map(s => s.color))},
                borderWidth: 1.5,
                hoverOffset: 6,
            }]
        },
        options: {
            cutout: '70%',
            plugins: { legend: { display: false }, tooltip: {
                callbacks: {
                    label: (ctx) => ' ' + ctx.label + ': ₹' + ctx.raw.toLocaleString('en-IN')
                }
            }},
            animation: { animateRotate: true, duration: 700 }
        }
    });
})();
</script>`;
}

// ─── Net Worth Chart ──────────────────────────────────────────────────────────

function _renderNetWorthChart(manager) {
    const canvas = document.getElementById('assets-nw-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const proj     = manager.data.projection;
    const currentNW = proj.current_net_worth;

    // Build data: point 0 = now, then projections
    const labels    = ['Now', ...proj.projections.map(p => p.month_label)];
    const nwValues  = [currentNW, ...proj.projections.map(p => p.net_worth)];
    const assetVals = [manager.data.assets.net_worth.total_combined_assets,
                       ...proj.projections.map(p => p.assets)];
    const debtVals  = [manager.data.assets.net_worth.total_debt,
                       ...proj.projections.map(p => p.debt)];

    // Split at index 0: "Now" is present, rest is future
    const presentColor  = '#818cf8';
    const futureColor   = proj.overall_trend === 'growth'  ? '#34d399'
                        : proj.overall_trend === 'decline' ? '#f87171'
                        : '#fbbf24';

    // Gradient fill
    const ctx = canvas.getContext('2d');
    canvas.height = 220;

    const futureGrad = ctx.createLinearGradient(0, 0, 0, 220);
    futureGrad.addColorStop(0, futureColor + '40');
    futureGrad.addColorStop(1, futureColor + '00');

    new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label:           'Net Worth',
                    data:            nwValues,
                    borderColor:     nwValues.map((_, i) => i === 0 ? presentColor : futureColor),
                    backgroundColor: futureGrad,
                    borderWidth:     2.5,
                    pointRadius:     nwValues.map((_, i) => i === 0 ? 5 : 2),
                    pointBackgroundColor: nwValues.map((_, i) => i === 0 ? presentColor : futureColor),
                    fill:            true,
                    tension:         0.4,
                    segment: {
                        borderColor: (ctx) => ctx.p0DataIndex === 0 ? presentColor : futureColor,
                        borderDash:  (ctx) => ctx.p0DataIndex === 0 ? [] : [5, 4],
                    }
                },
                {
                    label:       'Total Assets',
                    data:        assetVals,
                    borderColor: '#60a5fa55',
                    borderWidth: 1.5,
                    borderDash:  [3, 4],
                    pointRadius: 0,
                    fill:        false,
                    tension:     0.4,
                },
                {
                    label:       'Total Debt',
                    data:        debtVals.map(v => -v),
                    borderColor: '#f8717155',
                    borderWidth: 1.5,
                    borderDash:  [3, 4],
                    pointRadius: 0,
                    fill:        false,
                    tension:     0.4,
                },
            ]
        },
        options: {
            responsive:          false,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    ticks:     { color: '#64748b', font: { size: 10 }, maxTicksLimit: 9 },
                    grid:      { color: 'rgba(255,255,255,0.04)' },
                    border:    { display: false },
                },
                y: {
                    ticks: {
                        color: '#64748b', font: { size: 10 },
                        callback: v => v >= 100000 ? `₹${(v/100000).toFixed(0)}L`
                                     : v >= 1000   ? `₹${(v/1000).toFixed(0)}K`
                                     : `₹${v}`
                    },
                    grid:  { color: 'rgba(255,255,255,0.04)' },
                    border: { display: false },
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1e2535',
                    borderColor:     'rgba(255,255,255,0.1)',
                    borderWidth:     1,
                    titleColor:      '#94a3b8',
                    bodyColor:       '#f1f5f9',
                    padding:         10,
                    callbacks: {
                        label: (ctx) => {
                            const v = ctx.raw;
                            return ` ${ctx.dataset.label}: ₹${Math.abs(v).toLocaleString('en-IN')}`;
                        }
                    }
                },
                annotation: {}
            }
        }
    });

    // Position the vertical divider at "Now" (index 0 = x-position left edge)
    // We mark it with a translucent overlay instead via CSS left
    const divider = document.getElementById('chart-divider');
    if (divider) {
        // Rough estimate: 1st point is at ~8% from left inside the canvas
        divider.style.left = 'calc(7% + 16px)';
    }
}

// ─── Filter assets ────────────────────────────────────────────────────────────

window.filterAssets = function(filterType) {
    // Update pill styles
    document.querySelectorAll('.asset-filter-pill').forEach(pill => {
        const isActive = pill.dataset.filter === filterType;
        pill.style.background    = isActive ? 'rgba(129,140,248,0.15)' : 'rgba(255,255,255,0.04)';
        pill.style.borderColor   = isActive ? 'rgba(129,140,248,0.3)'  : 'rgba(255,255,255,0.08)';
        pill.style.color         = isActive ? '#818cf8' : '#94a3b8';
    });

    const listEl = document.getElementById('assets-list');
    if (!listEl || !window._assetsManagerRef) return;
    listEl.innerHTML = renderAssetsList(window._assetsManagerRef, filterType);
};

// ─── Add Asset Modal ──────────────────────────────────────────────────────────

export function showAddAssetModal(manager) {
    window._assetsManagerRef = manager;
    _openAssetModal(manager, null);
}

export function showEditAssetModal(manager, assetId) {
    const asset = (manager.data.assets?.assets || []).find(a => a.id === assetId);
    if (!asset) return;
    window._assetsManagerRef = manager;
    _openAssetModal(manager, asset);
}

function _openAssetModal(manager, asset /* null = create */) {
    const isEdit   = !!asset;
    const modalId  = 'asset-modal';
    const existing = document.getElementById(modalId);
    if (existing) existing.remove();

    const typeOptions = ASSET_TYPES.map(t => `
        <option value="${t.value}" ${asset?.asset_type === t.value ? 'selected' : ''}>
            ${t.icon} ${t.label}
        </option>
    `).join('');

    const html = `
<div class="dark-modal-bg" id="${modalId}">
    <div class="dark-modal" style="max-width:520px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px;">
            <h3 class="dark-modal-title" style="margin:0;">${isEdit ? 'Edit Asset' : 'Add New Asset'}</h3>
            <button onclick="settingsManager.closeModal('${modalId}')"
                    style="background:none; border:none; color:#64748b; font-size:24px; cursor:pointer; line-height:1;">×</button>
        </div>

        <form id="asset-form">
            <!-- Name -->
            <div style="margin-bottom:16px;">
                <label class="dark-label">Asset Name *</label>
                <input type="text" id="asset-name" class="dark-input" required
                       placeholder="e.g. HDFC Savings, Gold ETF, Flat in Pune"
                       value="${asset?.name || ''}">
            </div>

            <!-- Type -->
            <div style="margin-bottom:16px;">
                <label class="dark-label">Asset Type *</label>
                <select id="asset-type" class="dark-select" required
                        onchange="updateGrowthDefault()">
                    ${typeOptions}
                </select>
            </div>

            <!-- Value + Growth rate -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:16px;">
                <div>
                    <label class="dark-label">Current Value (₹) *</label>
                    <input type="number" id="asset-value" class="dark-input" required
                           min="0" step="1000" placeholder="500000"
                           value="${asset?.current_value || ''}">
                </div>
                <div>
                    <label class="dark-label">
                        Annual Growth Rate (%)
                        <span id="growth-hint" style="color:#475569; font-weight:400;"> — optional</span>
                    </label>
                    <input type="number" id="asset-growth" class="dark-input"
                           step="0.1" placeholder="Auto"
                           value="${asset?.growth_rate ?? ''}">
                </div>
            </div>

            <!-- Notes -->
            <div style="margin-bottom:20px;">
                <label class="dark-label">Notes <span style="color:#475569; font-weight:400;">(optional)</span></label>
                <input type="text" id="asset-notes" class="dark-input"
                       placeholder="e.g. HDFC Bank, Floor 3, Maturity 2027"
                       value="${asset?.notes || ''}">
            </div>

            <!-- Preview card -->
            <div id="asset-preview" style="
                background: rgba(99,102,241,0.06); border:1px solid rgba(99,102,241,0.15);
                border-radius:10px; padding:14px; margin-bottom:20px;
                display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; font-size:12px;
            ">
                <div><p style="color:#64748b;margin-bottom:2px;">Value</p><p id="prev-val" style="color:#f1f5f9;font-weight:700;font-family:'IBM Plex Mono',monospace;">—</p></div>
                <div><p style="color:#64748b;margin-bottom:2px;">1-Year Value</p><p id="prev-1y" style="color:#34d399;font-weight:700;font-family:'IBM Plex Mono',monospace;">—</p></div>
                <div><p style="color:#64748b;margin-bottom:2px;">5-Year Value</p><p id="prev-5y" style="color:#818cf8;font-weight:700;font-family:'IBM Plex Mono',monospace;">—</p></div>
            </div>

            <!-- Buttons -->
            <div style="display:flex; gap:10px;">
                <button type="button" onclick="settingsManager.closeModal('${modalId}')"
                        class="btn-ghost" style="flex:1;">Cancel</button>
                <button type="submit" class="glow-button" style="flex:1;">
                    ${isEdit ? 'Save Changes' : 'Add Asset'}
                </button>
            </div>
        </form>
    </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    // Live preview updater
    const updatePreview = () => {
        const val  = parseFloat(document.getElementById('asset-value').value) || 0;
        const rate = parseFloat(document.getElementById('asset-growth').value);
        const type = document.getElementById('asset-type').value;
        const defaults = {
            cash:0, bank_balance:3.5, real_estate:8, stocks:12, mutual_funds:11,
            fixed_deposit:7, gold:9, crypto:20, vehicle:-10, business:15, insurance:6, other:5
        };
        const gr = isNaN(rate) ? (defaults[type] || 5) : rate;
        const yr1 = val * Math.pow(1 + gr/100, 1);
        const yr5 = val * Math.pow(1 + gr/100, 5);
        document.getElementById('prev-val').textContent = fmt(val);
        document.getElementById('prev-1y').textContent  = fmt(yr1);
        document.getElementById('prev-5y').textContent  = fmt(yr5);
    };

    ['asset-value', 'asset-growth', 'asset-type'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', updatePreview);
        document.getElementById(id)?.addEventListener('change', updatePreview);
    });
    updatePreview();

    // Growth default hint
    window.updateGrowthDefault = function() {
        const defaults = {
            cash:0, bank_balance:3.5, real_estate:8, stocks:12, mutual_funds:11,
            fixed_deposit:7, gold:9, crypto:20, vehicle:-10, business:15, insurance:6, other:5
        };
        const type = document.getElementById('asset-type').value;
        const d    = defaults[type];
        const hint = document.getElementById('growth-hint');
        if (hint) hint.textContent = ` — default ${d >= 0 ? '+' : ''}${d}% for ${TYPE_MAP[type]?.label}`;
        const inp = document.getElementById('asset-growth');
        if (inp && !inp.value) inp.placeholder = `${d}`;
        updatePreview();
    };
    window.updateGrowthDefault();

    // Form submit
    document.getElementById('asset-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name:         document.getElementById('asset-name').value.trim(),
            asset_type:   document.getElementById('asset-type').value,
            current_value: parseFloat(document.getElementById('asset-value').value),
            growth_rate:   document.getElementById('asset-growth').value !== ''
                            ? parseFloat(document.getElementById('asset-growth').value)
                            : null,
            notes: document.getElementById('asset-notes').value.trim() || null,
        };

        if (!payload.name) { Utils.showToast('Asset name is required', 'warning'); return; }
        if (isNaN(payload.current_value) || payload.current_value < 0) {
            Utils.showToast('Please enter a valid value', 'warning'); return;
        }

        try {
            if (isEdit) {
                await assetsApi.update(asset.id, payload);
                Utils.showToast('✅ Asset updated', 'success');
            } else {
                await assetsApi.create(payload);
                Utils.showToast('✅ Asset added', 'success');
            }
            manager.closeModal(modalId);
            await loadAssetsTab(manager);
        } catch (err) {
            Utils.showToast(err.message || 'Failed to save asset', 'danger');
        }
    });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteAsset(manager, assetId) {
    const asset = (manager.data.assets?.assets || []).find(a => a.id === assetId);
    if (!confirm(`Delete "${asset?.name || 'this asset'}"?`)) return;
    try {
        await assetsApi.delete(assetId);
        Utils.showToast('✅ Asset deleted', 'success');
        await loadAssetsTab(manager);
    } catch (err) {
        Utils.showToast('Failed to delete asset', 'danger');
    }
}

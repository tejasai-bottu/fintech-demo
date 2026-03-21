/**
 * Settings - Overview Tab
 * Handles financial overview and health indicators
 */

export async function loadOverviewTab(manager) {
    const container = document.getElementById('settings-content-overview');
    Utils.showLoading('settings-content-overview');

    try {
        manager.data.overview = await api.getFinancialOverview();

        container.innerHTML = `
            <div class="space-y-8">
                <!-- Income Section -->
                <div class="settings-block">
                    <h3 class="settings-block-title">
                        Income
                    </h3>
                    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:20px;">
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">Gross Monthly</p>
                            <p style="font-size:20px; font-weight:700; color:#f1f5f9; font-family:'IBM Plex Mono',monospace;">${Utils.formatCurrency(manager.data.overview.income.gross_monthly)}</p>
                        </div>
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">Tax</p>
                            <p style="font-size:20px; font-weight:700; color:#f87171; font-family:'IBM Plex Mono',monospace;">-${Utils.formatCurrency(manager.data.overview.income.tax)}</p>
                        </div>
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">PF</p>
                            <p style="font-size:20px; font-weight:700; color:#fbbf24; font-family:'IBM Plex Mono',monospace;">-${Utils.formatCurrency(manager.data.overview.income.pf)}</p>
                        </div>
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">Net Take-Home</p>
                            <p style="font-size:20px; font-weight:700; color:#34d399; font-family:'IBM Plex Mono',monospace;">${Utils.formatCurrency(manager.data.overview.income.net_monthly)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Commitments Section -->
                <div class="settings-block">
                    <h3 class="settings-block-title">
                        Monthly Commitments
                    </h3>
                    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:20px;">
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">Expenses</p>
                            <p style="font-size:20px; font-weight:700; color:#f1f5f9; font-family:'IBM Plex Mono',monospace;">${Utils.formatCurrency(manager.data.overview.commitments.total_expenses)}</p>
                        </div>
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">EMI</p>
                            <p style="font-size:20px; font-weight:700; color:#f1f5f9; font-family:'IBM Plex Mono',monospace;">${Utils.formatCurrency(manager.data.overview.commitments.total_emi)}</p>
                        </div>
                        <div>
                            <p style="font-size:12px; color:#64748b; margin-bottom:4px;">Total Committed</p>
                            <p style="font-size:20px; font-weight:700; color:#f87171; font-family:'IBM Plex Mono',monospace;">${Utils.formatCurrency(manager.data.overview.commitments.total_committed)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Health Indicators -->
                <div class="settings-block">
                    <h3 class="settings-block-title">
                        Financial Health Indicators
                    </h3>
                    ${renderHealthIndicators(manager)}
                </div>
                
                <!-- Recommendations -->
                ${renderRecommendations(manager)}
            </div>
        `;

    } catch (error) {
        console.error('Error loading overview tab:', error);
        container.innerHTML = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <p class="text-red-700 font-semibold">Failed to load overview</p>
                <button onclick="settingsManager.loadTabData('overview')" 
                        class="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm">
                    Retry
                </button>
            </div>
        `;
    }
}

export function renderHealthIndicators(manager) {
    const indicators = manager.data.overview.health_indicators;

    const severityStyle = (sev) => {
        const map = {
            success: { bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.2)', color: '#34d399' },
            warning: { bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.2)', color: '#fbbf24' },
            danger:  { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', color: '#f87171' },
            info:    { bg: 'rgba(129,140,248,0.08)', border: 'rgba(129,140,248,0.2)', color: '#818cf8' }
        };
        return map[sev] || map.info;
    };

    const dti = indicators.dti_ratio;
    const ef  = indicators.emergency_fund;
    const feas = indicators.feasibility;
    const dtiS = severityStyle(dti.severity);
    const efS  = severityStyle(ef.severity);
    const feasS = severityStyle(feas.severity);

    return `
        <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="padding:18px 20px; background:${dtiS.bg}; border:1px solid ${dtiS.border};
                        border-radius:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <p style="font-size:13px; font-weight:600; color:#f1f5f9;">Debt-to-Income Ratio</p>
                    <span style="font-size:18px; font-weight:700; font-family:'IBM Plex Mono',monospace;
                                 color:${dtiS.color};">${dti.ratio}%</span>
                </div>
                <p style="font-size:12px; font-weight:600; color:${dtiS.color}; margin-bottom:4px;">${dti.status}</p>
                <p style="font-size:12px; color:#94a3b8;">${dti.message}</p>
            </div>

            <div style="padding:18px 20px; background:${efS.bg}; border:1px solid ${efS.border};
                        border-radius:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <p style="font-size:13px; font-weight:600; color:#f1f5f9;">Emergency Fund</p>
                    <span style="font-size:18px; font-weight:700; font-family:'IBM Plex Mono',monospace;
                                 color:${efS.color};">${ef.months_covered} mo</span>
                </div>
                <p style="font-size:12px; font-weight:600; color:${efS.color}; margin-bottom:4px;">${ef.status}</p>
                <p style="font-size:12px; color:#94a3b8;">${ef.message}</p>
            </div>

            <div style="padding:18px 20px; background:${feasS.bg}; border:1px solid ${feasS.border};
                        border-radius:12px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px;">
                    <p style="font-size:13px; font-weight:600; color:#f1f5f9;">Savings Feasibility</p>
                    <span style="font-size:20px; color:${feasS.color};">${feas.feasible ? '✓' : '✗'}</span>
                </div>
                <p style="font-size:12px; color:#94a3b8;">${feas.message}</p>
            </div>
        </div>
    `;
}

export function renderRecommendations(manager) {
    if (!manager.data.overview.recommendations || manager.data.overview.recommendations.length === 0) {
        return '';
    }

    const priorityStyle = (p) => {
        const map = {
            high:   { bg: 'rgba(248,113,113,0.08)', border: '#f87171',  color: '#f87171' },
            medium: { bg: 'rgba(251,191,36,0.08)',  border: '#fbbf24',  color: '#fbbf24' },
            low:    { bg: 'rgba(129,140,248,0.08)', border: '#818cf8',  color: '#818cf8' }
        };
        return map[p] || map.low;
    };

    return `
        <div class="settings-block">
            <p class="settings-block-title">Recommendations</p>
            <div style="display:flex; flex-direction:column; gap:10px;">
                ${manager.data.overview.recommendations.map(rec => {
                    const s = priorityStyle(rec.priority);
                    return `
                        <div style="padding:14px 16px; background:${s.bg};
                                    border-left:3px solid ${s.border};
                                    border-radius:0 10px 10px 0;">
                            <p style="font-size:11px; font-weight:700; color:${s.color};
                                      text-transform:uppercase; letter-spacing:0.4px;
                                      margin-bottom:4px;">${rec.type} · ${rec.priority} priority</p>
                            <p style="font-size:13px; color:#f1f5f9; margin-bottom:4px;">${rec.message}</p>
                            <p style="font-size:11px; color:#64748b;">${rec.action}</p>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

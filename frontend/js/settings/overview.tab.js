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
                            <p class="text-2xl font-bold">${Utils.formatCurrency(manager.data.overview.income.gross_monthly)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Tax</p>
                            <p class="text-2xl font-bold text-red-600">-${Utils.formatCurrency(manager.data.overview.income.tax)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">PF</p>
                            <p class="text-2xl font-bold text-orange-600">-${Utils.formatCurrency(manager.data.overview.income.pf)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Net Take-Home</p>
                            <p class="text-2xl font-bold text-green-600">${Utils.formatCurrency(manager.data.overview.income.net_monthly)}</p>
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
                            <p class="text-2xl font-bold">${Utils.formatCurrency(manager.data.overview.commitments.total_expenses)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">EMI</p>
                            <p class="text-2xl font-bold">${Utils.formatCurrency(manager.data.overview.commitments.total_emi)}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Total Committed</p>
                            <p class="text-2xl font-bold text-red-600">${Utils.formatCurrency(manager.data.overview.commitments.total_committed)}</p>
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

export function renderRecommendations(manager) {
    if (!manager.data.overview.recommendations || manager.data.overview.recommendations.length === 0) {
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
                ${manager.data.overview.recommendations.map(rec => `
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

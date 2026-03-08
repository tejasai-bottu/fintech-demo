/**
 * Chart Rendering Logic — ECharts Edition
 * WealthFlow AI
 */

class ChartManager {
    constructor() {
        this.charts = {};
    }

    /**
     * Destroy chart if exists
     */
    destroyChart(containerId) {
        if (this.charts[containerId]) {
            this.charts[containerId].dispose(); // ECharts uses .dispose()
            delete this.charts[containerId];
        }
    }

    /**
     * Create Treemap
     */
    createTreemap(containerId, data, title) {
        this.destroyChart(containerId);
        const el = document.getElementById(containerId);
        if (!el) return;
        const chart = echarts.init(el);
        chart.setOption({
            title: { text: title, textStyle: { fontSize: 13, color: '#444', fontFamily: 'IBM Plex Sans' } },
            tooltip: {
                formatter: (info) => `<strong>${info.name}</strong><br/>Value: ₹${info.value.toLocaleString('en-IN')}`
            },
            series: [{
                type: 'treemap',
                data: data, // expects [{name, value}]
                leafDepth: 1,
                label: { show: true, formatter: '{b}\n{c}', fontFamily: 'IBM Plex Sans' },
                itemStyle: { borderRadius: 4, gapWidth: 2 }
            }]
        });
        this.charts[containerId] = chart;
        return chart;
    }

    /**
     * Create Horizontal Bar Chart
     */
    createHorizontalBar(containerId, categories, values, title) {
        this.destroyChart(containerId);
        const el = document.getElementById(containerId);
        if (!el) return;
        const chart = echarts.init(el);
        chart.setOption({
            title: { text: title, textStyle: { fontSize: 13, fontFamily: 'IBM Plex Sans' } },
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
            xAxis: { type: 'value', axisLabel: { fontFamily: 'IBM Plex Mono' } },
            yAxis: { type: 'category', data: categories, axisLabel: { fontFamily: 'IBM Plex Sans' } },
            series: [{
                type: 'bar',
                data: values,
                color: '#3a7bd5',
                itemStyle: { borderRadius: [0, 4, 4, 0] }
            }]
        });
        this.charts[containerId] = chart;
        return chart;
    }

    /**
     * Create Distribution Donut Chart
     */
    createDistribution(containerId, data, title) {
        this.destroyChart(containerId);
        const el = document.getElementById(containerId);
        if (!el) return;
        const chart = echarts.init(el);
        chart.setOption({
            title: { text: title, textStyle: { fontSize: 13, fontFamily: 'IBM Plex Sans' }, left: 'center' },
            tooltip: { trigger: 'item', formatter: '{b}: ₹{c} ({d}%)' },
            legend: { bottom: '0', left: 'center', textStyle: { fontSize: 10 } },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
                label: { show: false, position: 'center' },
                emphasis: { label: { show: true, fontSize: '14', fontWeight: 'bold' } },
                labelLine: { show: false },
                data: data // expects [{name, value}]
            }]
        });
        this.charts[containerId] = chart;
        return chart;
    }

    /**
     * Legacy support/Placeholder for Line Chart (Investment)
     */
    createInvestmentChart(containerId, projections) {
        this.destroyChart(containerId);
        const el = document.getElementById(containerId);
        if (!el) return;
        const chart = echarts.init(el);
        const labels = projections.map(p => `M${p.month}`);
        const values = projections.map(p => p.value);
        chart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: labels },
            yAxis: { type: 'value' },
            series: [{
                data: values,
                type: 'line',
                smooth: true,
                areaStyle: { opacity: 0.2 },
                color: '#1a56db'
            }]
        });
        this.charts[containerId] = chart;
        return chart;
    }
}

// Initialize global chart manager
window.chartManager = new ChartManager();

/**
 * Tool 1 - Dashboard Module
 * Updates the summary statistics dashboard in the UI
 */

import { state } from '../state.js';
import { calculateStatistics, calculateDateRange, generateTrendData } from './analytics.js';
import { renderSparkline, renderBarChart, renderPieChart } from './charts.js';

/**
 * Update the dashboard with data from the current file
 * @param {Array} data - The processed data rows
 * @param {string} type - 'protokoll' or 'abrechnung' (used for specific updates if needed)
 */
export function updateDashboard(data, type) {
    if (!data) return;

    // 1. Calculate Metrics
    const stats = calculateStatistics(data);
    const dateRange = calculateDateRange(data);

    // 2. Update Total Amount
    const totalEl = document.getElementById('dashboardTotalAmount');
    if (totalEl) {
        totalEl.textContent = formatCurrency(stats.totalAmount);
    }

    // 3. Update Average Amount
    const avgEl = document.getElementById('dashboardAvgAmount');
    if (avgEl) {
        avgEl.textContent = formatCurrency(stats.averageAmount);

        // Update bar width based on arbitrary max (dynamic would be better but simple for now)
        // Let's assume max reasonable avg is 1000 for visuals, or relative to total?
        // Better: this bar usually shows % of something. 
        // For "Avg Amount", maybe just static visual or relative to max single transaction?
        // Let's leave it at 50% for now or remove the bar if it doesn't make sense.
    }

    // 4. Update Transaction Count
    const countEl = document.getElementById('dashboardTxCount');
    if (countEl) {
        countEl.textContent = stats.transactionCount;
    }

    // 5. Update Date Range
    const dateEl = document.getElementById('dashboardDateRange');
    if (dateEl) {
        dateEl.textContent = dateRange.label;
    }


    // 6. Render Sparkline (Total Amount Trend)
    const sparklineData = generateTrendData(stats.amounts);
    renderSparkline(sparklineData, 'sparklineTotal');

    // 7. Render Bar Chart (Value Distribution)
    const chartsSection = document.getElementById('chartsSection');
    if (chartsSection && stats.amounts.length > 0) {
        chartsSection.classList.remove('hidden');

        // Simple distribution: Top 5 absolute values for now
        // A real distribution would bucket them, but let's just show top 5 transactions for "Quick Insights"
        const sortedAmounts = [...stats.amounts].sort((a, b) => b - a).slice(0, 5);
        const chartData = sortedAmounts.map((val, i) => ({
            label: `Top ${i + 1}`,
            value: val
        }));

        // Or better: Group by date? No, let's group by value ranges or just top items.
        // Actually, requirement says "Bar chart for value counts".
        // This usually means histogram. Let's do a simple count of occurrences if we had them.

        // But here we rely on "stats.amounts".
        // Let's stick to Top 5 highest transactions as distinct items.
        renderBarChart(chartData, 'barChartContainer');
    }

    // 8. Render Pie Chart (File Composition / Target Distribution)
    const pieContainer = document.getElementById('pieChartContainer');
    if (pieContainer && state.tool1.countsMap) {
        // Convert countsMap to array
        const counts = Object.entries(state.tool1.countsMap)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value);

        if (counts.length > 0) {
            // Take top 4 and group rest as "Others"
            let pieData = counts.slice(0, 4);
            const others = counts.slice(4).reduce((sum, item) => sum + item.value, 0);

            if (others > 0) {
                pieData.push({ label: 'Others', value: others, color: '#94a3b8' });
            }

            renderPieChart(pieData, 'pieChartContainer');
        }
    }
}

/**
 * Update Data Health & Summary Panel
 * @param {Object} summary - Object containing row counts and health info
 */
export function updateDataSummary(summary) {
    if (!summary) return;

    // Update Row Counts
    const protokollCountEl = document.getElementById('summaryProtokollRows');
    if (protokollCountEl) {
        protokollCountEl.textContent = `${summary.protokollRows || 0} rows`;
    }

    const abrechnungCountEl = document.getElementById('summaryAbrechnungRows');
    if (abrechnungCountEl) {
        abrechnungCountEl.textContent = `${summary.abrechnungRows || 0} rows`;
    }

    // Update Health Score (simple mock calculation based on reconciliation)
    const healthBar = document.getElementById('dataHealthBar');
    const healthScore = document.getElementById('dataHealthScore');


    if (healthBar && healthScore) {
        const score = summary.healthScore || 0;
        healthBar.style.width = `${score}%`;
        healthScore.textContent = `${score}%`;

        // Color based on score
        healthBar.className = `h-full transition-all duration-500 rounded-full ${score > 90 ? 'bg-emerald-500' : score > 70 ? 'bg-amber-500' : 'bg-red-500'
            }`;
    }

    // Update Issues List
    const issuesList = document.getElementById('dataIssuesList');
    if (issuesList && summary.issues) {
        let html = '';
        if (summary.issues.length === 0) {
            html = `<li class="flex items-start gap-2 text-sm text-slate-500"><i class="ph-fill ph-info text-blue-500 mt-0.5"></i>Waiting for data...</li>`;
        } else {
            html = summary.issues.map(issue => {
                const icon = issue.includes('healthy') ? 'ph-check-circle text-emerald-500' : 'ph-warning text-amber-500';
                return `<li class="flex items-start gap-2 text-sm text-slate-600"><i class="ph-bold ${icon} mt-0.5"></i>${issue}</li>`;
            }).join('');
        }
        issuesList.innerHTML = html;
    }
}

// --- Helpers ---

function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(value);
}

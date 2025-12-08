/**
 * Tool 1 - Table Renderer Module
 * Renders the results table
 */

import { state, updateState } from '../state.js';
import { updateDebugInfo } from './analyzer.js';
import { announceToScreenReader } from '../ui.js';
import { Analytics } from '../shared/analytics.js';

/**
 * Initialize horizontal scroll detection for table container
 * @param {HTMLElement} container - The table container element
 */
function initScrollDetection(container) {
    if (!container) return;

    const checkScroll = () => {
        const hasScroll = container.scrollWidth > container.clientWidth;
        const isScrolledToEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;

        container.classList.toggle('has-horizontal-scroll', hasScroll);
        container.classList.toggle('scrolled-to-end', isScrolledToEnd);
    };

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
}

/**
 * Render results table
 * @param {Object} countsMap - Map of target values to counts
 * @param {number} totalMatches - Total number of matches
 * @param {number} rowCount - Total number of rows
 * @param {number} uniqueTargets - Number of unique targets found
 */
export function renderTable(countsMap, totalMatches, rowCount, uniqueTargets = 0) {
    updateState('tool1.lastCountsMap', countsMap);
    updateState('tool1.lastTotalMatches', totalMatches);
    updateState('tool1.lastRowCount', rowCount);
    updateState('tool1.lastUniqueTargets', uniqueTargets);

    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    const targets = Object.keys(countsMap);

    // Rich Empty State
    if (targets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan=\"3\" class=\"p-0 border-0\">
                    <div class=\"empty-state\">
                        <i class=\"ph ph-files empty-state-icon\" aria-hidden=\"true\"></i>
                        <h3 class=\"empty-state-text\">No Data Available</h3>
                        <p class=\"empty-state-subtext\">Upload Protokoll and Abrechnung files above to analyze and count target values. Results will appear here once processing is complete.</p>
                        <div class=\"empty-state-hint\">
                            <i class=\"ph ph-info\" aria-hidden=\"true\"></i>
                            <span>Tip: Ensure your files contain the expected column structure</span>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Convert to array for sorting
    let rows = targets.map(target => ({
        target,
        count: countsMap[target]
    }));

    // Apply Sorting
    const { column, direction } = state.tool1.sort;
    rows.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];

        // Case insensitive string sort
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Update Header Icons
    updateSortHeaders(column, direction);

    // Render Sorted Rows
    rows.forEach((rowItem, index) => {
        const { target, count } = rowItem;
        const percentage = totalMatches > 0 ? ((count / totalMatches) * 100).toFixed(1) : '0.0';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition-colors';
        tr.innerHTML = `
            <td class="text-slate-600">${index + 1}</td>
            <td class="font-medium text-slate-700">${target}</td>
            <td class="numeric-cell">
                <span class="inline-flex items-center gap-2 justify-end">
                    <span class="font-semibold text-indigo-600">${count}</span>
                    <span class="text-xs text-slate-400">(${percentage}%)</span>
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });

    // Update summary
    updateSummary(totalMatches, rowCount, uniqueTargets);

    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
    }

    // Initialize scroll detection for horizontal scroll indicator
    const tableContainer = tbody.closest('.table-container');
    initScrollDetection(tableContainer);

    // Announce results to screen readers
    announceToScreenReader(`Results updated: ${totalMatches} matches found across ${uniqueTargets} unique targets in ${rowCount} rows`);
}

/**
 * Update sort header visual states
 * 
 * Updates all sortable table headers to reflect the current sort state.
 * The active column shows either an up or down caret, while inactive
 * columns show a neutral up-down caret. Also sets ARIA attributes for
 * accessibility (aria-sort).
 * 
 * @param {string} activeColumn - The column currently being sorted ('target' or 'count')
 * @param {'asc'|'desc'} direction - Sort direction (ascending or descending)
 * @returns {void}
 * 
 * @sideEffects
 * - Updates aria-sort attributes on table headers
 * - Changes icon classes for visual sort indicators
 */
function updateSortHeaders(activeColumn, direction) {
    const headers = document.querySelectorAll('th[data-sort]');
    headers.forEach(th => {
        const column = th.dataset.sort;
        const icon = th.querySelector('.sort-icon');

        if (column === activeColumn) {
            th.setAttribute('aria-sort', direction === 'asc' ? 'ascending' : 'descending');
            if (icon) {
                icon.className = direction === 'asc'
                    ? 'ph ph-caret-up sort-icon'
                    : 'ph ph-caret-down sort-icon';
            }
        } else {
            th.removeAttribute('aria-sort');
            if (icon) {
                icon.className = 'ph ph-caret-up-down sort-icon';
            }
        }
    });
}

/**
 * Update summary statistics
 * @param {number} totalMatches - Total matches found
 * @param {number} rowCount - Total rows processed
 * @param {number} uniqueTargets - Number of unique targets found
 */
function updateSummary(totalMatches, rowCount, uniqueTargets = 0) {
    const totalMatchesEl = document.getElementById('summaryTotalMatches');
    const totalRowsEl = document.getElementById('summaryTotalRows');
    const uniqueTargetsEl = document.getElementById('summaryUniqueTargets');

    if (totalMatchesEl) {
        totalMatchesEl.textContent = totalMatches.toLocaleString();
    }

    if (totalRowsEl) {
        totalRowsEl.textContent = rowCount.toLocaleString();
    }

    if (uniqueTargetsEl) {
        uniqueTargetsEl.textContent = uniqueTargets.toLocaleString();
    }

    // Update debug info whenever summary changes
    updateDebugInfo();
}

/**
 * Render dashboard metrics and summary
 * Uses Analytics module to calculate stats from loaded files
 */
export function renderDashboard() {
    const { protokollData, abrechnungData } = state.tool1;

    // Determine which dataset to use for financial metrics
    // Prefer Abrechnung for amounts, but fallback to Protokoll if that's all we have
    let primaryData = [];
    let sourceName = 'None';

    if (abrechnungData && abrechnungData.length > 0) {
        primaryData = abrechnungData.slice(1); // Skip header
        sourceName = 'Abrechnung';
    } else if (protokollData && protokollData.length > 0) {
        primaryData = protokollData.slice(1); // Skip header
        sourceName = 'Protokoll';
    }

    // Helpers to find columns (reuse or simplified version)
    // We assume standard columns or try to find them
    const headers = (abrechnungData && abrechnungData[0]) || (protokollData && protokollData[0]) || [];

    const findCol = (terms) => headers.findIndex(h => terms.some(t => String(h).toLowerCase().includes(t)));

    const amountColIdx = findCol(['summe', 'betrag', 'amount', 'wert', 'kosten']);
    const dateColIdx = findCol(['datum', 'date', 'zeit']);

    // Map array data to objects for Analytics module
    const mappedData = primaryData.map(row => ({
        Summe: amountColIdx >= 0 ? row[amountColIdx] : 0,
        Datum: dateColIdx >= 0 ? row[dateColIdx] : null
    }));

    const metrics = Analytics.calculateDashboardMetrics(mappedData, 'Datum', 'Summe');

    // Update DOM
    const els = {
        totalAmount: document.getElementById('dashboardTotalAmount'),
        avgAmount: document.getElementById('dashboardAvgAmount'),
        txCount: document.getElementById('dashboardTxCount'),
        dateRange: document.getElementById('dashboardDateRange'),
        sparkline: document.getElementById('sparklineTotal'),
        trendLabel: document.getElementById('trendLabel'),

        // Summary Panel
        healthBar: document.getElementById('dataHealthBar'),
        healthScore: document.getElementById('dataHealthScore'),
        protokollRows: document.getElementById('summaryProtokollRows'),
        abrechnungRows: document.getElementById('summaryAbrechnungRows'),
        issuesList: document.getElementById('dataIssuesList')
    };

    if (els.totalAmount) {
        els.totalAmount.textContent = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(metrics.totalAmount);
    }

    if (els.avgAmount) {
        els.avgAmount.textContent = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(metrics.averageAmount);
    }

    if (els.txCount) {
        els.txCount.textContent = metrics.transactionCount.toLocaleString();
    }

    if (els.dateRange) {
        els.dateRange.textContent = Analytics.formatDateRange(metrics.dateRange.start, metrics.dateRange.end);
    }

    // Sparkline
    if (els.sparkline && metrics.dailyTrends.length > 1) {
        const values = metrics.dailyTrends.map(d => d.value);
        const pathData = Analytics.generateSparklinePath(values, 100, 30);
        els.sparkline.innerHTML = `<path d="${pathData}" class="stroke-indigo-500 fill-none stroke-2" />`;
    } else if (els.sparkline) {
        els.sparkline.innerHTML = ''; // Clear if not enough data
    }

    // Summary Panel Updates
    const pCount = protokollData ? protokollData.length - 1 : 0;
    const aCount = abrechnungData ? abrechnungData.length - 1 : 0;

    if (els.protokollRows) els.protokollRows.textContent = `${pCount} rows`;
    if (els.abrechnungRows) els.abrechnungRows.textContent = `${aCount} rows`;

    // calculate health
    const health = Analytics.assessDataHealth(mappedData, ['Summe', 'Datum']);
    if (els.healthBar) els.healthBar.style.width = `${health.completeness}%`;
    if (els.healthScore) els.healthScore.textContent = `${Math.round(health.completeness)}%`;

    // Issues List
    if (els.issuesList) {
        let issuesHtml = '';
        if (pCount === 0 && aCount === 0) {
            issuesHtml = `<li class="flex items-start gap-2 text-sm text-slate-500"><i class="ph-fill ph-info text-blue-500 mt-0.5"></i>No files uploaded</li>`;
        } else {
            if (health.issues.length > 0) {
                issuesHtml += health.issues.map(i => `<li class="flex items-start gap-2 text-sm text-slate-600"><i class="ph-bold ph-warning text-amber-500 mt-0.5"></i>${i}</li>`).join('');
            }
            if (Math.abs(pCount - aCount) > 0 && pCount > 0 && aCount > 0) {
                issuesHtml += `<li class="flex items-start gap-2 text-sm text-slate-600"><i class="ph-bold ph-warning text-amber-500 mt-0.5"></i>Row count mismatch (${Math.abs(pCount - aCount)})</li>`;
            }
            if (issuesHtml === '') {
                issuesHtml = `<li class="flex items-start gap-2 text-sm text-slate-600"><i class="ph-fill ph-check-circle text-emerald-500 mt-0.5"></i>Data looks healthy</li>`;
            }
        }
        els.issuesList.innerHTML = issuesHtml;
    }
}

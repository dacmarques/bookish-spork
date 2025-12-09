/**
 * Tool 1 - Table Renderer Module
 * Renders the results table
 */

import { state, updateState } from '../state.js';
import { updateDebugInfo } from './analyzer.js';
import { announceToScreenReader } from '../ui.js';
import { updateDashboard as updateDashboardUI, updateDataSummary } from './dashboard.js';
import { assessDataHealth } from './analytics.js';

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
    // Convert to array for sorting and filtering
    const filter = state.tool1.filter ? state.tool1.filter.toLowerCase() : '';

    let rows = targets
        .filter(target => !filter || target.toLowerCase().includes(filter))
        .map(target => ({
            target,
            count: countsMap[target]
        }));

    // Check if empty after filter
    if (rows.length === 0 && targets.length > 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="p-8 text-center text-slate-500">
                    <i class="ph ph-magnifying-glass text-3xl mb-2 block text-slate-400"></i>
                    No results found for "${state.tool1.filter}"
                </td>
            </tr>
        `;
        return;
    } else if (targets.length === 0) {
        // Original empty state check
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="p-0 border-0">
                    <div class="empty-state">
                        <i class="ph ph-files empty-state-icon" aria-hidden="true"></i>
                        <h3 class="empty-state-text">No Data Available</h3>
                        <p class="empty-state-subtext">Upload Protokoll and Abrechnung files above to analyze and count target values. Results will appear here once processing is complete.</p>
                        <div class="empty-state-hint">
                            <i class="ph ph-info" aria-hidden="true"></i>
                            <span>Tip: Ensure your files contain the expected column structure</span>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

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



// ... (existing code stays the same until renderDashboard)

/**
 * Render dashboard metrics and summary
 * Uses Analytics module to calculate stats from loaded files
 */
export function renderDashboard() {
    const { protokollData, abrechnungData } = state.tool1;

    // Determine which dataset to use for financial metrics
    let primaryData = null;

    if (abrechnungData && abrechnungData.length > 0) {
        primaryData = abrechnungData;
    } else if (protokollData && protokollData.length > 0) {
        primaryData = protokollData;
    }

    // Update Main Dashboard Cards
    if (primaryData) {
        updateDashboardUI(primaryData);
    }

    // Update Data Summary Panel
    const pCount = protokollData ? protokollData.length - 1 : 0;
    const aCount = abrechnungData ? abrechnungData.length - 1 : 0;

    // Check health of the primary data (or the most relevant one)
    const health = primaryData ? assessDataHealth(primaryData) : { score: 0, issues: [] };

    const summary = {
        protokollRows: pCount,
        abrechnungRows: aCount,
        healthScore: health.score,
        issues: health.issues
    };

    // Add row mismatch warning if both files present
    if (pCount > 0 && aCount > 0 && Math.abs(pCount - aCount) > 0) {
        summary.issues.push(`Row count mismatch (${Math.abs(pCount - aCount)})`);
    }

    updateDataSummary(summary);
}

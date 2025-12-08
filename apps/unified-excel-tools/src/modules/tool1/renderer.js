/**
 * Tool 1 - Table Renderer Module
 * Renders the results table
 */

import { state, updateState } from '../state.js';
import { updateDebugInfo } from './analyzer.js';

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
                <td colspan="3" class="p-0 border-0">
                    <div class="empty-state">
                        <i class="ph ph-files empty-state-icon" aria-hidden="true"></i>
                        <h3 class="empty-state-text">No Data Available</h3>
                        <p class="empty-state-subtext">Upload a Protokoll and Abrechnung file to generic counts and targets.</p>
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
            <td class="text-right">
                <span class="inline-flex items-center gap-2">
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

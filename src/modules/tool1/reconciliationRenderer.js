/**
 * Tool 1 - Reconciliation Renderer Module
 * Renders reconciliation results in the UI
 */

import { state } from '../state.js';
import { performReconciliation, getReconciliationSummary, exportReconciliationToCSV } from './reconciliation.js';

/**
 * Render reconciliation view
 */
export function renderReconciliation() {
    const reconciliation = state.tool1.reconciliation;
    
    if (!reconciliation) {
        return;
    }

    const section = document.getElementById('reconciliationSection');
    if (section) {
        section.classList.remove('hidden');
    }

    // Update summary cards
    updateSummaryCards();

    // Render table
    renderReconciliationTable();
}

/**
 * Update summary cards
 */
function updateSummaryCards() {
    const summary = getReconciliationSummary();

    document.getElementById('reconciliationMatches').textContent = summary.matchCount.toLocaleString();
    document.getElementById('reconciliationMatchPercent').textContent = `${summary.matchPercentage}% match rate`;
    document.getElementById('reconciliationDiscrepancies').textContent = summary.discrepancyCount.toLocaleString();
    document.getElementById('reconciliationMissing').textContent = 
        (summary.missingInAbrechnung + summary.missingInProtokoll).toLocaleString();
    document.getElementById('reconciliationTotal').textContent = 
        Math.max(summary.totalProtokoll, summary.totalAbrechnung).toLocaleString();
}

/**
 * Render reconciliation table
 * @param {string} filterType - Filter type (all, matches, discrepancies)
 */
export function renderReconciliationTable(filterType = 'all') {
    const reconciliation = state.tool1.reconciliation;
    
    if (!reconciliation) {
        return;
    }

    const tbody = document.getElementById('reconciliationTableBody');
    if (!tbody) return;

    const { matches, discrepancies } = reconciliation;
    const searchTerm = document.getElementById('reconciliationSearch')?.value.toLowerCase() || '';

    let items = [];

    // Filter items based on tab
    if (filterType === 'all') {
        items = [...matches, ...discrepancies];
    } else if (filterType === 'matches') {
        items = matches;
    } else if (filterType === 'discrepancies') {
        items = discrepancies;
    }

    // Filter by search term
    if (searchTerm) {
        items = items.filter(item => 
            item.orderNumber.toLowerCase().includes(searchTerm)
        );
    }

    // Render rows
    if (items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-slate-400">
                    <i class="ph ph-magnifying-glass text-4xl mb-2 block" aria-hidden="true"></i>
                    No results found
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items.map(item => {
        const rowClass = getRowClass(item.type);
        const badge = getStatusBadge(item.type);
        const protokollAmount = item.protokollData ? formatCurrency(item.protokollData.amount) : 'N/A';
        const abrechnungAmount = item.abrechnungData ? formatCurrency(item.abrechnungData.amount) : 'N/A';
        const difference = item.difference ? formatCurrency(item.difference) : '—';
        const message = item.message || 'Amounts match';

        return `
            <tr class="${rowClass}">
                <td class="px-4 py-3 text-sm font-medium text-slate-800">
                    ${item.orderNumber}
                </td>
                <td class="px-4 py-3">
                    ${badge}
                </td>
                <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">
                    ${protokollAmount}
                </td>
                <td class="px-4 py-3 text-sm text-right font-medium text-slate-800">
                    ${abrechnungAmount}
                </td>
                <td class="px-4 py-3 text-sm text-right font-medium ${item.difference ? 'text-amber-600' : 'text-slate-500'}">
                    ${difference}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600">
                    ${message}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Get row class based on type
 */
function getRowClass(type) {
    const classes = {
        'match': 'reconciliation-row-match',
        'missing_in_abrechnung': 'reconciliation-row-missing',
        'missing_in_protokoll': 'reconciliation-row-missing',
        'amount_mismatch': 'reconciliation-row-discrepancy'
    };
    
    return classes[type] || '';
}

/**
 * Get status badge HTML
 */
function getStatusBadge(type) {
    const badges = {
        'match': `
            <span class="reconciliation-badge reconciliation-badge-match">
                <i class="ph-fill ph-check-circle" aria-hidden="true"></i>
                Match
            </span>
        `,
        'missing_in_abrechnung': `
            <span class="reconciliation-badge reconciliation-badge-missing">
                <i class="ph-fill ph-x-circle" aria-hidden="true"></i>
                Missing in Abrechnung
            </span>
        `,
        'missing_in_protokoll': `
            <span class="reconciliation-badge reconciliation-badge-missing">
                <i class="ph-fill ph-x-circle" aria-hidden="true"></i>
                Missing in Protokoll
            </span>
        `,
        'amount_mismatch': `
            <span class="reconciliation-badge reconciliation-badge-discrepancy">
                <i class="ph-fill ph-warning" aria-hidden="true"></i>
                Amount Mismatch
            </span>
        `
    };
    
    return badges[type] || '';
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
}

/**
 * Setup reconciliation event handlers
 */
export function setupReconciliationHandlers() {
    // Tab switching
    document.querySelectorAll('[data-reconciliation-tab]').forEach(button => {
        button.addEventListener('click', (e) => {
            // Prevent default to avoid any scroll interference
            e.preventDefault();
            
            const tab = e.currentTarget.dataset.reconciliationTab;
            
            // Update active state
            document.querySelectorAll('[data-reconciliation-tab]').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            e.currentTarget.classList.add('active');
            e.currentTarget.setAttribute('aria-selected', 'true');
            
            // Render filtered table without scrolling
            renderReconciliationTable(tab);
        });
        
        // Add keyboard support
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
    });

    // Search
    const searchInput = document.getElementById('reconciliationSearch');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const activeTab = document.querySelector('[data-reconciliation-tab].active');
            const filterType = activeTab ? activeTab.dataset.reconciliationTab : 'all';
            renderReconciliationTable(filterType);
        });
    }

    // Refresh
    const refreshBtn = document.getElementById('reconciliationRefreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            performReconciliation();
            renderReconciliation();
        });
    }

    // Export
    const exportBtn = document.getElementById('reconciliationExportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const csv = exportReconciliationToCSV();
            downloadCSV(csv, 'reconciliation-results.csv');
        });
    }
}

/**
 * Download CSV file
 */
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Hide reconciliation section
 */
export function hideReconciliation() {
    const section = document.getElementById('reconciliationSection');
    if (section) {
        section.classList.add('hidden');
    }
}

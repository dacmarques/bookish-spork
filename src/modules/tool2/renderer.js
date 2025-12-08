/**
 * Tool 2 - Smart Extractor Renderer
 * Handles table rendering and UI updates
 */

import { state } from '../state.js';
import { showToast } from '../toast.js';
import { announceToScreenReader } from '../ui.js';
import { createVirtualScroller, shouldUseVirtualScroll } from '../virtualScroll.js';
import { exportToExcel } from '../shared/export-utils.js';

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

// Virtual scroller instance (module-level)
let virtualScroller = null;

/**
 * Create a table row element for a data item
 * @param {Object} data - Row data
 * @returns {HTMLTableRowElement} Table row element
 */
function createTableRow(data) {
    const tr = document.createElement('tr');
    const hasBemerkung = data.bemerkung && String(data.bemerkung).trim().length > 0;
    const baseBg = hasBemerkung ? "bg-orange-50" : "bg-white";
    tr.className = `${baseBg} hover:bg-blue-50 transition-colors fade-in group`;

    // Format Currency for Display
    const sumDisplay = (data.sumRaw > 0)
        ? data.sumRaw.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
        : '-';

    // Safe HTML injection helper
    const safe = (txt) => txt ? String(txt) : '';

    // Validation checks
    const isAuftragsNrMissing = !data.auftragsNr || String(data.auftragsNr).trim() === '';
    const isAnlageMissing = !data.anlage || String(data.anlage).trim() === '';
    const isDatumInvalid = !data.datum || !/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(String(data.datum));
    const isSumInvalid = data.sumRaw <= 0;

    tr.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-400 border-b border-slate-100">
            <div class="flex items-center gap-2 max-w-[150px]">
                <i data-lucide="file" class="w-3 h-3 flex-shrink-0" aria-hidden="true"></i>
                <span class="truncate" title="${safe(data.fileName)}">${safe(data.fileName)}</span>
            </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-700 font-mono text-xs bg-slate-50 rounded ${isAuftragsNrMissing ? 'validation-error' : ''}" 
            title="${isAuftragsNrMissing ? 'Missing Auftrag-Nr.' : ''}"
            ${isAuftragsNrMissing ? 'aria-invalid="true" aria-describedby="error-auftragsNr"' : ''}>
            ${safe(data.auftragsNr) || '<span class="text-slate-400 italic" role="alert">Missing</span>'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-600 text-xs max-w-[150px] truncate ${isAnlageMissing ? 'validation-warning' : ''}" 
            title="${isAnlageMissing ? 'Missing Anlage' : safe(data.anlage)}"
            ${isAnlageMissing ? 'aria-invalid="true"' : ''}>
            ${safe(data.anlage) || '<span class="text-slate-400 italic" role="alert">Missing</span>'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-600 text-xs max-w-[150px] truncate" title="${safe(data.einsatzort)}">${safe(data.einsatzort)}</td>
        <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-700 ${isDatumInvalid ? 'validation-warning' : ''}" 
            title="${isDatumInvalid ? 'Invalid date format' : ''}"
            ${isDatumInvalid ? 'aria-invalid="true"' : ''}>
            ${safe(data.datum) || '<span class="text-slate-400 italic" role="alert">Missing</span>'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-600 text-center text-right numeric">${safe(data.fachmonteur)}</td>
        <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-right font-mono text-slate-800 font-semibold numeric ${isSumInvalid ? 'validation-warning' : ''}" 
            title="${isSumInvalid ? 'Invalid or zero sum' : ''}"
            ${isSumInvalid ? 'aria-invalid="true"' : ''}>
            ${sumDisplay}
        </td>
        <td class="px-6 py-4 border-b border-slate-100 text-slate-500 text-xs min-w-[200px] leading-relaxed">${safe(data.bemerkung)}</td>
    `;

    return tr;
}

/**
 * Render the extracted data table with virtual scrolling for large datasets
 */
export function renderTable() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    // Clear Table
    tableBody.innerHTML = '';

    // Filter
    let filtered = state.tool2.extractedData.filter(item => {
        if (!state.tool2.filter) return true;
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(state.tool2.filter)
        );
    });

    // Sort
    if (state.tool2.sort.column) {
        const col = state.tool2.sort.column;
        const dir = state.tool2.sort.direction === 'asc' ? 1 : -1;

        filtered.sort((a, b) => {
            let valA = a[col];
            let valB = b[col];

            // Numeric sort for Sum
            if (col === 'sumRaw') {
                return (valA - valB) * dir;
            }

            // String sort
            return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
        });
    }

    // Update Sort Icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.classList.add('opacity-30');
        icon.setAttribute('data-lucide', 'chevrons-up-down');
        icon.classList.remove('text-blue-600', 'opacity-100');
    });

    if (state.tool2.sort.column) {
        const activeIcon = document.getElementById(`sort-${state.tool2.sort.column}`);
        if (activeIcon) {
            activeIcon.setAttribute('data-lucide', state.tool2.sort.direction === 'asc' ? 'chevron-up' : 'chevron-down');
            activeIcon.classList.remove('opacity-30');
            activeIcon.classList.add('opacity-100', 'text-blue-600');
        }
    }

    // Render Rows - Use virtual scrolling for large datasets
    const emptyState = document.getElementById('empty-state');
    if (filtered.length === 0) {
        if (emptyState) {
            tableBody.appendChild(emptyState);
            if (state.tool2.extractedData.length > 0) {
                const emptyText = emptyState.querySelector('.empty-state-title');
                if (emptyText) emptyText.textContent = "Keine Ergebnisse für den Filter";
                emptyState.style.display = 'table-row';
            }
        }
    } else {
        // Use virtual scrolling for datasets larger than 100 rows
        if (shouldUseVirtualScroll(filtered.length, 100)) {
            // Destroy existing virtual scroller if present
            if (virtualScroller) {
                virtualScroller.destroy();
            }

            const tableContainer = tableBody.closest('.overflow-auto');
            if (tableContainer) {
                // Create virtual scroller
                virtualScroller = createVirtualScroller({
                    container: tableContainer,
                    data: filtered,
                    rowHeight: 60, // Approximate row height in pixels
                    renderRow: (data) => createTableRow(data),
                    overscan: 10 // Render 10 extra rows above/below viewport
                });
            }
        } else {
            // Standard rendering for smaller datasets
            filtered.forEach(data => {
                const tr = createTableRow(data);
                tableBody.appendChild(tr);
            });
        }
    }

    // Re-initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();

    // Initialize scroll detection for horizontal scroll indicator
    const tableContainer = tableBody.closest('.overflow-auto');
    initScrollDetection(tableContainer);

    // Announce to screen readers
    if (filtered.length > 0) {
        announceToScreenReader(`Table updated: Showing ${filtered.length} records`);
    }
}

/**
 * Update UI elements (totals, counts, buttons)
 */
export function updateUI() {
    const totalDisplay = document.getElementById('total-display');
    const countDisplay = document.getElementById('count-display');
    const badgeCount = document.getElementById('record-count-badge');
    const exportBtn = document.getElementById('btn-export');
    const exportCsvBtn = document.getElementById('btn-export-csv');
    const exportJsonBtn = document.getElementById('btn-export-json');
    const copyBtn = document.getElementById('btnCopyTable2');

    if (totalDisplay) {
        totalDisplay.textContent = state.tool2.totalSum.toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR'
        });
    }

    if (countDisplay) {
        countDisplay.textContent = state.tool2.validRecords;
    }

    if (badgeCount) {
        badgeCount.textContent = state.tool2.validRecords;
        if (state.tool2.validRecords > 0) {
            badgeCount.classList.remove('hidden');
        }
    }

    if (state.tool2.validRecords > 0) {
        if (exportBtn) exportBtn.disabled = false;
        if (exportCsvBtn) exportCsvBtn.disabled = false;
        if (exportJsonBtn) exportJsonBtn.disabled = false;

        if (copyBtn) {
            copyBtn.disabled = false;
        }
    }

    // Update global state - Tool 2 file count and sum
    if (window.updateToolFileCount) {
        window.updateToolFileCount('tool2', state.tool2.validRecords);
    }
    if (window.updateToolSum) {
        window.updateToolSum('tool2', state.tool2.totalSum);
    }
}

/**
 * Clear all table data
 */
export function clearTable() {
    const tableBody = document.getElementById('table-body');
    const emptyState = document.getElementById('empty-state');

    if (tableBody) {
        tableBody.innerHTML = '';
        if (emptyState) {
            tableBody.appendChild(emptyState);
            emptyState.style.display = 'table-row';
        }
    }

    // Reset State
    state.tool2.totalSum = 0;
    state.tool2.validRecords = 0;
    state.tool2.extractedData = [];

    // Reset UI
    const badgeCount = document.getElementById('record-count-badge');
    const exportBtn = document.getElementById('btn-export');
    const exportCsvBtn = document.getElementById('btn-export-csv');
    const exportJsonBtn = document.getElementById('btn-export-json');

    if (badgeCount) badgeCount.classList.add('hidden');
    if (exportBtn) exportBtn.disabled = true;
    if (exportCsvBtn) exportCsvBtn.disabled = true;
    if (exportJsonBtn) exportJsonBtn.disabled = true;

    updateUI();
    showToast('Tabelle geleert', 'success');
}



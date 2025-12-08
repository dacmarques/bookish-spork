/**
 * Tool 3 - Row Manager Renderer
 * Handles table rendering and UI updates
 */

import { state } from '../state.js';
import { announceToScreenReader } from '../ui.js';

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
 * Render the data table with drag-and-drop support
 * 
 * Generates a complete interactive table from state.tool3.data with features:
 * - Checkbox column for row selection
 * - Draggable rows for reordering
 * - Selection highlighting (indigo background)
 * - Sticky action buttons column on the right
 * - Row hover effects
 * - Copy and bulk copy action buttons
 * 
 * Performance: Uses DocumentFragment for efficient batch DOM insertion.
 * 
 * @returns {void}
 * 
 * @sideEffects
 * - Updates table header (headers + checkbox + actions)
 * - Clears and rebuilds tbody with all data rows
 * - Updates row count status display
 * - Enables/disables copy table button based on data presence
 * - Syncs checkbox states with state.tool3.selectedIndices
 * - Sets data-index attributes for event handling
 * - Applies draggable=true to all rows
 */
export function renderTable() {
    const tbody = document.getElementById('rm-tbody');
    const theadTr = document.getElementById('rm-thead-tr');
    const statusEl = document.getElementById('rm-status');

    if (!tbody || !theadTr) return;

    // Update status
    if (statusEl) {
        statusEl.textContent = `${state.tool3.data.length} Rows`;
    }

    // Enable copy table button if there's data
    const copyBtn = document.getElementById('btnCopyTable3');
    if (copyBtn && state.tool3.data.length > 0) {
        copyBtn.disabled = false;
        copyBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    } else if (copyBtn) {
        copyBtn.disabled = true;
        copyBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    // Render Headers
    const checkboxHeader = `<th class="w-10 px-4 py-3 bg-slate-50 border-b border-slate-200 text-center">
        <input type="checkbox" id="rm-select-all" 
               class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
               aria-label="Select all rows">
    </th>`;
    const dragHeader = `<th class="w-10 px-4 py-3 bg-slate-50 border-b border-slate-200 text-center" aria-label="Drag to reorder">
        <i class="ph ph-dots-six-vertical text-slate-400" aria-hidden="true"></i>
    </th>`;
    const dataHeaders = state.tool3.headers.map(h => 
        `<th class="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-slate-50 border-b border-slate-200">${h || '-'}</th>`
    ).join('');
    const actionsHeader = `<th class="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50 border-b border-slate-200 sticky right-0 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] z-20">Actions</th>`;

    theadTr.innerHTML = checkboxHeader + dragHeader + dataHeaders + actionsHeader;

    // Render Body
    tbody.innerHTML = '';

    const fragment = document.createDocumentFragment();

    state.tool3.data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.dataset.index = index;

        // Initial Selection State
        const isSelected = state.tool3.selectedIndices.has(index);
        const bgClass = isSelected ? 'bg-indigo-50' : 'bg-white';

        tr.className = `hover:bg-indigo-50 transition-colors ${bgClass} group border-b border-slate-100`;
        tr.setAttribute('tabindex', '0');
        tr.setAttribute('role', 'row');
        tr.setAttribute('aria-label', `Row ${index + 1}. Press Alt+Arrow Up or Down to reorder, Space to select`);

        // Selection Checkbox
        let html = `<td class="px-4 py-2 text-center w-10">
            <input type="checkbox" 
                   class="rm-row-checkbox rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" 
                   data-index="${index}" 
                   ${isSelected ? 'checked' : ''}
                   aria-label="Select row ${index + 1}">
        </td>`;
        
        // Drag Handle
        html += `<td class="px-4 py-2 text-center w-10">
            <div class="drag-handle cursor-grab active:cursor-grabbing" 
                 role="button"
                 tabindex="-1"
                 aria-label="Drag to reorder row ${index + 1}">
                <i class="ph ph-dots-six-vertical text-slate-400 group-hover:text-indigo-600" aria-hidden="true"></i>
            </div>
        </td>`;

        // Cells
        html += row.map(cell => {
            const cellStr = String(cell || '');
            return `<td class="px-4 py-2 whitespace-nowrap text-slate-700 text-xs min-w-[80px] max-w-[300px] truncate" title="${cellStr.replace(/"/g, '&quot;')}">${cellStr}</td>`;
        }).join('');

        // Actions
        html += `
            <td class="px-4 py-2 whitespace-nowrap text-right sticky right-0 bg-white group-hover:bg-indigo-50 shadow-[-10px_0_10px_-5px_rgba(0,0,0,0.05)] z-10">
                <div class="flex justify-end gap-2">
                    <button onclick="window.rmCopyRow(${index})" 
                            title="Copy Row" 
                            aria-label="Copy row ${index + 1} to clipboard"
                            class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all min-w-[32px] min-h-[32px]">
                        <i class="ph ph-copy text-lg" aria-hidden="true"></i>
                    </button>
                    <button onclick="window.rmBulkCopy(${index})" 
                            title="Bulk Copy (Next 22)" 
                            aria-label="Copy 22 rows starting from row ${index + 1}"
                            class="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded border border-transparent hover:border-slate-200 transition-all min-w-[32px] min-h-[32px]">
                        <i class="ph ph-stack text-lg" aria-hidden="true"></i>
                    </button>
                </div>
            </td>
        `;
        tr.innerHTML = html;
        fragment.appendChild(tr);
    });
    tbody.appendChild(fragment);

    // Update select all checkbox
    updateSelectAllCheckbox();
    
    // Initialize scroll detection for horizontal scroll indicator
    const tableContainer = tbody.closest('.overflow-auto, .table-container');
    initScrollDetection(tableContainer);
}

/**
 * Update selection UI for all rows
 * 
 * Synchronizes the visual selection state of all table rows with the
 * state.tool3.selectedIndices Set. Updates background colors, checkbox
 * states, and the "Select All" checkbox. Called after selection changes
 * to ensure UI reflects the current selection state.
 * 
 * @returns {void}
 * 
 * @sideEffects
 * - Updates background color (bg-indigo-50 or bg-white) for all rows
 * - Checks/unchecks all row checkboxes based on selection state
 * - Updates "Select All" checkbox (checked, indeterminate, or unchecked)
 * - Updates selection count in status text
 */
export function updateSelectionUI() {
    const tbody = document.getElementById('rm-tbody');
    const statusEl = document.getElementById('rm-status');

    if (!tbody) return;

    // Update Select All Checkbox
    updateSelectAllCheckbox();

    // Update Rows
    const rows = tbody.children;
    for (let i = 0; i < rows.length; i++) {
        const tr = rows[i];
        const index = parseInt(tr.dataset.index, 10);
        const checkbox = tr.querySelector('.rm-row-checkbox');

        if (state.tool3.selectedIndices.has(index)) {
            tr.classList.add('bg-indigo-50');
            tr.classList.remove('bg-white');
            if (checkbox) checkbox.checked = true;
        } else {
            tr.classList.remove('bg-indigo-50');
            tr.classList.add('bg-white');
            if (checkbox) checkbox.checked = false;
        }
    }

    // Update Status Text
    if (statusEl) {
        if (state.tool3.selectedIndices.size > 0) {
            const statusText = `${state.tool3.selectedIndices.size} of ${state.tool3.data.length} Selected`;
            statusEl.textContent = statusText;
            announceToScreenReader(statusText);
        } else {
            statusEl.textContent = `${state.tool3.data.length} Rows`;
        }
    }
}

/**
 * Update the select all checkbox state
 */
function updateSelectAllCheckbox() {
    const selectAllCb = document.getElementById('rm-select-all');
    if (!selectAllCb) return;

    const allSelected = state.tool3.data.length > 0 && 
                       state.tool3.selectedIndices.size === state.tool3.data.length;
    const someSelected = state.tool3.selectedIndices.size > 0 && 
                        state.tool3.selectedIndices.size < state.tool3.data.length;
    
    selectAllCb.checked = allSelected;
    selectAllCb.indeterminate = someSelected;
}

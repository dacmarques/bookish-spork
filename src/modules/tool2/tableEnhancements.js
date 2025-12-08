/**
 * Tool 2 - Advanced Table Features
 * Column visibility, filtering, inline editing, row selection, and bulk actions
 */

import { state } from '../state.js';
import { renderTable, updateUI } from './renderer.js';
import { showToast } from '../toast.js';
import { announceToScreenReader } from '../ui.js';

// Table enhancement state
const tableState = {
    hiddenColumns: new Set(),
    selectedRows: new Set(),
    editingCell: null,
    unsavedChanges: new Map(),
    columnFilters: {},
    searchTerm: ''
};

/**
 * Initialize advanced table features
 */
export function initTableEnhancements() {
    setupColumnVisibilityMenu();
    setupAdvancedFiltering();
    setupInlineEditing();
    setupRowSelection();
    setupBulkActions();
    
    console.log('Advanced table features initialized');
}

/**
 * Setup column visibility toggle menu
 */
function setupColumnVisibilityMenu() {
    const tableContainer = document.querySelector('#tool2-content .overflow-auto');
    if (!tableContainer) return;

    // Create column visibility button in table header area
    const controlsBar = document.querySelector('#tool2-content .flex.flex-wrap.items-center');
    if (!controlsBar) return;

    const columnBtn = document.createElement('button');
    columnBtn.className = 'btn btn-secondary';
    columnBtn.innerHTML = '<i class="ph ph-columns text-lg"></i> Columns';
    columnBtn.setAttribute('aria-label', 'Toggle column visibility');
    columnBtn.id = 'btn-column-visibility';

    // Insert after filter input
    const filterInput = document.getElementById('filter-input-extractor');
    if (filterInput && filterInput.parentElement) {
        filterInput.parentElement.after(columnBtn);
    }

    // Create dropdown menu
    const menu = document.createElement('div');
    menu.id = 'column-visibility-menu';
    menu.className = 'absolute bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50 hidden';
    menu.style.minWidth = '200px';
    menu.innerHTML = `
        <div class="text-xs font-semibold text-slate-700 mb-2 pb-2 border-b border-slate-200">
            Column Visibility
        </div>
        <div class="space-y-2" id="column-checkboxes"></div>
    `;
    document.body.appendChild(menu);

    // Define columns (excluding File which should always be visible)
    const columns = [
        { id: 'auftragsNr', label: 'Auftrag Nr.' },
        { id: 'anlage', label: 'Anlage' },
        { id: 'einsatzort', label: 'Einsatzort' },
        { id: 'datum', label: 'Datum' },
        { id: 'fachmonteur', label: 'Std.' },
        { id: 'sumRaw', label: 'Summe' },
        { id: 'bemerkung', label: 'Bemerkung' }
    ];

    const checkboxContainer = menu.querySelector('#column-checkboxes');
    columns.forEach(col => {
        const label = document.createElement('label');
        label.className = 'flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded';
        label.innerHTML = `
            <input type="checkbox" checked data-column="${col.id}" 
                   class="column-toggle w-4 h-4 text-blue-600 rounded border-slate-300">
            <span class="text-sm text-slate-700">${col.label}</span>
        `;
        checkboxContainer.appendChild(label);
    });

    // Toggle menu visibility
    columnBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = columnBtn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 5}px`;
        menu.style.left = `${rect.left}px`;
        menu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== columnBtn) {
            menu.classList.add('hidden');
        }
    });

    // Handle column toggle
    checkboxContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('column-toggle')) {
            const columnId = e.target.dataset.column;
            if (e.target.checked) {
                tableState.hiddenColumns.delete(columnId);
            } else {
                tableState.hiddenColumns.add(columnId);
            }
            applyColumnVisibility();
            announceToScreenReader(`Column ${columnId} ${e.target.checked ? 'shown' : 'hidden'}`);
        }
    });
}

/**
 * Apply column visibility settings to table
 */
function applyColumnVisibility() {
    const columnMap = {
        'auftragsNr': 1,
        'anlage': 2,
        'einsatzort': 3,
        'datum': 4,
        'fachmonteur': 5,
        'sumRaw': 6,
        'bemerkung': 7
    };

    tableState.hiddenColumns.forEach(colId => {
        const colIndex = columnMap[colId];
        if (colIndex !== undefined) {
            // Hide header
            const headers = document.querySelectorAll('#tool2-content thead th');
            if (headers[colIndex]) {
                headers[colIndex].style.display = 'none';
            }
            // Hide cells
            document.querySelectorAll(`#table-body tr td:nth-child(${colIndex + 1})`).forEach(cell => {
                cell.style.display = 'none';
            });
        }
    });

    // Show visible columns
    Object.entries(columnMap).forEach(([colId, colIndex]) => {
        if (!tableState.hiddenColumns.has(colId)) {
            const headers = document.querySelectorAll('#tool2-content thead th');
            if (headers[colIndex]) {
                headers[colIndex].style.display = '';
            }
            document.querySelectorAll(`#table-body tr td:nth-child(${colIndex + 1})`).forEach(cell => {
                cell.style.display = '';
            });
        }
    });
}

/**
 * Setup advanced filtering with column-specific filters
 */
function setupAdvancedFiltering() {
    const controlsBar = document.querySelector('#tool2-content .flex.flex-wrap.items-center');
    if (!controlsBar) return;

    // Add filter button
    const filterBtn = document.createElement('button');
    filterBtn.className = 'btn btn-secondary';
    filterBtn.innerHTML = '<i class="ph ph-funnel text-lg"></i> Filters';
    filterBtn.id = 'btn-advanced-filters';
    
    const columnBtn = document.getElementById('btn-column-visibility');
    if (columnBtn) {
        columnBtn.after(filterBtn);
    }

    // Create filter panel
    const filterPanel = document.createElement('div');
    filterPanel.id = 'advanced-filter-panel';
    filterPanel.className = 'absolute bg-white rounded-lg shadow-lg border border-slate-200 p-4 z-50 hidden';
    filterPanel.style.minWidth = '300px';
    filterPanel.innerHTML = `
        <div class="text-xs font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200 flex justify-between items-center">
            <span>Advanced Filters</span>
            <button id="clear-all-filters" class="text-blue-600 hover:text-blue-700 text-xs font-normal">
                Clear All
            </button>
        </div>
        <div class="space-y-3">
            <div>
                <label class="text-xs text-slate-600 mb-1 block">Auftrag Nr.</label>
                <input type="text" data-filter="auftragsNr" 
                       class="filter-input w-full px-2 py-1 text-sm border border-slate-300 rounded">
            </div>
            <div>
                <label class="text-xs text-slate-600 mb-1 block">Anlage</label>
                <input type="text" data-filter="anlage" 
                       class="filter-input w-full px-2 py-1 text-sm border border-slate-300 rounded">
            </div>
            <div>
                <label class="text-xs text-slate-600 mb-1 block">Date Range</label>
                <div class="flex gap-2">
                    <input type="date" data-filter="datumFrom" 
                           class="filter-input w-full px-2 py-1 text-sm border border-slate-300 rounded">
                    <input type="date" data-filter="datumTo" 
                           class="filter-input w-full px-2 py-1 text-sm border border-slate-300 rounded">
                </div>
            </div>
            <div>
                <label class="text-xs text-slate-600 mb-1 block">Amount Range (€)</label>
                <div class="flex gap-2">
                    <input type="number" data-filter="sumMin" placeholder="Min" 
                           class="filter-input w-full px-2 py-1 text-sm border border-slate-300 rounded">
                    <input type="number" data-filter="sumMax" placeholder="Max" 
                           class="filter-input w-full px-2 py-1 text-sm border border-slate-300 rounded">
                </div>
            </div>
        </div>
        <div id="active-filter-count" class="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500 hidden">
            <i class="ph ph-funnel-simple"></i> <span id="filter-count">0</span> active filters
        </div>
    `;
    document.body.appendChild(filterPanel);

    // Toggle filter panel
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = filterBtn.getBoundingClientRect();
        filterPanel.style.top = `${rect.bottom + 5}px`;
        filterPanel.style.left = `${rect.left}px`;
        filterPanel.classList.toggle('hidden');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
        if (!filterPanel.contains(e.target) && e.target !== filterBtn) {
            filterPanel.classList.add('hidden');
        }
    });

    // Handle filter changes
    filterPanel.addEventListener('input', (e) => {
        if (e.target.classList.contains('filter-input')) {
            const filterKey = e.target.dataset.filter;
            const value = e.target.value.trim();
            
            if (value) {
                tableState.columnFilters[filterKey] = value;
            } else {
                delete tableState.columnFilters[filterKey];
            }
            
            applyAdvancedFilters();
            updateFilterCount();
        }
    });

    // Clear all filters
    document.getElementById('clear-all-filters')?.addEventListener('click', () => {
        tableState.columnFilters = {};
        filterPanel.querySelectorAll('.filter-input').forEach(input => input.value = '');
        applyAdvancedFilters();
        updateFilterCount();
        showToast('All filters cleared', 'info');
    });
}

/**
 * Apply advanced filters to data
 */
function applyAdvancedFilters() {
    // Store original filter function
    const originalFilter = state.tool2.filter;
    
    // Apply column-specific filters
    state.tool2.customFilter = (item) => {
        // Text filters
        if (tableState.columnFilters.auftragsNr && 
            !String(item.auftragsNr).toLowerCase().includes(tableState.columnFilters.auftragsNr.toLowerCase())) {
            return false;
        }
        if (tableState.columnFilters.anlage && 
            !String(item.anlage).toLowerCase().includes(tableState.columnFilters.anlage.toLowerCase())) {
            return false;
        }
        
        // Date range filter
        if (tableState.columnFilters.datumFrom || tableState.columnFilters.datumTo) {
            const itemDate = parseDateString(item.datum);
            if (itemDate) {
                if (tableState.columnFilters.datumFrom) {
                    const fromDate = new Date(tableState.columnFilters.datumFrom);
                    if (itemDate < fromDate) return false;
                }
                if (tableState.columnFilters.datumTo) {
                    const toDate = new Date(tableState.columnFilters.datumTo);
                    if (itemDate > toDate) return false;
                }
            }
        }
        
        // Amount range filter
        if (tableState.columnFilters.sumMin && item.sumRaw < parseFloat(tableState.columnFilters.sumMin)) {
            return false;
        }
        if (tableState.columnFilters.sumMax && item.sumRaw > parseFloat(tableState.columnFilters.sumMax)) {
            return false;
        }
        
        return true;
    };
    
    renderTable();
}

/**
 * Parse German date string to Date object
 */
function parseDateString(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.split('.');
    if (parts.length === 3) {
        return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    return null;
}

/**
 * Update active filter count display
 */
function updateFilterCount() {
    const count = Object.keys(tableState.columnFilters).length;
    const countDisplay = document.getElementById('active-filter-count');
    const countText = document.getElementById('filter-count');
    
    if (countDisplay && countText) {
        countText.textContent = count;
        countDisplay.classList.toggle('hidden', count === 0);
    }
}

/**
 * Setup inline editing for table cells
 */
function setupInlineEditing() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    // Use event delegation for double-click on cells
    tableBody.addEventListener('dblclick', (e) => {
        const cell = e.target.closest('td');
        if (!cell || cell.cellIndex === 0) return; // Skip file name column

        startCellEdit(cell);
    });

    // Save on Enter, cancel on Escape
    document.addEventListener('keydown', (e) => {
        if (tableState.editingCell) {
            if (e.key === 'Enter') {
                e.preventDefault();
                saveCellEdit();
            } else if (e.key === 'Escape') {
                cancelCellEdit();
            }
        }
    });

    // Add save/discard buttons for batch editing
    const controlsBar = document.querySelector('#tool2-content .flex.flex-wrap.items-center');
    if (!controlsBar) return;

    const editControls = document.createElement('div');
    editControls.id = 'edit-controls';
    editControls.className = 'flex items-center gap-2 hidden';
    editControls.innerHTML = `
        <span class="text-xs text-orange-600 flex items-center gap-1">
            <i class="ph ph-warning-circle"></i>
            <span id="unsaved-count">0</span> unsaved changes
        </span>
        <button id="btn-save-changes" class="btn btn-primary btn-sm">
            <i class="ph ph-check"></i> Save Changes
        </button>
        <button id="btn-discard-changes" class="btn btn-secondary btn-sm">
            <i class="ph ph-x"></i> Discard
        </button>
    `;
    controlsBar.appendChild(editControls);

    document.getElementById('btn-save-changes')?.addEventListener('click', saveAllChanges);
    document.getElementById('btn-discard-changes')?.addEventListener('click', discardAllChanges);
}

/**
 * Start editing a cell
 */
function startCellEdit(cell) {
    if (tableState.editingCell) {
        saveCellEdit();
    }

    const originalValue = cell.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.value = originalValue;
    input.className = 'w-full px-2 py-1 border-2 border-blue-500 rounded';
    
    cell.dataset.originalValue = originalValue;
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();

    tableState.editingCell = { cell, input, originalValue };

    // Save on blur
    input.addEventListener('blur', () => {
        setTimeout(() => saveCellEdit(), 100);
    });
}

/**
 * Save cell edit
 */
function saveCellEdit() {
    if (!tableState.editingCell) return;

    const { cell, input, originalValue } = tableState.editingCell;
    const newValue = input.value.trim();

    if (newValue !== originalValue) {
        cell.textContent = newValue;
        cell.classList.add('bg-yellow-50', 'border-l-4', 'border-yellow-400');
        
        // Mark as changed
        const row = cell.closest('tr');
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const cellIndex = cell.cellIndex;
        
        if (!tableState.unsavedChanges.has(rowIndex)) {
            tableState.unsavedChanges.set(rowIndex, {});
        }
        tableState.unsavedChanges.get(rowIndex)[cellIndex] = newValue;
        
        updateEditControls();
    } else {
        cell.textContent = originalValue;
    }

    tableState.editingCell = null;
}

/**
 * Cancel cell edit
 */
function cancelCellEdit() {
    if (!tableState.editingCell) return;

    const { cell, originalValue } = tableState.editingCell;
    cell.textContent = originalValue;
    tableState.editingCell = null;
}

/**
 * Update edit controls visibility
 */
function updateEditControls() {
    const editControls = document.getElementById('edit-controls');
    const unsavedCount = document.getElementById('unsaved-count');
    
    if (editControls && unsavedCount) {
        const count = tableState.unsavedChanges.size;
        unsavedCount.textContent = count;
        editControls.classList.toggle('hidden', count === 0);
    }
}

/**
 * Save all changes to state
 */
function saveAllChanges() {
    const columnMap = ['fileName', 'auftragsNr', 'anlage', 'einsatzort', 'datum', 'fachmonteur', 'sumRaw', 'bemerkung'];
    
    tableState.unsavedChanges.forEach((changes, rowIndex) => {
        const dataItem = state.tool2.extractedData[rowIndex];
        if (dataItem) {
            Object.entries(changes).forEach(([cellIndex, value]) => {
                const field = columnMap[parseInt(cellIndex)];
                if (field) {
                    if (field === 'sumRaw') {
                        dataItem[field] = parseFloat(value.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
                    } else {
                        dataItem[field] = value;
                    }
                }
            });
        }
    });

    tableState.unsavedChanges.clear();
    renderTable();
    updateUI();
    showToast('Changes saved successfully', 'success');
    updateEditControls();
}

/**
 * Discard all unsaved changes
 */
function discardAllChanges() {
    tableState.unsavedChanges.clear();
    renderTable();
    showToast('Changes discarded', 'info');
    updateEditControls();
}

/**
 * Setup row selection with checkboxes
 */
function setupRowSelection() {
    // Add checkbox column to header
    const thead = document.querySelector('#tool2-content thead tr');
    if (!thead) return;

    const selectAllTh = document.createElement('th');
    selectAllTh.className = 'px-3 py-3 border-b border-slate-200 w-12';
    selectAllTh.innerHTML = `
        <input type="checkbox" id="select-all-rows" 
               class="w-4 h-4 text-blue-600 rounded border-slate-300"
               aria-label="Select all rows">
    `;
    thead.insertBefore(selectAllTh, thead.firstChild);

    // Handle select all
    document.getElementById('select-all-rows')?.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('.row-select-checkbox');
        checkboxes.forEach(cb => {
            cb.checked = e.target.checked;
            const rowIndex = parseInt(cb.dataset.rowIndex);
            if (e.target.checked) {
                tableState.selectedRows.add(rowIndex);
            } else {
                tableState.selectedRows.delete(rowIndex);
            }
        });
        updateBulkActionControls();
        announceToScreenReader(`${e.target.checked ? 'All' : 'No'} rows selected`);
    });

    // Add checkboxes to rows (will be done in renderer)
    // We'll need to modify the renderer to include checkboxes
}

/**
 * Setup bulk actions for selected rows
 */
function setupBulkActions() {
    const controlsBar = document.querySelector('#tool2-content .flex.flex-wrap.items-center');
    if (!controlsBar) return;

    const bulkActions = document.createElement('div');
    bulkActions.id = 'bulk-actions';
    bulkActions.className = 'flex items-center gap-2 hidden';
    bulkActions.innerHTML = `
        <span class="text-xs text-slate-600">
            <span id="selected-count">0</span> selected
        </span>
        <button id="btn-bulk-delete" class="btn btn-danger btn-sm">
            <i class="ph ph-trash"></i> Delete
        </button>
        <button id="btn-bulk-export" class="btn btn-secondary btn-sm">
            <i class="ph ph-download-simple"></i> Export
        </button>
        <button id="btn-bulk-copy" class="btn btn-secondary btn-sm">
            <i class="ph ph-copy"></i> Copy
        </button>
    `;
    controlsBar.appendChild(bulkActions);

    document.getElementById('btn-bulk-delete')?.addEventListener('click', bulkDeleteRows);
    document.getElementById('btn-bulk-export')?.addEventListener('click', bulkExportRows);
    document.getElementById('btn-bulk-copy')?.addEventListener('click', bulkCopyRows);
}

/**
 * Update bulk action controls
 */
function updateBulkActionControls() {
    const bulkActions = document.getElementById('bulk-actions');
    const selectedCount = document.getElementById('selected-count');
    
    if (bulkActions && selectedCount) {
        const count = tableState.selectedRows.size;
        selectedCount.textContent = count;
        bulkActions.classList.toggle('hidden', count === 0);
    }
}

/**
 * Bulk delete selected rows
 */
function bulkDeleteRows() {
    if (tableState.selectedRows.size === 0) return;

    if (!confirm(`Delete ${tableState.selectedRows.size} selected rows?`)) return;

    const indicesToDelete = Array.from(tableState.selectedRows).sort((a, b) => b - a);
    indicesToDelete.forEach(index => {
        state.tool2.extractedData.splice(index, 1);
    });

    tableState.selectedRows.clear();
    state.tool2.validRecords = state.tool2.extractedData.length;
    state.tool2.totalSum = state.tool2.extractedData.reduce((sum, item) => sum + item.sumRaw, 0);

    renderTable();
    updateUI();
    updateBulkActionControls();
    showToast(`Deleted ${indicesToDelete.length} rows`, 'success');
}

/**
 * Bulk export selected rows
 */
async function bulkExportRows() {
    if (tableState.selectedRows.size === 0) return;

    const selectedData = Array.from(tableState.selectedRows)
        .map(index => state.tool2.extractedData[index])
        .filter(item => item);

    const { exportToExcel } = await import('../shared/export-utils.js');
    const exportData = selectedData.map(item => ({
        "Dateiname": item.fileName,
        "Auftragsnummer": item.auftragsNr,
        "Anlage": item.anlage,
        "Einsatzort": item.einsatzort,
        "Datum": item.datum,
        "Fachmonteurstunden": item.fachmonteur,
        "Auftragssumme": item.sumRaw,
        "Bemerkung": item.bemerkung
    }));

    exportToExcel(exportData, 'Selected_Rows_Export');
}

/**
 * Bulk copy selected rows
 */
function bulkCopyRows() {
    if (tableState.selectedRows.size === 0) return;

    const selectedData = Array.from(tableState.selectedRows)
        .map(index => state.tool2.extractedData[index])
        .filter(item => item);

    const headers = ['File', 'Auftrag Nr.', 'Anlage', 'Einsatzort', 'Datum', 'Std.', 'Summe', 'Bemerkung'];
    const rows = selectedData.map(item => [
        item.fileName,
        item.auftragsNr,
        item.anlage,
        item.einsatzort,
        item.datum,
        item.fachmonteur,
        item.sumRaw.toString().replace('.', ','),
        item.bemerkung
    ].join('\t'));

    const tsvContent = [headers.join('\t'), ...rows].join('\n');

    navigator.clipboard.writeText(tsvContent)
        .then(() => showToast(`Copied ${selectedData.length} rows to clipboard`, 'success'))
        .catch(err => {
            console.error('Copy failed:', err);
            showToast('Failed to copy rows', 'error');
        });
}

/**
 * Add checkbox to table row
 * @param {HTMLTableRowElement} tr - Table row element
 * @param {number} rowIndex - Row index in data array
 */
export function addRowCheckbox(tr, rowIndex) {
    const checkboxCell = document.createElement('td');
    checkboxCell.className = 'px-3 py-4 whitespace-nowrap border-b border-slate-100';
    checkboxCell.innerHTML = `
        <input type="checkbox" class="row-select-checkbox w-4 h-4 text-blue-600 rounded border-slate-300"
               data-row-index="${rowIndex}" aria-label="Select row">
    `;
    tr.insertBefore(checkboxCell, tr.firstChild);

    const checkbox = checkboxCell.querySelector('input');
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            tableState.selectedRows.add(rowIndex);
        } else {
            tableState.selectedRows.delete(rowIndex);
        }
        updateBulkActionControls();
    });
}

/**
 * Get table enhancement state (for external access)
 */
export function getTableState() {
    return tableState;
}

/**
 * Apply all enhancements after table render
 */
export function applyEnhancements() {
    applyColumnVisibility();
    
    // Add checkboxes to rendered rows
    const rows = document.querySelectorAll('#table-body tr:not(#empty-state)');
    rows.forEach((row, index) => {
        if (!row.querySelector('.row-select-checkbox')) {
            addRowCheckbox(row, index);
        }
    });
}

/**
 * Batch Operations Module (#27)
 * Multi-select and bulk actions for table rows
 */

import { 
    selectRow, 
    deselectRow, 
    toggleRowSelection, 
    selectAllRows, 
    clearSelection,
    getSelectedRows,
    getSelectionCount,
    isRowSelected,
    state
} from './state.js';
import { showToast } from './toast.js';

/**
 * Initialize batch operations
 */
export function initializeBatchOperations() {
    // Add event listeners
    document.addEventListener('click', handleBatchClick);
    document.addEventListener('change', handleBatchChange);
    
    // Listen for selection changes
    window.addEventListener('selectionChanged', updateBatchToolbar);
    
    // Listen for tab changes to update toolbar
    window.addEventListener('tabChanged', () => {
        updateBatchToolbar();
    });
}

/**
 * Handle batch operation clicks
 */
function handleBatchClick(e) {
    // Row checkbox
    if (e.target.matches('[data-batch-select]')) {
        const rowId = e.target.dataset.batchSelect;
        toggleRowSelection(rowId);
    }
    
    // Batch delete
    if (e.target.closest('[data-action="batch-delete"]')) {
        handleBatchDelete();
    }
    
    // Batch export
    if (e.target.closest('[data-action="batch-export"]')) {
        handleBatchExport();
    }
    
    // Clear selection
    if (e.target.closest('[data-action="clear-selection"]')) {
        clearSelection();
    }
}

/**
 * Handle batch operation changes
 */
function handleBatchChange(e) {
    // Select all checkbox
    if (e.target.matches('[data-batch-select-all]')) {
        handleSelectAll(e.target.checked);
    }
}

/**
 * Handle select all
 */
function handleSelectAll(checked) {
    const activeTab = state.ui.activeTab;
    
    if (checked) {
        // Get all row IDs for current tool
        const rowIds = getAllRowIds(activeTab);
        selectAllRows(rowIds, activeTab);
    } else {
        clearSelection(activeTab);
    }
}

/**
 * Get all row IDs for a tool
 */
function getAllRowIds(tool) {
    const rowIds = [];
    
    switch (tool) {
        case 'tool1':
            if (state.tool1.currentTargets) {
                rowIds.push(...state.tool1.currentTargets.map((_, i) => i));
            }
            break;
            
        case 'tool2':
            if (state.tool2.extractedData) {
                rowIds.push(...state.tool2.extractedData.map((_, i) => i));
            }
            break;
            
        case 'tool3':
            if (state.tool3.data) {
                rowIds.push(...state.tool3.data.map((_, i) => i));
            }
            break;
    }
    
    return rowIds;
}

/**
 * Handle batch delete
 */
function handleBatchDelete() {
    const selectedRows = getSelectedRows();
    const count = selectedRows.length;
    
    if (count === 0) {
        showToast('Keine Zeilen ausgewählt', 'warning');
        return;
    }
    
    if (!confirm(`Möchten Sie ${count} Zeile${count !== 1 ? 'n' : ''} wirklich löschen?`)) {
        return;
    }
    
    // Dispatch batch delete event
    window.dispatchEvent(new CustomEvent('batchDelete', {
        detail: {
            tool: state.ui.activeTab,
            rowIds: selectedRows
        }
    }));
    
    clearSelection();
    showToast(`${count} Zeile${count !== 1 ? 'n' : ''} gelöscht`, 'success');
}

/**
 * Handle batch export
 */
function handleBatchExport() {
    const selectedRows = getSelectedRows();
    const count = selectedRows.length;
    
    if (count === 0) {
        showToast('Keine Zeilen ausgewählt', 'warning');
        return;
    }
    
    // Dispatch batch export event
    window.dispatchEvent(new CustomEvent('batchExport', {
        detail: {
            tool: state.ui.activeTab,
            rowIds: selectedRows
        }
    }));
    
    showToast(`${count} Zeile${count !== 1 ? 'n' : ''} exportiert`, 'success');
}

/**
 * Update batch toolbar visibility and state
 */
function updateBatchToolbar() {
    const toolbar = document.getElementById('batch-toolbar');
    if (!toolbar) return;
    
    const count = getSelectionCount();
    
    if (count > 0) {
        toolbar.classList.add('active');
        
        // Update count badge
        const badge = toolbar.querySelector('.selection-count');
        if (badge) {
            badge.textContent = `${count} ausgewählt`;
        }
    } else {
        toolbar.classList.remove('active');
    }
    
    // Update select all checkbox
    const selectAllCheckbox = document.querySelector('[data-batch-select-all]');
    if (selectAllCheckbox) {
        const allRowIds = getAllRowIds(state.ui.activeTab);
        const allSelected = allRowIds.length > 0 && count === allRowIds.length;
        const someSelected = count > 0 && count < allRowIds.length;
        
        selectAllCheckbox.checked = allSelected;
        selectAllCheckbox.indeterminate = someSelected;
    }
}

/**
 * Create batch toolbar
 */
export function createBatchToolbar() {
    const toolbar = document.createElement('div');
    toolbar.id = 'batch-toolbar';
    toolbar.className = 'batch-toolbar';
    toolbar.innerHTML = `
        <div class="batch-toolbar-content">
            <span class="selection-count">0 ausgewählt</span>
            
            <div class="batch-toolbar-actions">
                <button 
                    class="btn btn-sm btn-danger" 
                    data-action="batch-delete"
                    title="Ausgewählte Zeilen löschen"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                        <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                    </svg>
                    Löschen
                </button>
                
                <button 
                    class="btn btn-sm btn-secondary" 
                    data-action="batch-export"
                    title="Ausgewählte Zeilen exportieren"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 12l-4-4h3V0h2v8h3l-4 4zm8 2v2H0v-2h16z"/>
                    </svg>
                    Exportieren
                </button>
                
                <button 
                    class="btn btn-sm btn-secondary" 
                    data-action="clear-selection"
                    title="Auswahl aufheben"
                >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 10.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/>
                    </svg>
                    Abbrechen
                </button>
            </div>
        </div>
    `;
    
    return toolbar;
}

/**
 * Add batch selection checkbox to table header
 */
export function addSelectAllCheckbox(tableHeader) {
    const th = document.createElement('th');
    th.className = 'batch-select-column';
    th.innerHTML = `
        <input 
            type="checkbox" 
            data-batch-select-all
            aria-label="Alle auswählen"
            title="Alle Zeilen auswählen"
        />
    `;
    
    tableHeader.insertBefore(th, tableHeader.firstChild);
}

/**
 * Add batch selection checkbox to table row
 */
export function addRowCheckbox(row, rowId) {
    const td = document.createElement('td');
    td.className = 'batch-select-column';
    
    const checked = isRowSelected(rowId);
    
    td.innerHTML = `
        <input 
            type="checkbox" 
            data-batch-select="${rowId}"
            aria-label="Zeile auswählen"
            ${checked ? 'checked' : ''}
        />
    `;
    
    row.insertBefore(td, row.firstChild);
}

/**
 * Enable batch operations for a table
 */
export function enableBatchOperations(table) {
    // Add select all checkbox to header
    const thead = table.querySelector('thead tr');
    if (thead && !thead.querySelector('[data-batch-select-all]')) {
        addSelectAllCheckbox(thead);
    }
    
    // Add checkboxes to rows
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        if (!row.querySelector('[data-batch-select]')) {
            addRowCheckbox(row, index);
        }
    });
}

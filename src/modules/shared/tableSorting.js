/**
 * Table Sorting Module
 * Handles sortable column headers with multi-column support
 * Enhancement #12
 */

import { state, updateState } from '../state.js';

/**
 * Sort configuration for each tool
 */
const sortState = new Map();

/**
 * Initialize sortable table headers
 * @param {string} tableId - Table ID
 * @param {string} toolKey - State key (e.g., 'tool1', 'tool2')
 * @param {Function} renderCallback - Function to call after sorting
 */
export function initializeSortableTable(tableId, toolKey, renderCallback) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('th.sortable');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        if (!column) return;

        // Make header focusable and keyboard accessible
        header.setAttribute('tabindex', '0');
        header.setAttribute('role', 'button');
        
        // Add click handler
        header.addEventListener('click', (e) => {
            handleSort(column, toolKey, renderCallback, e.shiftKey);
        });

        // Add keyboard handler
        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSort(column, toolKey, renderCallback, e.shiftKey);
            }
        });

        // Add hover effect
        header.style.cursor = 'pointer';
    });

    // Initialize sort state for this tool if not exists
    if (!sortState.has(toolKey)) {
        sortState.set(toolKey, {
            columns: [],
            primary: null
        });
    }

    // Check if tool has default sort in state
    if (state[toolKey] && state[toolKey].sort) {
        const { column, direction } = state[toolKey].sort;
        if (column) {
            setSortState(toolKey, column, direction);
            updateSortIndicators(tableId, column, direction);
        }
    }
}

/**
 * Handle column sort
 * @param {string} column - Column key
 * @param {string} toolKey - State key
 * @param {Function} renderCallback - Render function
 * @param {boolean} isMultiSort - Whether Shift key was pressed
 */
function handleSort(column, toolKey, renderCallback, isMultiSort = false) {
    const currentSort = sortState.get(toolKey);
    
    if (isMultiSort) {
        // Multi-column sort (Shift+Click)
        handleMultiSort(column, toolKey);
    } else {
        // Single column sort
        const currentDirection = getCurrentDirection(toolKey, column);
        const newDirection = toggleDirection(currentDirection);
        
        // Reset to single column sort
        sortState.set(toolKey, {
            columns: [{ column, direction: newDirection }],
            primary: column
        });
    }

    // Update state
    const primarySort = sortState.get(toolKey).columns[0];
    if (state[toolKey] && state[toolKey].sort !== undefined) {
        updateState(`${toolKey}.sort`, {
            column: primarySort.column,
            direction: primarySort.direction
        });
    }

    // Update visual indicators
    updateAllSortIndicators(toolKey);

    // Call render callback to re-render table
    if (renderCallback && typeof renderCallback === 'function') {
        renderCallback();
    }
}

/**
 * Handle multi-column sort
 * @param {string} column - Column to add to sort
 * @param {string} toolKey - State key
 */
function handleMultiSort(column, toolKey) {
    const currentSort = sortState.get(toolKey);
    const existingIndex = currentSort.columns.findIndex(c => c.column === column);
    
    if (existingIndex !== -1) {
        // Column already in sort - toggle direction or remove
        const existing = currentSort.columns[existingIndex];
        if (existing.direction === 'asc') {
            existing.direction = 'desc';
        } else if (existing.direction === 'desc') {
            // Remove from sort
            currentSort.columns.splice(existingIndex, 1);
        }
    } else {
        // Add column to sort
        currentSort.columns.push({ column, direction: 'asc' });
    }

    // Set primary to first column
    if (currentSort.columns.length > 0) {
        currentSort.primary = currentSort.columns[0].column;
    }
}

/**
 * Get current sort direction for column
 * @param {string} toolKey - State key
 * @param {string} column - Column key
 * @returns {string|null} Direction or null
 */
function getCurrentDirection(toolKey, column) {
    const currentSort = sortState.get(toolKey);
    const sortInfo = currentSort.columns.find(c => c.column === column);
    return sortInfo ? sortInfo.direction : null;
}

/**
 * Toggle sort direction
 * @param {string|null} currentDirection - Current direction
 * @returns {string} New direction
 */
function toggleDirection(currentDirection) {
    if (!currentDirection || currentDirection === 'desc') {
        return 'asc';
    }
    return 'desc';
}

/**
 * Set sort state programmatically
 * @param {string} toolKey - State key
 * @param {string} column - Column key
 * @param {string} direction - Sort direction
 */
function setSortState(toolKey, column, direction) {
    sortState.set(toolKey, {
        columns: [{ column, direction }],
        primary: column
    });
}

/**
 * Update sort indicators for all columns
 * @param {string} toolKey - State key
 */
function updateAllSortIndicators(toolKey) {
    const currentSort = sortState.get(toolKey);
    const tables = document.querySelectorAll('table');
    
    tables.forEach(table => {
        const headers = table.querySelectorAll('th.sortable');
        
        headers.forEach(header => {
            const column = header.getAttribute('data-sort');
            const sortInfo = currentSort.columns.find(c => c.column === column);
            
            if (sortInfo) {
                updateSortIndicator(header, sortInfo.direction, 
                    currentSort.columns.indexOf(sortInfo) + 1,
                    currentSort.columns.length > 1);
            } else {
                updateSortIndicator(header, null);
            }
        });
    });
}

/**
 * Update sort indicators for a table
 * @param {string} tableId - Table ID
 * @param {string} sortColumn - Currently sorted column
 * @param {string} direction - Sort direction
 */
function updateSortIndicators(tableId, sortColumn, direction) {
    const table = document.getElementById(tableId);
    if (!table) return;

    const headers = table.querySelectorAll('th.sortable');
    
    headers.forEach(header => {
        const column = header.getAttribute('data-sort');
        
        if (column === sortColumn) {
            updateSortIndicator(header, direction);
        } else {
            updateSortIndicator(header, null);
        }
    });
}

/**
 * Update sort indicator for a single header
 * @param {HTMLElement} header - Header element
 * @param {string|null} direction - Sort direction or null
 * @param {number} order - Sort order (for multi-column)
 * @param {boolean} isMulti - Whether this is multi-column sort
 */
function updateSortIndicator(header, direction, order = 1, isMulti = false) {
    // Update aria-sort attribute
    if (direction === 'asc') {
        header.setAttribute('aria-sort', 'ascending');
    } else if (direction === 'desc') {
        header.setAttribute('aria-sort', 'descending');
    } else {
        header.setAttribute('aria-sort', 'none');
    }

    // Find or create sort icon
    let icon = header.querySelector('.sort-icon');
    if (!icon) {
        icon = document.createElement('i');
        icon.className = 'sort-icon';
        header.appendChild(icon);
    }

    // Update icon classes
    icon.className = 'sort-icon ml-1 text-sm';
    
    if (direction === 'asc') {
        icon.className += ' ph ph-caret-up text-indigo-600';
    } else if (direction === 'desc') {
        icon.className += ' ph ph-caret-down text-indigo-600';
    } else {
        icon.className += ' ph ph-caret-up-down text-slate-400';
    }

    // Add sort order badge for multi-column sort
    let badge = header.querySelector('.sort-order-badge');
    if (isMulti && direction) {
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'sort-order-badge';
            header.appendChild(badge);
        }
        badge.textContent = order;
        badge.className = 'sort-order-badge ml-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-indigo-600 rounded-full';
    } else if (badge) {
        badge.remove();
    }
}

/**
 * Sort data array
 * @param {Array} data - Data array to sort
 * @param {string} toolKey - State key
 * @param {Object} columnConfig - Column configuration for data access
 * @returns {Array} Sorted data
 */
export function sortData(data, toolKey, columnConfig = {}) {
    const currentSort = sortState.get(toolKey);
    if (!currentSort || currentSort.columns.length === 0) {
        return data;
    }

    const sortedData = [...data];
    
    sortedData.sort((a, b) => {
        for (const sortInfo of currentSort.columns) {
            const { column, direction } = sortInfo;
            
            // Get values using column config or direct property access
            let aValue, bValue;
            
            if (columnConfig[column] && typeof columnConfig[column] === 'function') {
                aValue = columnConfig[column](a);
                bValue = columnConfig[column](b);
            } else {
                aValue = a[column];
                bValue = b[column];
            }

            // Handle null/undefined
            if (aValue === null || aValue === undefined) aValue = '';
            if (bValue === null || bValue === undefined) bValue = '';

            // Convert to comparable types
            const aNum = parseFloat(aValue);
            const bNum = parseFloat(bValue);
            
            let comparison = 0;
            
            // Numeric comparison
            if (!isNaN(aNum) && !isNaN(bNum)) {
                comparison = aNum - bNum;
            }
            // String comparison
            else {
                const aStr = String(aValue).toLowerCase();
                const bStr = String(bValue).toLowerCase();
                comparison = aStr.localeCompare(bStr);
            }

            // Apply direction
            if (direction === 'desc') {
                comparison = -comparison;
            }

            // If not equal, return comparison
            if (comparison !== 0) {
                return comparison;
            }
            
            // If equal, continue to next sort column
        }
        
        return 0;
    });

    return sortedData;
}

/**
 * Get current sort state
 * @param {string} toolKey - State key
 * @returns {Object} Sort state
 */
export function getSortState(toolKey) {
    return sortState.get(toolKey) || { columns: [], primary: null };
}

/**
 * Clear sort state
 * @param {string} toolKey - State key
 */
export function clearSort(toolKey) {
    sortState.set(toolKey, {
        columns: [],
        primary: null
    });
    updateAllSortIndicators(toolKey);
}

/**
 * Tool 3 - Row Manager Selection Logic
 * Handles row selection and multi-select operations
 */

import { state } from '../state.js';
import { updateSelectionUI } from './renderer.js';

/**
 * Handle table click for row selection
 * 
 * Implements sophisticated multi-select behavior supporting:
 * - Single click: Select only clicked row (clears others)
 * - Ctrl/Cmd+click: Toggle individual row (maintains other selections)
 * - Shift+click: Range select from last selected to clicked row
 * - Checkbox click: Simple toggle without affecting others
 * 
 * @param {MouseEvent} e - Click event from table or row
 * @returns {void}
 * 
 * @sideEffects
 * - Modifies state.tool3.selectedIndices Set
 * - Updates state.tool3.lastSelectedIndex for range selection
 * - Calls updateSelectionUI() to sync visual state
 * 
 * @behavior
 * - Ignores clicks on action buttons
 * - Checkbox: Simple toggle, updates lastSelectedIndex
 * - Shift+click: Selects all rows between last and current
 * - Ctrl/Cmd+click: Toggles clicked row, keeps others
 * - Normal click: Clears all, selects clicked row
 * 
 * @example
 * // User clicks row 5, shift+clicks row 10
 * // Result: Rows 5, 6, 7, 8, 9, 10 all selected
 */
export function handleTableClick(e) {
    const tbody = document.getElementById('rm-tbody');
    if (!tbody) return;

    // Find nearest TR
    const tr = e.target.closest('tr');
    if (!tr || !tbody.contains(tr)) return;

    const index = parseInt(tr.dataset.index, 10);
    if (isNaN(index)) return;

    // Check if target was the checkbox
    const isCheckbox = e.target.classList.contains('rm-row-checkbox');

    // If clicking an action button, do nothing
    if (e.target.closest('button')) return;

    if (isCheckbox) {
        // Checkbox logic: simple toggle
        toggleSelection(index, e.target.checked);
        state.tool3.lastSelectedIndex = index;
    } else {
        // Row click logic
        if (e.shiftKey && state.tool3.lastSelectedIndex !== null) {
            // Range Select
            selectRange(state.tool3.lastSelectedIndex, index);
        } else if (e.ctrlKey || e.metaKey) {
            // Toggle individual
            toggleSelection(index, !state.tool3.selectedIndices.has(index));
            state.tool3.lastSelectedIndex = index;
        } else {
            // Single select (clear others)
            state.tool3.selectedIndices.clear();
            toggleSelection(index, true);
            state.tool3.lastSelectedIndex = index;
        }
    }

    updateSelectionUI();
}

/**
 * Toggle selection for a single row
 * 
 * Adds or removes a row index from the selection Set. This is the core
 * selection mutation function used by all selection operations.
 * 
 * @param {number} index - Zero-based row index in state.tool3.data
 * @param {boolean} isSelected - True to select (add to Set), false to deselect (remove from Set)
 * @returns {void}
 * 
 * @sideEffects
 * - Modifies state.tool3.selectedIndices Set
 * - Does NOT update UI (caller must call updateSelectionUI())
 */
function toggleSelection(index, isSelected) {
    if (isSelected) {
        state.tool3.selectedIndices.add(index);
    } else {
        state.tool3.selectedIndices.delete(index);
    }
}

/**
 * Select a range of rows
 * @param {number} start - Start index
 * @param {number} end - End index
 */
function selectRange(start, end) {
    const low = Math.min(start, end);
    const high = Math.max(start, end);

    for (let i = low; i <= high; i++) {
        state.tool3.selectedIndices.add(i);
    }
}

/**
 * Toggle select all rows
 * @param {boolean} checked - Whether to select or deselect all
 */
export function toggleSelectAll(checked) {
    if (checked) {
        state.tool3.data.forEach((_, i) => state.tool3.selectedIndices.add(i));
    } else {
        state.tool3.selectedIndices.clear();
    }
    updateSelectionUI();
}

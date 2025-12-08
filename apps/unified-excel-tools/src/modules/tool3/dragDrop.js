/**
 * Tool 3 - Row Manager Drag & Drop
 * Handles drag and drop row reordering
 */

import { state } from '../state.js';
import { renderTable } from './renderer.js';

let draggedIndex = null;

/**
 * Handle drag start event for row reordering
 * 
 * Initiates drag-and-drop operation for one or more selected rows.
 * If the dragged row is not currently selected, clears selection and
 * selects only that row. Creates a custom drag image showing the count
 * of rows being moved. Adds visual feedback class to all selected rows.
 * 
 * @param {DragEvent} e - Drag start event from draggable table row
 * @returns {void}
 * 
 * @sideEffects
 * - Sets module-level draggedIndex variable
 * - May modify state.tool3.selectedIndices if dragging unselected row
 * - Creates temporary ghost element for drag image
 * - Adds 'dragging-row' class to selected rows for visual feedback
 * - Sets e.dataTransfer.effectAllowed to 'move'
 * 
 * @behavior
 * - Single row drag: Selects row if not already selected
 * - Multi-row drag: Uses existing selection if row is selected
 * - Shows custom drag image with row count
 */
export function handleDragStart(e) {
    const tbody = document.getElementById('rm-tbody');
    if (!tbody) return;

    const tr = e.target.closest('tr');
    if (!tr) return;

    const index = parseInt(tr.dataset.index, 10);
    draggedIndex = index;

    // If dragging a row NOT in selection, select only that row
    if (!state.tool3.selectedIndices.has(index)) {
        state.tool3.selectedIndices.clear();
        state.tool3.selectedIndices.add(index);
    }

    // Drag feedback
    const count = state.tool3.selectedIndices.size;
    e.dataTransfer.effectAllowed = 'move';

    // Create ghost element
    const ghost = document.createElement('div');
    ghost.className = 'absolute -top-[1000px] bg-indigo-600 text-white px-3 py-2 rounded-lg shadow-lg font-bold text-sm z-50';
    ghost.innerHTML = `<i class="ph ph-stack"></i> Moving ${count} Row${count > 1 ? 's' : ''}`;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);

    // Add dragging-row class to all selected rows
    state.tool3.selectedIndices.forEach(idx => {
        const row = tbody.querySelector(`tr[data-index="${idx}"]`);
        if (row) row.classList.add('dragging-row');
    });
}

/**
 * Handle drag over event for drop zone feedback
 * 
 * Provides visual feedback as the user drags rows over potential drop locations.
 * Adds a visual indicator (border line) above or below the row being hovered,
 * showing where the dragged rows will be inserted when dropped.
 * 
 * @param {DragEvent} e - Drag over event
 * @returns {void}
 * 
 * @sideEffects
 * - Prevents default to allow drop
 * - Sets dropEffect to 'move'
 * - Adds/removes 'drop-target-top' and 'drop-target-bottom' classes
 *   to indicate insertion point
 * 
 * @behavior
 * - Hovering over top half of row: Shows insertion line above
 * - Hovering over bottom half of row: Shows insertion line below
 * - Updates continuously as mouse moves
 */
export function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const tbody = document.getElementById('rm-tbody');
    if (!tbody) return;

    const tr = e.target.closest('tr');
    if (!tr || !tbody.contains(tr)) return;

    // Remove existing indicators
    tbody.querySelectorAll('.drop-indicator').forEach(el => {
        el.classList.remove('drop-indicator');
    });

    // Add indicator to current target
    tr.classList.add('drop-indicator');
}

/**
 * Handle drag end
 * @param {DragEvent} e - Drag event
 */
export function handleDragEnd(e) {
    const tbody = document.getElementById('rm-tbody');
    if (!tbody) return;

    // Cleanup styles
    tbody.querySelectorAll('tr').forEach(row => {
        row.classList.remove('dragging-row', 'drop-indicator');
    });
}

/**
 * Handle drop
 * @param {DragEvent} e - Drag event
 */
export function handleDropRow(e) {
    e.preventDefault();
    e.stopPropagation();

    const tbody = document.getElementById('rm-tbody');
    if (!tbody) return;

    const targetTr = e.target.closest('tr');
    if (!targetTr) return;

    const targetIndex = parseInt(targetTr.dataset.index, 10);

    // Don't drop on selected rows
    if (state.tool3.selectedIndices.has(targetIndex)) return;

    // Sort indices
    const indicesArray = Array.from(state.tool3.selectedIndices).sort((a, b) => a - b);

    // Partition data into moving and staying
    const newData = [];
    const movingItems = [];

    state.tool3.data.forEach((item, i) => {
        if (state.tool3.selectedIndices.has(i)) {
            movingItems.push(item);
        } else {
            newData.push(item);
        }
    });

    // Find target position in reduced array
    const targetItem = state.tool3.data[targetIndex];
    let newTargetIndex = newData.indexOf(targetItem);

    if (newTargetIndex === -1) newTargetIndex = newData.length;

    // Insert moving items at new position
    newData.splice(newTargetIndex, 0, ...movingItems);

    // Update state
    state.tool3.data = newData;

    // Update selection to new indices
    state.tool3.selectedIndices.clear();
    for (let i = 0; i < movingItems.length; i++) {
        state.tool3.selectedIndices.add(newTargetIndex + i);
    }

    // Re-render
    renderTable();
}

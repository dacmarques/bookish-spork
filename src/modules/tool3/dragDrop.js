/**
 * Tool 3 - Row Manager Drag & Drop
 * Handles drag and drop row reordering with keyboard support
 */

import { state } from '../state.js';
import { renderTable } from './renderer.js';
import { showSuccess, showInfo } from '../toast.js';
import { throttle } from '../utils.js';

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
    ghost.className = 'fixed top-0 left-0 bg-white border border-indigo-200 shadow-xl rounded-lg p-3 z-50 pointer-events-none flex items-center gap-3 min-w-[200px]';

    // Icon
    const iconDiv = document.createElement('div');
    iconDiv.className = 'w-8 h-8 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center';
    iconDiv.innerHTML = '<i class="ph ph-rows text-lg"></i>';
    ghost.appendChild(iconDiv);

    // Text content
    const contentDiv = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'text-sm font-bold text-slate-700';
    title.textContent = count > 1 ? `${count} Rows Selected` : 'Moving Row';

    const subtitle = document.createElement('div');
    subtitle.className = 'text-xs text-slate-500';

    // Try to get some ID from the dragged row to show
    // Assumption: Row might have cells, specific text to show
    if (count === 1) {
        // Try to find order number or some identifier in the row cells
        const cells = tr.querySelectorAll('td');
        if (cells.length > 1) {
            // Usually first or second cell has ID
            const textHTML = cells[1]?.innerText || '';
            subtitle.textContent = textHTML.substring(0, 20) + (textHTML.length > 20 ? '...' : '');
        } else {
            subtitle.textContent = `Row #${index + 1}`;
        }
    } else {
        subtitle.textContent = 'Drag to reorder';
    }

    contentDiv.appendChild(title);
    contentDiv.appendChild(subtitle);
    ghost.appendChild(contentDiv);

    document.body.appendChild(ghost);

    // We need to offset the drag image so it's not right under the cursor blocking view if possible
    // But setDragImage requires element to be visible
    e.dataTransfer.setDragImage(ghost, 10, 10);

    // Remove after small delay to let browser capture it
    setTimeout(() => document.body.removeChild(ghost), 0);

    // Add dragging-row class to all selected rows
    state.tool3.selectedIndices.forEach(idx => {
        const row = tbody.querySelector(`tr[data-index="${idx}"]`);
        if (row) row.classList.add('dragging-row');
    });
}

/**
 * Handle drag over event for drop zone feedback (internal implementation)
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
function handleDragOverInternal(e) {
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
 * Throttled drag over handler to prevent excessive redraws
 * Limits visual feedback updates to once every 50ms for better performance
 */
export const handleDragOver = throttle(handleDragOverInternal, 50);

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

/**
 * Handle keyboard navigation for row reordering
 * @param {KeyboardEvent} e - Keyboard event
 */
export function handleKeyboardReorder(e) {
    const tbody = document.getElementById('rm-tbody');
    if (!tbody) return;

    const tr = e.target.closest('tr');
    if (!tr) return;

    const index = parseInt(tr.dataset.index, 10);
    if (isNaN(index)) return;

    // Arrow keys for reordering
    if (e.key === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        moveSelectedRows(-1);
        showInfo('Moved row(s) up');
    } else if (e.key === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        moveSelectedRows(1);
        showInfo('Moved row(s) down');
    }
    // Space to select/deselect
    else if (e.key === ' ' && !e.shiftKey) {
        e.preventDefault();
        const checkbox = tr.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }
}

/**
 * Move selected rows up or down
 * @param {number} direction - -1 for up, 1 for down
 */
function moveSelectedRows(direction) {
    if (state.tool3.selectedIndices.size === 0) return;

    const indicesArray = Array.from(state.tool3.selectedIndices).sort((a, b) => a - b);

    // Check boundaries
    if (direction === -1 && indicesArray[0] === 0) return; // Can't move up from top
    if (direction === 1 && indicesArray[indicesArray.length - 1] === state.tool3.data.length - 1) return; // Can't move down from bottom

    const newData = [...state.tool3.data];
    const movingItems = indicesArray.map(i => newData[i]);

    // Remove moving items
    for (let i = indicesArray.length - 1; i >= 0; i--) {
        newData.splice(indicesArray[i], 1);
    }

    // Calculate new insertion point
    let insertIndex = indicesArray[0] + direction;
    if (direction === 1) {
        // When moving down, adjust for removed items
        insertIndex = indicesArray[0] + 1;
    }

    // Insert at new position
    newData.splice(insertIndex, 0, ...movingItems);

    // Update state
    state.tool3.data = newData;

    // Update selection to new indices
    state.tool3.selectedIndices.clear();
    for (let i = 0; i < movingItems.length; i++) {
        state.tool3.selectedIndices.add(insertIndex + i);
    }

    // Re-render
    renderTable();

    // Restore focus to first moved row
    setTimeout(() => {
        const tbody = document.getElementById('rm-tbody');
        const firstRow = tbody?.querySelector(`tr[data-index="${insertIndex}"]`);
        if (firstRow) {
            firstRow.focus();
        }
    }, 50);
}

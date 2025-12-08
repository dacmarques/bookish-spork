/**
 * History Management Module
 * Implements undo/redo functionality for data modifications
 */

import { logAction } from './auditTrail.js';

export class HistoryAction {
  constructor(type, data, inverse) {
    this.id = generateActionId();
    this.timestamp = new Date();
    this.type = type; // 'edit', 'delete', 'add', 'reorder', 'batch'
    this.data = data; // Current state data
    this.inverse = inverse; // Function or data to undo
  }
}

// History stacks
let undoStack = [];
let redoStack = [];
let maxHistorySize = 50;
let isPerformingHistoryAction = false;

/**
 * Initialize history management
 */
export function initializeHistory(options = {}) {
  if (options.maxHistorySize) {
    maxHistorySize = options.maxHistorySize;
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Z / Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    // Ctrl+Y / Cmd+Shift+Z for redo
    if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
      e.preventDefault();
      redo();
    }
  });

  console.log('✅ History management initialized');
}

/**
 * Add action to history
 */
export function recordAction(type, data, inverseFunc) {
  if (isPerformingHistoryAction) return; // Don't record undo/redo actions

  const action = new HistoryAction(type, data, inverseFunc);
  undoStack.push(action);

  // Limit stack size
  if (undoStack.length > maxHistorySize) {
    undoStack.shift();
  }

  // Clear redo stack when new action is recorded
  redoStack = [];

  // Dispatch event
  dispatchHistoryUpdate();
}

/**
 * Record row edit
 */
export function recordEdit(rowId, field, oldValue, newValue, updateFunc) {
  const data = { rowId, field, oldValue, newValue };
  const inverse = () => updateFunc(rowId, field, oldValue);
  
  recordAction('edit', data, inverse);
}

/**
 * Record row deletion
 */
export function recordDelete(rowId, rowData, restoreFunc) {
  const data = { rowId, rowData };
  const inverse = () => restoreFunc(rowId, rowData);
  
  recordAction('delete', data, inverse);
}

/**
 * Record row addition
 */
export function recordAdd(rowId, rowData, deleteFunc) {
  const data = { rowId, rowData };
  const inverse = () => deleteFunc(rowId);
  
  recordAction('add', data, inverse);
}

/**
 * Record row reordering
 */
export function recordReorder(oldIndex, newIndex, reorderFunc) {
  const data = { oldIndex, newIndex };
  const inverse = () => reorderFunc(newIndex, oldIndex);
  
  recordAction('reorder', data, inverse);
}

/**
 * Record batch operation
 */
export function recordBatch(operations, inverseOperations) {
  const data = { operations, count: operations.length };
  const inverse = () => {
    // Execute inverse operations in reverse order
    [...inverseOperations].reverse().forEach(op => op());
  };
  
  recordAction('batch', data, inverse);
}

/**
 * Undo last action
 */
export function undo() {
  if (undoStack.length === 0) {
    console.log('Nothing to undo');
    return false;
  }

  isPerformingHistoryAction = true;

  const action = undoStack.pop();
  
  try {
    // Execute inverse operation
    if (typeof action.inverse === 'function') {
      action.inverse();
    }

    // Move to redo stack
    redoStack.push(action);

    // Log the undo
    logAction('undo', `${formatActionType(action.type)} rückgängig gemacht`);

    dispatchHistoryUpdate();
    
    isPerformingHistoryAction = false;
    return true;
  } catch (error) {
    console.error('Error during undo:', error);
    isPerformingHistoryAction = false;
    return false;
  }
}

/**
 * Redo last undone action
 */
export function redo() {
  if (redoStack.length === 0) {
    console.log('Nothing to redo');
    return false;
  }

  isPerformingHistoryAction = true;

  const action = redoStack.pop();
  
  try {
    // Re-execute the action
    // For redo, we need to get the original action's data and replay it
    // This is tool-specific, so we dispatch an event
    window.dispatchEvent(new CustomEvent('redoAction', { detail: action }));

    // Move back to undo stack
    undoStack.push(action);

    // Log the redo
    logAction('redo', `${formatActionType(action.type)} wiederholt`);

    dispatchHistoryUpdate();
    
    isPerformingHistoryAction = false;
    return true;
  } catch (error) {
    console.error('Error during redo:', error);
    isPerformingHistoryAction = false;
    return false;
  }
}

/**
 * Clear history
 */
export function clearHistory() {
  const totalActions = undoStack.length + redoStack.length;
  undoStack = [];
  redoStack = [];
  dispatchHistoryUpdate();
  logAction('system', `Verlauf gelöscht (${totalActions} Aktionen entfernt)`);
}

/**
 * Get history state
 */
export function getHistoryState() {
  return {
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoCount: undoStack.length,
    redoCount: redoStack.length,
    lastAction: undoStack.length > 0 ? undoStack[undoStack.length - 1] : null,
    nextRedo: redoStack.length > 0 ? redoStack[redoStack.length - 1] : null
  };
}

/**
 * Get undo stack summary
 */
export function getUndoHistory(limit = 10) {
  return undoStack
    .slice(-limit)
    .reverse()
    .map(action => ({
      id: action.id,
      type: action.type,
      typeLabel: formatActionType(action.type),
      timestamp: action.timestamp,
      description: formatActionDescription(action)
    }));
}

/**
 * Get redo stack summary
 */
export function getRedoHistory(limit = 10) {
  return redoStack
    .slice(-limit)
    .reverse()
    .map(action => ({
      id: action.id,
      type: action.type,
      typeLabel: formatActionType(action.type),
      timestamp: action.timestamp,
      description: formatActionDescription(action)
    }));
}

/**
 * Jump to specific history state
 */
export function jumpToHistory(actionId, direction = 'undo') {
  const stack = direction === 'undo' ? undoStack : redoStack;
  const index = stack.findIndex(a => a.id === actionId);
  
  if (index === -1) return false;

  // Undo/redo multiple times to reach target state
  const count = stack.length - index;
  for (let i = 0; i < count; i++) {
    if (direction === 'undo') {
      undo();
    } else {
      redo();
    }
  }

  return true;
}

/**
 * Dispatch history update event
 */
function dispatchHistoryUpdate() {
  window.dispatchEvent(new CustomEvent('historyUpdated', {
    detail: getHistoryState()
  }));
}

/**
 * Format action type for display
 */
function formatActionType(type) {
  const types = {
    'edit': 'Bearbeitung',
    'delete': 'Löschung',
    'add': 'Hinzufügen',
    'reorder': 'Neuordnung',
    'batch': 'Stapelverarbeitung'
  };
  return types[type] || type;
}

/**
 * Format action description
 */
function formatActionDescription(action) {
  const { type, data } = action;

  switch (type) {
    case 'edit':
      return `Feld "${data.field}" in Zeile ${data.rowId} geändert`;
    case 'delete':
      return `Zeile ${data.rowId} gelöscht`;
    case 'add':
      return `Neue Zeile ${data.rowId} hinzugefügt`;
    case 'reorder':
      return `Zeile von Position ${data.oldIndex} nach ${data.newIndex} verschoben`;
    case 'batch':
      return `${data.count} Zeilen geändert`;
    default:
      return type;
  }
}

/**
 * Generate unique action ID
 */
function generateActionId() {
  return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export history as text
 */
export function exportHistory() {
  let text = '=== UNDO HISTORY ===\n\n';
  
  const undoHistory = getUndoHistory(50);
  undoHistory.forEach((action, i) => {
    text += `${i + 1}. [${action.timestamp.toLocaleString('de-DE')}] ${action.description}\n`;
  });

  if (redoStack.length > 0) {
    text += '\n=== REDO HISTORY ===\n\n';
    const redoHistory = getRedoHistory(50);
    redoHistory.forEach((action, i) => {
      text += `${i + 1}. [${action.timestamp.toLocaleString('de-DE')}] ${action.description}\n`;
    });
  }

  return text;
}

/**
 * Get keyboard shortcut hints
 */
export function getKeyboardShortcuts() {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';
  
  return {
    undo: `${modKey}+Z`,
    redo: isMac ? `${modKey}+Shift+Z` : `${modKey}+Y`
  };
}

/**
 * Check if currently performing history action
 */
export function isHistoryActionInProgress() {
  return isPerformingHistoryAction;
}

/**
 * State Management Module
 * Centralized application state with persistence, undo/redo, and settings
 */

import { localStorageManager } from './storage.js';

export const state = {
    // Tool 1 - Value Counter
    tool1: {
        currentTargets: [],
        protokollData: null,
        abrechnungData: null,
        protokollUpload: null, // File upload state for Protokoll
        abrechnungUpload: null, // File upload state for Abrechnung
        reconciliation: null, // Reconciliation results
        extractedHeader: {},
        lastCountsMap: {},
        lastTotalMatches: 0,
        lastRowCount: 0,
        sort: {
            column: 'count', // default sort by count
            direction: 'desc' // default high to low
        },
        filter: ''
    },

    // Tool 2 - Smart Extractor
    tool2: {
        extractedData: [],
        uploadedFiles: [],
        totalSum: 0,
        validRecords: 0,
        fileMetadata: new Map(),
        filter: '',
        sort: {
            column: null,
            direction: 'asc'
        }
    },

    // Tool 3 - Row Manager
    tool3: {
        data: [],
        headers: [],
        selectedIndices: new Set(),
        lastSelectedIndex: null
    },

    // UI State
    ui: {
        activeTab: 'tool1',
        darkMode: false,
        sectionsExpanded: {
            extractedDetails: true,
            debug: false
        }
    },

    // Upload History
    uploadHistory: [],

    // Settings/Preferences (#13)
    settings: {
        dateFormat: 'DD.MM.YYYY',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
        autoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        showDebugInfo: false,
        columnVisibility: {
            tool1: {},
            tool2: {},
            tool3: {}
        },
        theme: 'light'
    },

    // Batch Operations (#27)
    batchOperations: {
        selectedRows: new Set(),
        selectAll: false,
        lastAction: null
    }
};

// History Management for Undo/Redo (#19)
const historyStack = [];
const redoStack = [];
const MAX_HISTORY_SIZE = 50;

/**
 * Action types for history tracking
 */
export const ActionTypes = {
    ROW_ADD: 'ROW_ADD',
    ROW_DELETE: 'ROW_DELETE',
    ROW_EDIT: 'ROW_EDIT',
    ROW_REORDER: 'ROW_REORDER',
    BATCH_DELETE: 'BATCH_DELETE',
    DATA_IMPORT: 'DATA_IMPORT',
    FILTER_CHANGE: 'FILTER_CHANGE',
    SORT_CHANGE: 'SORT_CHANGE'
};

/**
 * Initialize state from localStorage
 */
export function initializeState() {
    // Load theme preference
    const savedTheme = localStorageManager.getItem('theme', null);
    if (savedTheme) {
        state.ui.darkMode = savedTheme === 'dark';
        state.settings.theme = savedTheme;
    }

    // Load upload history
    const history = localStorageManager.getItem('upload_history', []);
    if (history) {
        state.uploadHistory = history;
    }

    // Load user settings (#13)
    loadSettings();

    // Setup auto-save if enabled
    if (state.settings.autoSave) {
        setupAutoSave();
    }
}

/**
 * Load persisted state from localStorage
 */
export function loadPersistedState() {
    // Load section states
    const extractedExpanded = localStorageManager.getItem('extracted-details-expanded', null);
    if (extractedExpanded !== null) {
        state.ui.sectionsExpanded.extractedDetails = extractedExpanded === true || extractedExpanded === 'true';
    }

    const debugExpanded = localStorageManager.getItem('debug_collapsed', null);
    if (debugExpanded !== null) {
        state.ui.sectionsExpanded.debug = debugExpanded !== true && debugExpanded !== 'true';
    }
}

/**
 * Update state and notify listeners
 */
export function updateState(path, value, trackHistory = false, actionType = null) {
    const keys = path.split('.');
    let current = state;

    // Store old value for history
    let oldValue;
    if (trackHistory) {
        oldValue = getState(path);
    }

    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    // Track in history if requested
    if (trackHistory && actionType) {
        pushHistory({
            type: actionType,
            path,
            oldValue,
            newValue: value,
            timestamp: Date.now()
        });
    }

    // Dispatch state change event
    window.dispatchEvent(new CustomEvent('stateChanged', {
        detail: { path, value, actionType }
    }));
}

/**
 * Get state value by path
 */
export function getState(path) {
    const keys = path.split('.');
    let current = state;

    for (const key of keys) {
        current = current[key];
        if (current === undefined) return undefined;
    }

    return current;
}

/**
 * Save state to localStorage with quota management
 */
export function persistState(key, value) {
    const result = localStorageManager.setItem(key, value, { autoCleanup: true });
    if (!result.success) {
        console.error('Failed to persist state:', result.error);
    }
    return result;
}

// ============================================================================
// UNDO/REDO FUNCTIONALITY (#19)
// ============================================================================

/**
 * Push action to history stack
 */
function pushHistory(action) {
    historyStack.push(action);
    
    // Limit history size
    if (historyStack.length > MAX_HISTORY_SIZE) {
        historyStack.shift();
    }
    
    // Clear redo stack when new action is performed
    redoStack.length = 0;
    
    // Notify listeners
    window.dispatchEvent(new CustomEvent('historyChanged', {
        detail: {
            canUndo: canUndo(),
            canRedo: canRedo(),
            historySize: historyStack.length
        }
    }));
}

/**
 * Undo last action
 */
export function undo() {
    if (!canUndo()) return false;
    
    const action = historyStack.pop();
    redoStack.push(action);
    
    // Restore old value
    const keys = action.path.split('.');
    let current = state;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = action.oldValue;
    
    // Notify listeners
    window.dispatchEvent(new CustomEvent('stateChanged', {
        detail: { path: action.path, value: action.oldValue, isUndo: true }
    }));
    
    window.dispatchEvent(new CustomEvent('historyChanged', {
        detail: {
            canUndo: canUndo(),
            canRedo: canRedo(),
            historySize: historyStack.length
        }
    }));
    
    return true;
}

/**
 * Redo last undone action
 */
export function redo() {
    if (!canRedo()) return false;
    
    const action = redoStack.pop();
    historyStack.push(action);
    
    // Restore new value
    const keys = action.path.split('.');
    let current = state;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = action.newValue;
    
    // Notify listeners
    window.dispatchEvent(new CustomEvent('stateChanged', {
        detail: { path: action.path, value: action.newValue, isRedo: true }
    }));
    
    window.dispatchEvent(new CustomEvent('historyChanged', {
        detail: {
            canUndo: canUndo(),
            canRedo: canRedo(),
            historySize: historyStack.length
        }
    }));
    
    return true;
}

/**
 * Check if undo is available
 */
export function canUndo() {
    return historyStack.length > 0;
}

/**
 * Check if redo is available
 */
export function canRedo() {
    return redoStack.length > 0;
}

/**
 * Clear history (e.g., on file upload)
 */
export function clearHistory() {
    historyStack.length = 0;
    redoStack.length = 0;
    
    window.dispatchEvent(new CustomEvent('historyChanged', {
        detail: {
            canUndo: false,
            canRedo: false,
            historySize: 0
        }
    }));
}

/**
 * Get history info
 */
export function getHistoryInfo() {
    return {
        canUndo: canUndo(),
        canRedo: canRedo(),
        undoCount: historyStack.length,
        redoCount: redoStack.length
    };
}

// ============================================================================
// SESSION EXPORT/IMPORT (#20)
// ============================================================================

/**
 * Export current session state as JSON (with Map serialization fix)
 */
export function exportSession() {
    const sessionData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        state: {
            tool1: state.tool1,
            tool2: {
                ...state.tool2,
                // Convert Map to array for serialization
                fileMetadata: Array.from(state.tool2.fileMetadata.entries())
            },
            tool3: {
                ...state.tool3,
                // Convert Set to array for serialization
                selectedIndices: Array.from(state.tool3.selectedIndices)
            },
            settings: state.settings
        },
        history: historyStack
    };
    
    return JSON.stringify(sessionData, null, 2);
}

/**
 * Import session state from JSON
 */
export function importSession(jsonString) {
    try {
        const sessionData = JSON.parse(jsonString);
        
        // Validate version
        if (!sessionData.version) {
            throw new Error('Invalid session file: missing version');
        }
        
        // Restore state
        if (sessionData.state) {
            Object.assign(state.tool1, sessionData.state.tool1 || {});
            
            // Restore tool2 with Map conversion
            const tool2State = sessionData.state.tool2 || {};
            if (tool2State.fileMetadata && Array.isArray(tool2State.fileMetadata)) {
                tool2State.fileMetadata = new Map(tool2State.fileMetadata);
            }
            Object.assign(state.tool2, tool2State);
            
            // Restore tool3 with Set conversion
            const tool3State = sessionData.state.tool3 || {};
            if (tool3State.selectedIndices && Array.isArray(tool3State.selectedIndices)) {
                tool3State.selectedIndices = new Set(tool3State.selectedIndices);
            }
            Object.assign(state.tool3, tool3State);
            
            Object.assign(state.settings, sessionData.state.settings || {});
        }
        
        // Restore history
        if (sessionData.history && Array.isArray(sessionData.history)) {
            historyStack.length = 0;
            historyStack.push(...sessionData.history);
        }
        
        // Notify listeners
        window.dispatchEvent(new CustomEvent('sessionImported', {
            detail: { timestamp: sessionData.timestamp }
        }));
        
        return true;
    } catch (e) {
        console.error('Failed to import session:', e);
        return false;
    }
}

/**
 * Auto-save to sessionStorage
 */
let autoSaveTimer = null;

function setupAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    
    autoSaveTimer = setInterval(() => {
        saveToSessionStorage();
    }, state.settings.autoSaveInterval);
}

/**
 * Save current state to sessionStorage
 */
export function saveToSessionStorage() {
    try {
        const snapshot = exportSession();
        sessionStorage.setItem('uet_session_snapshot', snapshot);
        sessionStorage.setItem('uet_session_timestamp', Date.now().toString());
        
        window.dispatchEvent(new CustomEvent('sessionSaved', {
            detail: { timestamp: Date.now() }
        }));
    } catch (e) {
        console.error('Failed to save session:', e);
    }
}

/**
 * Restore state from sessionStorage
 */
export function restoreFromSessionStorage() {
    try {
        const snapshot = sessionStorage.getItem('uet_session_snapshot');
        const timestamp = sessionStorage.getItem('uet_session_timestamp');
        
        if (snapshot && timestamp) {
            const success = importSession(snapshot);
            if (success) {
                return {
                    restored: true,
                    timestamp: parseInt(timestamp)
                };
            }
        }
        
        return { restored: false };
    } catch (e) {
        console.error('Failed to restore session:', e);
        return { restored: false };
    }
}

/**
 * Clear session storage
 */
export function clearSessionStorage() {
    sessionStorage.removeItem('uet_session_snapshot');
    sessionStorage.removeItem('uet_session_timestamp');
}

// ============================================================================
// SETTINGS/PREFERENCES (#13)
// ============================================================================

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const savedSettings = localStorageManager.getItem('settings', null);
    if (savedSettings) {
        Object.assign(state.settings, savedSettings);
    }
}

/**
 * Save settings to localStorage
 */
export function saveSettings() {
    const result = localStorageManager.setItem('settings', state.settings, { autoCleanup: true });
    
    if (result.success) {
        window.dispatchEvent(new CustomEvent('settingsSaved', {
            detail: { settings: state.settings }
        }));
    } else {
        console.error('Failed to save settings:', result.error);
    }
}

/**
 * Update a setting
 */
export function updateSetting(key, value) {
    const keys = key.split('.');
    let current = state.settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Save to localStorage
    saveSettings();
    
    // Handle special settings
    if (key === 'autoSave' && value) {
        setupAutoSave();
    } else if (key === 'autoSave' && !value && autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
    } else if (key === 'autoSaveInterval') {
        if (state.settings.autoSave) {
            setupAutoSave();
        }
    }
    
    // Notify listeners
    window.dispatchEvent(new CustomEvent('settingChanged', {
        detail: { key, value }
    }));
}

/**
 * Reset settings to defaults
 */
export function resetSettings() {
    state.settings = {
        dateFormat: 'DD.MM.YYYY',
        currencySymbol: '€',
        decimalSeparator: ',',
        thousandsSeparator: '.',
        autoSave: true,
        autoSaveInterval: 30000,
        showDebugInfo: false,
        columnVisibility: {
            tool1: {},
            tool2: {},
            tool3: {}
        },
        theme: 'light'
    };
    
    saveSettings();
}

// ============================================================================
// BATCH OPERATIONS (#27)
// ============================================================================

/**
 * Select row for batch operations
 */
export function selectRow(rowId, tool = null) {
    const toolKey = tool || state.ui.activeTab;
    state.batchOperations.selectedRows.add(`${toolKey}:${rowId}`);
    
    window.dispatchEvent(new CustomEvent('selectionChanged', {
        detail: {
            selectedCount: state.batchOperations.selectedRows.size,
            tool: toolKey
        }
    }));
}

/**
 * Deselect row
 */
export function deselectRow(rowId, tool = null) {
    const toolKey = tool || state.ui.activeTab;
    state.batchOperations.selectedRows.delete(`${toolKey}:${rowId}`);
    
    window.dispatchEvent(new CustomEvent('selectionChanged', {
        detail: {
            selectedCount: state.batchOperations.selectedRows.size,
            tool: toolKey
        }
    }));
}

/**
 * Toggle row selection
 */
export function toggleRowSelection(rowId, tool = null) {
    const toolKey = tool || state.ui.activeTab;
    const key = `${toolKey}:${rowId}`;
    
    if (state.batchOperations.selectedRows.has(key)) {
        deselectRow(rowId, tool);
    } else {
        selectRow(rowId, tool);
    }
}

/**
 * Select all rows
 */
export function selectAllRows(rowIds, tool = null) {
    const toolKey = tool || state.ui.activeTab;
    
    rowIds.forEach(id => {
        state.batchOperations.selectedRows.add(`${toolKey}:${id}`);
    });
    
    state.batchOperations.selectAll = true;
    
    window.dispatchEvent(new CustomEvent('selectionChanged', {
        detail: {
            selectedCount: state.batchOperations.selectedRows.size,
            tool: toolKey,
            selectAll: true
        }
    }));
}

/**
 * Clear all selections
 */
export function clearSelection(tool = null) {
    if (tool) {
        // Clear only for specific tool
        const toolKey = tool;
        const toRemove = [];
        state.batchOperations.selectedRows.forEach(key => {
            if (key.startsWith(`${toolKey}:`)) {
                toRemove.push(key);
            }
        });
        toRemove.forEach(key => state.batchOperations.selectedRows.delete(key));
    } else {
        // Clear all
        state.batchOperations.selectedRows.clear();
    }
    
    state.batchOperations.selectAll = false;
    
    window.dispatchEvent(new CustomEvent('selectionChanged', {
        detail: {
            selectedCount: state.batchOperations.selectedRows.size,
            tool: tool || state.ui.activeTab
        }
    }));
}

/**
 * Get selected rows for current tool
 */
export function getSelectedRows(tool = null) {
    const toolKey = tool || state.ui.activeTab;
    const selected = [];
    
    state.batchOperations.selectedRows.forEach(key => {
        if (key.startsWith(`${toolKey}:`)) {
            selected.push(key.replace(`${toolKey}:`, ''));
        }
    });
    
    return selected;
}

/**
 * Check if row is selected
 */
export function isRowSelected(rowId, tool = null) {
    const toolKey = tool || state.ui.activeTab;
    return state.batchOperations.selectedRows.has(`${toolKey}:${rowId}`);
}

/**
 * Get selection count
 */
export function getSelectionCount(tool = null) {
    if (tool) {
        return getSelectedRows(tool).length;
    }
    return state.batchOperations.selectedRows.size;
}

/**
 * State Management Module
 * Centralized application state with persistence
 */

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
    uploadHistory: []
};

/**
 * Initialize state from localStorage
 */
export function initializeState() {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        state.ui.darkMode = savedTheme === 'dark';
    }

    // Load upload history
    const history = localStorage.getItem('uet_upload_history');
    if (history) {
        try {
            state.uploadHistory = JSON.parse(history);
        } catch (e) {
            console.error('Failed to parse upload history:', e);
        }
    }
}

/**
 * Load persisted state from localStorage
 */
export function loadPersistedState() {
    // Load section states
    const extractedExpanded = localStorage.getItem('extracted-details-expanded');
    if (extractedExpanded !== null) {
        state.ui.sectionsExpanded.extractedDetails = extractedExpanded === 'true';
    }

    const debugExpanded = localStorage.getItem('uet_debug_collapsed');
    if (debugExpanded !== null) {
        state.ui.sectionsExpanded.debug = debugExpanded !== 'true';
    }
}

/**
 * Update state and notify listeners
 */
export function updateState(path, value) {
    const keys = path.split('.');
    let current = state;

    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;

    // Dispatch state change event
    window.dispatchEvent(new CustomEvent('stateChanged', {
        detail: { path, value }
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
 * Save state to localStorage
 */
export function persistState(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to persist state:', e);
    }
}

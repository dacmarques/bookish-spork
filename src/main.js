/**
 * Main Application Bootstrap
 * Initializes all modules and starts the application
 */

import { initializeState, loadPersistedState } from './modules/state.js';
import { initializeHandlers } from './modules/handlers.js';
import { initializeUI } from './modules/ui.js';
import { initializeDarkMode } from './modules/theme.js';
import { initializeScrollIndicators } from './modules/scroll.js';
import { loadUploadHistory } from './modules/uploadHistory.js';
import { restoreSectionStates } from './modules/sections.js';
import { loadSampleData } from './modules/sampleData.js';
import { initializeInternalTabs } from './modules/tabs.js';
import { initializeTooltips } from './modules/tooltip.js';
import { initializeSettings } from './modules/settings.js';
import { initializeUndoRedo } from './modules/undoRedo.js';
import { initializeSessionManager } from './modules/sessionManager.js';
import { initializeBatchOperations } from './modules/batchOperations.js';
// Enhanced storage management
import { initializeStorageManagement } from './modules/storage.js';
import { initializeIndexedDB } from './modules/indexedDB.js';
import { initializeStorageMonitor } from './modules/storageMonitor.js';
import { startAutoSave, showSessionManager } from './modules/workSessionManager.js';

/**
 * Application Entry Point
 */
function initializeApp() {
    console.log('🚀 Excel Tools Suite starting...');

    // Initialize enhanced storage management first
    initializeStorageManagement();
    initializeStorageMonitor();
    
    // Initialize IndexedDB (async, non-blocking)
    initializeIndexedDB().catch(err => {
        console.warn('IndexedDB unavailable:', err);
    });

    // Initialize state management
    initializeState();
    loadPersistedState();

    // Initialize theme (dark mode)
    initializeDarkMode();

    // Initialize UI components
    initializeUI();

    // Initialize event handlers
    initializeHandlers();

    // Initialize scroll indicators for tables
    initializeScrollIndicators();

    // Load upload history
    loadUploadHistory();

    // Restore collapsed section states
    restoreSectionStates();

    // Initialize internal tab navigation
    initializeInternalTabs();

    // Initialize tooltip system
    initializeTooltips();

    // Initialize state management features (#19, #20, #13, #27)
    initializeSettings();
    initializeUndoRedo();
    initializeSessionManager();
    initializeBatchOperations();
    
    // Start auto-save for work sessions (every 5 minutes)
    startAutoSave(5 * 60 * 1000);

    console.log('✅ Application ready');

    // Expose utilities for testing and console access
    window.loadSampleData = loadSampleData;
    window.showSessionManager = showSessionManager;
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

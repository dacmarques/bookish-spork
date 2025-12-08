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

/**
 * Application Entry Point
 */
function initializeApp() {
    console.log('🚀 Excel Tools Suite starting...');

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

    console.log('✅ Application ready');

    // Expose sample data loader for testing
    window.loadSampleData = loadSampleData;
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

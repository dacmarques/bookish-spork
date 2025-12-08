/**
 * UI Initialization Module
 * Sets up initial UI state and components
 */

import { restoreActiveTab } from './navigation.js';
import { updateGlobalHeader } from './header.js';

/**
 * Initialize UI components
 */
export function initializeUI() {
    // Restore active tab
    restoreActiveTab();
    
    // Update global header
    updateGlobalHeader();
    
    // Initialize Lucide icons (Tool 2)
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

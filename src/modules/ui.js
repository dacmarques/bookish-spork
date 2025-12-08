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
    
    // Create screen reader status region
    createScreenReaderStatusRegion();
}

/**
 * Create a live region for screen reader announcements
 */
function createScreenReaderStatusRegion() {
    if (!document.getElementById('sr-status')) {
        const statusRegion = document.createElement('div');
        statusRegion.id = 'sr-status';
        statusRegion.className = 'sr-only';
        statusRegion.setAttribute('role', 'status');
        statusRegion.setAttribute('aria-live', 'polite');
        statusRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(statusRegion);
    }
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 */
export function announceToScreenReader(message) {
    const statusRegion = document.getElementById('sr-status');
    if (statusRegion) {
        statusRegion.textContent = message;
        // Clear after announcement
        setTimeout(() => {
            statusRegion.textContent = '';
        }, 1000);
    }
}

/**
 * Header Module
 * Manages global header metrics and information
 */

import { state } from './state.js';
import { createUndoRedoToolbar } from './undoRedo.js';
import { createSessionToolbar } from './sessionManager.js';

/**
 * Update global header metrics
 */
export function updateGlobalHeader() {
    const fileCount = document.getElementById('global-file-count');
    const totalSum = document.getElementById('global-total-sum');
    
    // Count uploaded files across all tools
    let count = 0;
    if (state.tool1.protokollData) count++;
    if (state.tool1.abrechnungData) count++;
    count += state.tool2.uploadedFiles.length;
    if (state.tool3.currentFile) count++;
    
    if (fileCount) {
        fileCount.textContent = count;
    }
    
    // Calculate total sum from Tool 1
    if (totalSum && state.tool1.lastTotalMatches) {
        totalSum.textContent = state.tool1.lastTotalMatches;
    }
}

/**
 * Add state management toolbars to header
 */
export function addStateManagementToolbars() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;
    
    // Add settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn btn-icon';
    settingsBtn.setAttribute('data-action', 'open-settings');
    settingsBtn.setAttribute('title', 'Einstellungen');
    settingsBtn.setAttribute('aria-label', 'Einstellungen öffnen');
    settingsBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/>
        </svg>
    `;
    
    // Add undo/redo toolbar
    const undoRedoToolbar = createUndoRedoToolbar();
    
    // Add session toolbar
    const sessionToolbar = createSessionToolbar();
    
    // Insert before existing actions
    headerActions.insertBefore(settingsBtn, headerActions.firstChild);
    headerActions.insertBefore(undoRedoToolbar, headerActions.firstChild);
    headerActions.insertBefore(sessionToolbar, headerActions.firstChild);
}

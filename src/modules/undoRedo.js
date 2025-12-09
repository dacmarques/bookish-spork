/**
 * Undo/Redo UI Module (#19)
 * Visual controls and keyboard shortcuts for history management
 */

import { undo, redo, canUndo, canRedo, getHistoryInfo } from './state.js';
import { showToast } from './toast.js';

/**
 * Initialize undo/redo functionality
 */
export function initializeUndoRedo() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Listen for history changes
    window.addEventListener('historyChanged', updateUndoRedoUI);
    
    // Add button click handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="undo"]')) {
            handleUndo();
        }
        
        if (e.target.closest('[data-action="redo"]')) {
            handleRedo();
        }
    });
    
    // Initial UI update
    updateUndoRedoUI();
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(e) {
    // Ctrl+Z or Cmd+Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
    }
    
    // Ctrl+Y or Cmd+Shift+Z for redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
    }
}

/**
 * Handle undo action
 */
function handleUndo() {
    if (undo()) {
        showToast('Rückgängig gemacht', 'info', 2000);
    }
}

/**
 * Handle redo action
 */
function handleRedo() {
    if (redo()) {
        showToast('Wiederhergestellt', 'info', 2000);
    }
}

/**
 * Update undo/redo button states
 */
function updateUndoRedoUI() {
    const info = getHistoryInfo();
    
    // Update undo button
    const undoBtn = document.querySelector('[data-action="undo"]');
    if (undoBtn) {
        undoBtn.disabled = !info.canUndo;
        undoBtn.title = info.canUndo 
            ? `Rückgängig (${info.undoCount} verfügbar) - Strg+Z`
            : 'Keine Aktionen zum Rückgängigmachen';
    }
    
    // Update redo button
    const redoBtn = document.querySelector('[data-action="redo"]');
    if (redoBtn) {
        redoBtn.disabled = !info.canRedo;
        redoBtn.title = info.canRedo 
            ? `Wiederherstellen (${info.redoCount} verfügbar) - Strg+Y`
            : 'Keine Aktionen zum Wiederherstellen';
    }
    
    // Update history indicator
    const historyIndicator = document.getElementById('history-indicator');
    if (historyIndicator) {
        if (info.undoCount > 0) {
            historyIndicator.textContent = `${info.undoCount} Schritt${info.undoCount !== 1 ? 'e' : ''} verfügbar`;
            historyIndicator.style.display = 'inline';
        } else {
            historyIndicator.style.display = 'none';
        }
    }
}

/**
 * Create undo/redo toolbar
 */
export function createUndoRedoToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'undo-redo-toolbar';
    toolbar.innerHTML = `
        <button 
            class="btn btn-icon" 
            data-action="undo"
            title="Rückgängig - Strg+Z"
            aria-label="Rückgängig"
            disabled
        >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 3v2H4.5C3.12 5 2 6.12 2 7.5S3.12 10 4.5 10H13v2H4.5C2.01 12 0 9.99 0 7.5S2.01 3 4.5 3H8zm4 14v-2h3.5c1.38 0 2.5-1.12 2.5-2.5S16.88 10 15.5 10H7V8h8.5c2.49 0 4.5 2.01 4.5 4.5S17.99 17 15.5 17H12z"/>
            </svg>
        </button>
        
        <button 
            class="btn btn-icon" 
            data-action="redo"
            title="Wiederherstellen - Strg+Y"
            aria-label="Wiederherstellen"
            disabled
        >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M12 3v2h3.5c1.38 0 2.5 1.12 2.5 2.5S16.88 10 15.5 10H7V8h8.5c2.49 0 4.5 2.01 4.5 4.5S17.99 17 15.5 17H12v-2h3.5c1.38 0 2.5-1.12 2.5-2.5S16.88 10 15.5 10H7V8h8.5zM8 17v-2H4.5C3.12 15 2 13.88 2 12.5S3.12 10 4.5 10H13v2H4.5C2.01 12 0 10.01 0 7.5S2.01 3 4.5 3H8v2H4.5C3.12 5 2 6.12 2 7.5S3.12 10 4.5 10H13V8H4.5z"/>
            </svg>
        </button>
        
        <span id="history-indicator" class="history-indicator" style="display: none;"></span>
    `;
    
    return toolbar;
}

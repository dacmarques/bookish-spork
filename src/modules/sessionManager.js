/**
 * Session Export/Import Module (#20)
 * Save and restore work sessions
 */

import { 
    exportSession, 
    importSession, 
    saveToSessionStorage, 
    restoreFromSessionStorage,
    clearSessionStorage 
} from './state.js';
import { showToast } from './toast.js';

/**
 * Initialize session manager
 */
export function initializeSessionManager() {
    // Check for saved session on load
    checkForSavedSession();
    
    // Add button click handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="export-session"]')) {
            handleExportSession();
        }
        
        if (e.target.closest('[data-action="import-session"]')) {
            handleImportSession();
        }
        
        if (e.target.closest('[data-action="restore-session"]')) {
            handleRestoreSession();
        }
        
        if (e.target.closest('[data-action="dismiss-restore"]')) {
            dismissRestorePrompt();
        }
    });
    
    // Listen for session events
    window.addEventListener('sessionSaved', () => {
        updateSessionIndicator('Sitzung gespeichert');
    });
    
    window.addEventListener('sessionImported', (e) => {
        showToast('Sitzung wiederhergestellt', 'success');
    });
    
    // Save before unload
    window.addEventListener('beforeunload', () => {
        saveToSessionStorage();
    });
}

/**
 * Check for saved session and prompt user
 */
function checkForSavedSession() {
    const result = restoreFromSessionStorage();
    
    if (result.restored) {
        const timestamp = new Date(result.timestamp);
        const timeAgo = getTimeAgo(timestamp);
        
        showRestorePrompt(timeAgo);
    }
}

/**
 * Show restore session prompt
 */
function showRestorePrompt(timeAgo) {
    const prompt = document.createElement('div');
    prompt.id = 'restore-prompt';
    prompt.className = 'restore-prompt';
    prompt.innerHTML = `
        <div class="restore-prompt-content">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="restore-icon">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <div class="restore-prompt-text">
                <strong>Vorherige Sitzung gefunden</strong>
                <p>Möchten Sie Ihre Arbeit von ${timeAgo} wiederherstellen?</p>
            </div>
            <div class="restore-prompt-actions">
                <button class="btn btn-secondary" data-action="dismiss-restore">
                    Nein
                </button>
                <button class="btn btn-primary" data-action="restore-session">
                    Wiederherstellen
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(prompt);
    
    // Animate in
    requestAnimationFrame(() => {
        prompt.classList.add('active');
    });
}

/**
 * Handle restore session
 */
function handleRestoreSession() {
    const result = restoreFromSessionStorage();
    
    if (result.restored) {
        showToast('Sitzung wiederhergestellt', 'success');
        dismissRestorePrompt();
        
        // Trigger re-render
        window.dispatchEvent(new CustomEvent('sessionRestored'));
    } else {
        showToast('Fehler beim Wiederherstellen der Sitzung', 'error');
    }
}

/**
 * Dismiss restore prompt
 */
function dismissRestorePrompt() {
    const prompt = document.getElementById('restore-prompt');
    if (prompt) {
        prompt.classList.remove('active');
        setTimeout(() => prompt.remove(), 300);
    }
    
    // Clear session storage so prompt doesn't show again
    clearSessionStorage();
}

/**
 * Handle export session
 */
function handleExportSession() {
    try {
        const sessionData = exportSession();
        const blob = new Blob([sessionData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `uet-session-${timestamp}.json`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        showToast('Sitzung exportiert', 'success');
    } catch (e) {
        console.error('Export failed:', e);
        showToast('Fehler beim Exportieren', 'error');
    }
}

/**
 * Handle import session
 */
function handleImportSession() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const success = importSession(event.target.result);
                
                if (success) {
                    showToast('Sitzung importiert', 'success');
                    
                    // Trigger re-render
                    window.dispatchEvent(new CustomEvent('sessionRestored'));
                } else {
                    showToast('Ungültige Sitzungsdatei', 'error');
                }
            } catch (e) {
                console.error('Import failed:', e);
                showToast('Fehler beim Importieren', 'error');
            }
        };
        
        reader.onerror = () => {
            showToast('Fehler beim Lesen der Datei', 'error');
        };
        
        reader.readAsText(file);
    });
    
    input.click();
}

/**
 * Update session indicator
 */
function updateSessionIndicator(message) {
    const indicator = document.getElementById('session-indicator');
    if (indicator) {
        indicator.textContent = message;
        indicator.classList.add('active');
        
        setTimeout(() => {
            indicator.classList.remove('active');
        }, 3000);
    }
}

/**
 * Get time ago string
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    if (seconds < 60) {
        return 'vor wenigen Sekunden';
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `vor ${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
    }
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `vor ${hours} Stunde${hours !== 1 ? 'n' : ''}`;
    }
    
    const days = Math.floor(hours / 24);
    return `vor ${days} Tag${days !== 1 ? 'en' : ''}`;
}

/**
 * Create session toolbar
 */
export function createSessionToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'session-toolbar';
    toolbar.innerHTML = `
        <button 
            class="btn btn-secondary btn-sm" 
            data-action="export-session"
            title="Sitzung als JSON exportieren"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12l-4-4h3V0h2v8h3l-4 4zm8 2v2H0v-2h16z"/>
            </svg>
            Exportieren
        </button>
        
        <button 
            class="btn btn-secondary btn-sm" 
            data-action="import-session"
            title="Sitzung aus JSON importieren"
        >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0l4 4h-3v8H7V4H4l4-4zm8 14v2H0v-2h16z"/>
            </svg>
            Importieren
        </button>
        
        <span id="session-indicator" class="session-indicator"></span>
    `;
    
    return toolbar;
}

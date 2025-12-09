/**
 * Work Session Manager
 * Save and restore complete work sessions including file data
 */

import { state } from './state.js';
import { idbManager } from './indexedDB.js';
import { showToast } from './toast.js';

/**
 * Save current work session to IndexedDB
 */
export async function saveWorkSession(name = null) {
    try {
        const sessionId = name || `session_${Date.now()}`;
        
        // Prepare session data with all tool states
        const sessionData = {
            version: '2.0',
            timestamp: Date.now(),
            name: name || `Auto-save ${new Date().toLocaleString()}`,
            state: {
                tool1: {
                    currentTargets: state.tool1.currentTargets,
                    protokollData: state.tool1.protokollData,
                    abrechnungData: state.tool1.abrechnungData,
                    reconciliation: state.tool1.reconciliation,
                    extractedHeader: state.tool1.extractedHeader,
                    sort: state.tool1.sort,
                    filter: state.tool1.filter
                },
                tool2: {
                    extractedData: state.tool2.extractedData,
                    uploadedFiles: state.tool2.uploadedFiles,
                    totalSum: state.tool2.totalSum,
                    validRecords: state.tool2.validRecords,
                    // Convert Map to array for serialization
                    fileMetadata: Array.from(state.tool2.fileMetadata.entries()),
                    filter: state.tool2.filter,
                    sort: state.tool2.sort
                },
                tool3: {
                    data: state.tool3.data,
                    headers: state.tool3.headers,
                    selectedIndices: Array.from(state.tool3.selectedIndices)
                },
                ui: state.ui,
                settings: state.settings
            }
        };
        
        await idbManager.saveSession(sessionId, sessionData);
        
        showToast(`Session "${sessionData.name}" saved`, 'success');
        
        window.dispatchEvent(new CustomEvent('workSessionSaved', {
            detail: { id: sessionId, name: sessionData.name }
        }));
        
        return sessionId;
    } catch (e) {
        console.error('Failed to save work session:', e);
        showToast('Failed to save session', 'error');
        return null;
    }
}

/**
 * Restore work session from IndexedDB
 */
export async function restoreWorkSession(sessionId) {
    try {
        const session = await idbManager.getSession(sessionId);
        
        if (!session || !session.data) {
            showToast('Session not found', 'error');
            return false;
        }
        
        const sessionData = session.data;
        
        // Restore tool1 state
        if (sessionData.state.tool1) {
            Object.assign(state.tool1, {
                currentTargets: sessionData.state.tool1.currentTargets || [],
                protokollData: sessionData.state.tool1.protokollData,
                abrechnungData: sessionData.state.tool1.abrechnungData,
                reconciliation: sessionData.state.tool1.reconciliation,
                extractedHeader: sessionData.state.tool1.extractedHeader || {},
                sort: sessionData.state.tool1.sort || state.tool1.sort,
                filter: sessionData.state.tool1.filter || ''
            });
        }
        
        // Restore tool2 state
        if (sessionData.state.tool2) {
            Object.assign(state.tool2, {
                extractedData: sessionData.state.tool2.extractedData || [],
                uploadedFiles: sessionData.state.tool2.uploadedFiles || [],
                totalSum: sessionData.state.tool2.totalSum || 0,
                validRecords: sessionData.state.tool2.validRecords || 0,
                filter: sessionData.state.tool2.filter || '',
                sort: sessionData.state.tool2.sort || state.tool2.sort
            });
            
            // Restore Map from array
            if (sessionData.state.tool2.fileMetadata) {
                state.tool2.fileMetadata = new Map(sessionData.state.tool2.fileMetadata);
            }
        }
        
        // Restore tool3 state
        if (sessionData.state.tool3) {
            Object.assign(state.tool3, {
                data: sessionData.state.tool3.data || [],
                headers: sessionData.state.tool3.headers || []
            });
            
            // Restore Set from array
            if (sessionData.state.tool3.selectedIndices) {
                state.tool3.selectedIndices = new Set(sessionData.state.tool3.selectedIndices);
            }
        }
        
        // Restore UI state
        if (sessionData.state.ui) {
            Object.assign(state.ui, sessionData.state.ui);
        }
        
        // Restore settings
        if (sessionData.state.settings) {
            Object.assign(state.settings, sessionData.state.settings);
        }
        
        showToast(`Session "${sessionData.name}" restored`, 'success');
        
        window.dispatchEvent(new CustomEvent('workSessionRestored', {
            detail: { id: sessionId, session: sessionData }
        }));
        
        return true;
    } catch (e) {
        console.error('Failed to restore work session:', e);
        showToast('Failed to restore session', 'error');
        return false;
    }
}

/**
 * List all saved sessions
 */
export async function listWorkSessions() {
    try {
        const sessions = await idbManager.getAllSessions();
        
        return sessions.map(s => ({
            id: s.id,
            name: s.data?.name || s.id,
            timestamp: s.timestamp,
            size: s.size,
            version: s.data?.version || '1.0'
        }));
    } catch (e) {
        console.error('Failed to list sessions:', e);
        return [];
    }
}

/**
 * Delete a work session
 */
export async function deleteWorkSession(sessionId) {
    try {
        await idbManager.deleteSession(sessionId);
        showToast('Session deleted', 'success');
        
        window.dispatchEvent(new CustomEvent('workSessionDeleted', {
            detail: { id: sessionId }
        }));
        
        return true;
    } catch (e) {
        console.error('Failed to delete session:', e);
        showToast('Failed to delete session', 'error');
        return false;
    }
}

/**
 * Auto-save current session
 */
let autoSaveTimer = null;

export function startAutoSave(interval = 5 * 60 * 1000) { // 5 minutes default
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    
    autoSaveTimer = setInterval(async () => {
        // Only auto-save if there's actual data
        const hasData = state.tool1.protokollData || 
                       state.tool2.extractedData.length > 0 || 
                       state.tool3.data.length > 0;
        
        if (hasData) {
            await saveWorkSession('autosave');
            console.log('🔄 Auto-saved work session');
        }
    }, interval);
    
    console.log(`✅ Auto-save enabled (every ${interval / 1000}s)`);
}

export function stopAutoSave() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
        autoSaveTimer = null;
        console.log('⏸️ Auto-save disabled');
    }
}

/**
 * Export session to file
 */
export async function exportSessionToFile(sessionId) {
    try {
        const session = await idbManager.getSession(sessionId);
        
        if (!session || !session.data) {
            showToast('Session not found', 'error');
            return;
        }
        
        const json = JSON.stringify(session.data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_${session.data.name || sessionId}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Session exported', 'success');
    } catch (e) {
        console.error('Failed to export session:', e);
        showToast('Failed to export session', 'error');
    }
}

/**
 * Import session from file
 */
export async function importSessionFromFile(file) {
    try {
        const text = await file.text();
        const sessionData = JSON.parse(text);
        
        // Validate session data
        if (!sessionData.version || !sessionData.state) {
            throw new Error('Invalid session file format');
        }
        
        // Save to IndexedDB with new ID
        const sessionId = `imported_${Date.now()}`;
        await idbManager.saveSession(sessionId, sessionData);
        
        showToast('Session imported successfully', 'success');
        return sessionId;
    } catch (e) {
        console.error('Failed to import session:', e);
        showToast('Failed to import session: ' + e.message, 'error');
        return null;
    }
}

/**
 * Show session manager UI
 */
export async function showSessionManager() {
    const sessions = await listWorkSessions();
    
    const modalContent = `
        <div class="session-manager">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-xl font-bold">Work Sessions</h3>
                <button class="btn btn-primary" onclick="window.saveNewSession()">
                    <i class="ph ph-floppy-disk mr-2"></i>
                    Save Current
                </button>
            </div>
            
            ${sessions.length === 0 ? `
                <div class="text-center py-8 text-slate-500">
                    <i class="ph ph-archive text-4xl mb-2"></i>
                    <p>No saved sessions yet</p>
                </div>
            ` : `
                <div class="session-list space-y-2">
                    ${sessions.map(s => `
                        <div class="session-item border dark:border-slate-700 rounded p-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="font-semibold">${s.name}</div>
                                    <div class="text-sm text-slate-500">
                                        ${new Date(s.timestamp).toLocaleString()} • 
                                        ${formatBytes(s.size)}
                                    </div>
                                </div>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-secondary" 
                                            onclick="window.restoreSession('${s.id}')"
                                            title="Restore">
                                        <i class="ph ph-arrow-counter-clockwise"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" 
                                            onclick="window.exportSession('${s.id}')"
                                            title="Export">
                                        <i class="ph ph-download"></i>
                                    </button>
                                    <button class="btn btn-sm btn-secondary" 
                                            onclick="window.deleteSession('${s.id}')"
                                            title="Delete">
                                        <i class="ph ph-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
            
            <div class="mt-4 pt-4 border-t dark:border-slate-700">
                <label class="btn btn-secondary cursor-pointer">
                    <i class="ph ph-upload mr-2"></i>
                    Import Session
                    <input type="file" 
                           accept=".json" 
                           class="hidden" 
                           onchange="window.handleSessionImport(event)" />
                </label>
            </div>
        </div>
    `;
    
    window.dispatchEvent(new CustomEvent('showModal', {
        detail: {
            title: 'Session Manager',
            content: modalContent,
            size: 'large'
        }
    }));
}

function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Export functions to window for onclick handlers
if (typeof window !== 'undefined') {
    window.saveNewSession = async () => {
        const name = prompt('Session name:', `Session ${new Date().toLocaleString()}`);
        if (name) {
            await saveWorkSession(name);
            await showSessionManager();
        }
    };
    
    window.restoreSession = async (id) => {
        if (confirm('Restore this session? Current work will be replaced.')) {
            await restoreWorkSession(id);
            window.dispatchEvent(new CustomEvent('closeModal'));
        }
    };
    
    window.exportSession = async (id) => {
        await exportSessionToFile(id);
    };
    
    window.deleteSession = async (id) => {
        if (confirm('Delete this session?')) {
            await deleteWorkSession(id);
            await showSessionManager();
        }
    };
    
    window.handleSessionImport = async (event) => {
        const file = event.target.files[0];
        if (file) {
            await importSessionFromFile(file);
            await showSessionManager();
        }
    };
}

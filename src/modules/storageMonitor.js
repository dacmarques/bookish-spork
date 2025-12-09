/**
 * Storage Monitor Module
 * Display storage usage and warnings
 */

import { localStorageManager, sessionStorageManager } from './storage.js';
import { idbManager } from './indexedDB.js';
import { showToast } from './toast.js';

/**
 * Initialize storage monitor
 */
export function initializeStorageMonitor() {
    console.log('📊 Storage monitor initialized');
}

/**
 * Render storage info panel
 */
export async function renderStorageInfo(containerId = 'storageInfo') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const localStats = localStorageManager.getStatistics();
    const sessionStats = sessionStorageManager.getStatistics();
    const idbStats = await idbManager.getStatistics();
    const idbUsage = await idbManager.getUsage();
    
    container.innerHTML = `
        <div class="storage-monitor">
            <div class="storage-header">
                <h4 class="text-lg font-semibold mb-4">Storage Usage</h4>
            </div>
            
            <!-- localStorage -->
            <div class="storage-item mb-4">
                <div class="flex justify-between items-center mb-2">
                    <label class="font-medium">localStorage</label>
                    <span class="text-sm text-slate-600 dark:text-slate-400">
                        ${localStats.usage.usedMB}MB / ${localStats.usage.totalMB}MB
                    </span>
                </div>
                <div class="progress-bar bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div class="progress-fill bg-blue-500 h-2 rounded-full transition-all" 
                         style="width: ${Math.min(localStats.usage.percentage, 100)}%"></div>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ${localStats.totalItems} items • ${localStats.usage.percentage.toFixed(1)}% used
                </div>
            </div>
            
            <!-- sessionStorage -->
            <div class="storage-item mb-4">
                <div class="flex justify-between items-center mb-2">
                    <label class="font-medium">sessionStorage</label>
                    <span class="text-sm text-slate-600 dark:text-slate-400">
                        ${sessionStats.usage.usedMB}MB / ${sessionStats.usage.totalMB}MB
                    </span>
                </div>
                <div class="progress-bar bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div class="progress-fill bg-green-500 h-2 rounded-full transition-all" 
                         style="width: ${Math.min(sessionStats.usage.percentage, 100)}%"></div>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    ${sessionStats.totalItems} items • ${sessionStats.usage.percentage.toFixed(1)}% used
                </div>
            </div>
            
            ${idbUsage ? `
                <!-- IndexedDB -->
                <div class="storage-item mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <label class="font-medium">IndexedDB</label>
                        <span class="text-sm text-slate-600 dark:text-slate-400">
                            ${idbUsage.usedMB}MB / ${idbUsage.totalMB}MB
                        </span>
                    </div>
                    <div class="progress-bar bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div class="progress-fill bg-purple-500 h-2 rounded-full transition-all" 
                             style="width: ${Math.min(idbUsage.percentage, 100)}%"></div>
                    </div>
                    <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        ${idbStats.files.count} files, ${idbStats.sessions.count} sessions • 
                        ${idbUsage.percentage.toFixed(1)}% used
                    </div>
                </div>
            ` : ''}
            
            <!-- Actions -->
            <div class="storage-actions flex gap-2 mt-4">
                <button class="btn btn-secondary flex-1" onclick="window.clearOldStorageData()">
                    <i class="ph ph-trash mr-2"></i>
                    Clear Old Data
                </button>
                <button class="btn btn-secondary flex-1" onclick="window.showStorageDetails()">
                    <i class="ph ph-info mr-2"></i>
                    Details
                </button>
            </div>
            
            ${getStorageWarnings(localStats, idbUsage)}
        </div>
    `;
}

/**
 * Get storage warnings if needed
 */
function getStorageWarnings(localStats, idbUsage) {
    const warnings = [];
    
    if (localStats.usage.percentage > 90) {
        warnings.push({
            type: 'error',
            message: 'localStorage is almost full! Clear old data to prevent issues.'
        });
    } else if (localStats.usage.percentage > 80) {
        warnings.push({
            type: 'warning',
            message: 'localStorage is getting full. Consider clearing old data.'
        });
    }
    
    if (idbUsage && idbUsage.percentage > 90) {
        warnings.push({
            type: 'error',
            message: 'IndexedDB is almost full! Clear old files and sessions.'
        });
    }
    
    if (warnings.length === 0) return '';
    
    return `
        <div class="storage-warnings mt-4 space-y-2">
            ${warnings.map(w => `
                <div class="alert alert-${w.type} text-sm">
                    <i class="ph ph-warning-circle mr-2"></i>
                    ${w.message}
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Show detailed storage information
 */
export async function showStorageDetails() {
    const localItems = localStorageManager.getAllItems();
    const idbStats = await idbManager.getStatistics();
    const allFiles = await idbManager.getAllFiles();
    const allSessions = await idbManager.getAllSessions();
    
    // Create modal content
    const modalContent = `
        <div class="storage-details">
            <h3 class="text-xl font-bold mb-4">Storage Details</h3>
            
            <!-- localStorage Items -->
            <div class="mb-6">
                <h4 class="font-semibold mb-2">localStorage Items (${localItems.length})</h4>
                <div class="max-h-60 overflow-y-auto border dark:border-slate-700 rounded">
                    <table class="w-full text-sm">
                        <thead class="bg-slate-100 dark:bg-slate-800 sticky top-0">
                            <tr>
                                <th class="text-left p-2">Key</th>
                                <th class="text-right p-2">Size</th>
                                <th class="text-right p-2">Age</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${localItems.map(item => `
                                <tr class="border-t dark:border-slate-700">
                                    <td class="p-2 font-mono text-xs">${item.shortKey}</td>
                                    <td class="p-2 text-right">${formatBytes(item.size)}</td>
                                    <td class="p-2 text-right">${getAge(item.timestamp)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            ${idbStats ? `
                <!-- IndexedDB Files -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">IndexedDB Files (${allFiles.length})</h4>
                    <div class="max-h-60 overflow-y-auto border dark:border-slate-700 rounded">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                <tr>
                                    <th class="text-left p-2">ID</th>
                                    <th class="text-left p-2">Type</th>
                                    <th class="text-right p-2">Size</th>
                                    <th class="text-right p-2">Age</th>
                                    <th class="text-center p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allFiles.map(file => `
                                    <tr class="border-t dark:border-slate-700">
                                        <td class="p-2 font-mono text-xs">${file.id}</td>
                                        <td class="p-2">${file.type}</td>
                                        <td class="p-2 text-right">${formatBytes(file.size)}</td>
                                        <td class="p-2 text-right">${getAge(file.timestamp)}</td>
                                        <td class="p-2 text-center">
                                            <button class="text-red-600 hover:text-red-700" 
                                                    onclick="window.deleteIDBFile('${file.id}')">
                                                <i class="ph ph-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- IndexedDB Sessions -->
                <div class="mb-6">
                    <h4 class="font-semibold mb-2">Saved Sessions (${allSessions.length})</h4>
                    <div class="max-h-60 overflow-y-auto border dark:border-slate-700 rounded">
                        <table class="w-full text-sm">
                            <thead class="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                <tr>
                                    <th class="text-left p-2">ID</th>
                                    <th class="text-right p-2">Size</th>
                                    <th class="text-right p-2">Age</th>
                                    <th class="text-center p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allSessions.map(session => `
                                    <tr class="border-t dark:border-slate-700">
                                        <td class="p-2 font-mono text-xs">${session.id}</td>
                                        <td class="p-2 text-right">${formatBytes(session.size)}</td>
                                        <td class="p-2 text-right">${getAge(session.timestamp)}</td>
                                        <td class="p-2 text-center">
                                            <button class="text-blue-600 hover:text-blue-700 mr-2" 
                                                    onclick="window.restoreIDBSession('${session.id}')">
                                                <i class="ph ph-arrow-counter-clockwise"></i>
                                            </button>
                                            <button class="text-red-600 hover:text-red-700" 
                                                    onclick="window.deleteIDBSession('${session.id}')">
                                                <i class="ph ph-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Show in modal (assumes modal system exists)
    window.dispatchEvent(new CustomEvent('showModal', {
        detail: {
            title: 'Storage Details',
            content: modalContent,
            size: 'large'
        }
    }));
}

/**
 * Clear old storage data
 */
export async function clearOldStorageData() {
    if (!confirm('Clear old data from localStorage and IndexedDB?\n\nThis will remove:\n• Old upload history\n• Cached files older than 7 days\n• Sessions older than 30 days')) {
        return;
    }
    
    try {
        // Cleanup localStorage
        const localResult = localStorageManager.cleanup('lru');
        
        // Cleanup IndexedDB
        const deletedFiles = await idbManager.cleanupOldFiles();
        const deletedSessions = await idbManager.cleanupOldSessions();
        
        showToast(
            `Cleaned up: ${localResult.removed} localStorage items, ${deletedFiles} files, ${deletedSessions} sessions`,
            'success',
            5000
        );
        
        // Refresh display
        await renderStorageInfo();
    } catch (e) {
        console.error('Cleanup failed:', e);
        showToast('Failed to clean up storage', 'error');
    }
}

/**
 * Delete specific IndexedDB file
 */
export async function deleteIDBFile(id) {
    if (!confirm(`Delete file: ${id}?`)) return;
    
    try {
        await idbManager.deleteFile(id);
        showToast('File deleted', 'success');
        await showStorageDetails(); // Refresh
    } catch (e) {
        console.error('Failed to delete file:', e);
        showToast('Failed to delete file', 'error');
    }
}

/**
 * Delete specific IndexedDB session
 */
export async function deleteIDBSession(id) {
    if (!confirm(`Delete session: ${id}?`)) return;
    
    try {
        await idbManager.deleteSession(id);
        showToast('Session deleted', 'success');
        await showStorageDetails(); // Refresh
    } catch (e) {
        console.error('Failed to delete session:', e);
        showToast('Failed to delete session', 'error');
    }
}

/**
 * Restore IndexedDB session
 */
export async function restoreIDBSession(id) {
    try {
        const session = await idbManager.getSession(id);
        if (session && session.data) {
            window.dispatchEvent(new CustomEvent('restoreSession', {
                detail: session.data
            }));
            showToast('Session restored', 'success');
        }
    } catch (e) {
        console.error('Failed to restore session:', e);
        showToast('Failed to restore session', 'error');
    }
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get age of timestamp
 */
function getAge(timestamp) {
    if (!timestamp) return 'Unknown';
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'Just now';
}

// Export functions to window for onclick handlers
if (typeof window !== 'undefined') {
    window.clearOldStorageData = clearOldStorageData;
    window.showStorageDetails = showStorageDetails;
    window.deleteIDBFile = deleteIDBFile;
    window.deleteIDBSession = deleteIDBSession;
    window.restoreIDBSession = restoreIDBSession;
}

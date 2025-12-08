/**
 * Upload History Module
 * Manages file upload history and reuse functionality
 */

import { state } from './state.js';
import { formatTime, formatFileSize, saveToStorage } from './utils.js';

/**
 * Save file to upload history
 * @param {File} file - Uploaded file
 * @param {string} type - File type ('protokoll', 'abrechnung', etc.)
 */
export function saveToUploadHistory(file, type) {
    const entry = {
        id: Date.now().toString(),
        filename: file.name,
        size: file.size,
        type: type,
        timestamp: new Date().toISOString()
    };
    
    state.uploadHistory.unshift(entry);
    
    // Keep only last 10 entries
    if (state.uploadHistory.length > 10) {
        state.uploadHistory = state.uploadHistory.slice(0, 10);
    }
    
    saveToStorage('uet_upload_history', state.uploadHistory);
    renderUploadHistory();
}

/**
 * Load upload history from localStorage
 */
export function loadUploadHistory() {
    renderUploadHistory();
    
    if (state.uploadHistory.length > 0) {
        const historySection = document.getElementById('uploadHistorySection');
        if (historySection) {
            historySection.classList.remove('hidden');
        }
    }
}

/**
 * Render upload history list
 */
function renderUploadHistory() {
    const listContainer = document.getElementById('uploadHistoryList');
    if (!listContainer) return;
    
    if (state.uploadHistory.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center py-4 text-sm text-slate-400">
                No upload history yet
            </div>
        `;
        return;
    }
    
    listContainer.innerHTML = state.uploadHistory.map(entry => `
        <div class="upload-history-item">
            <div class="upload-history-info">
                <div class="upload-history-filename">${entry.filename}</div>
                <div class="upload-history-meta">
                    <span class="upload-history-type">${entry.type}</span>
                    <span class="upload-history-size">${formatFileSize(entry.size)}</span>
                    <span class="upload-history-timestamp">${formatTime(entry.timestamp)}</span>
                </div>
            </div>
        </div>
    `).join('');
}

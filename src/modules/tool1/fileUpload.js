/**
 * Tool 1 - File Upload Management Module
 * Handles dual file upload state, progress tracking, and metadata display
 */

import { state, updateState } from '../state.js';
import { showError } from '../toast.js';

/**
 * File status enum
 */
export const FileStatus = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    READY: 'ready',
    ERROR: 'error'
};

/**
 * Initialize file upload status for a file type
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {File} file - File object
 */
export function initializeFileUpload(fileType, file) {
    const uploadState = {
        file: file,
        status: FileStatus.UPLOADING,
        progress: 0,
        metadata: {
            name: file.name,
            size: file.size,
            uploadDate: new Date(),
            rowCount: 0
        },
        error: null
    };

    updateState(`tool1.${fileType}Upload`, uploadState);
    updateFileMetadataUI(fileType, uploadState);
}

/**
 * Update file upload progress
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} status - Current status
 */
export function updateFileProgress(fileType, progress, status = FileStatus.PROCESSING) {
    const uploadState = state.tool1[`${fileType}Upload`];
    if (!uploadState) return;

    uploadState.status = status;
    uploadState.progress = progress;
    
    updateState(`tool1.${fileType}Upload`, uploadState);
    updateProgressBarUI(fileType, progress, status);
}

/**
 * Mark file upload as complete
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {number} rowCount - Number of rows processed
 */
export function completeFileUpload(fileType, rowCount) {
    const uploadState = state.tool1[`${fileType}Upload`];
    if (!uploadState) return;

    uploadState.status = FileStatus.READY;
    uploadState.progress = 100;
    uploadState.metadata.rowCount = rowCount;
    
    updateState(`tool1.${fileType}Upload`, uploadState);
    updateFileMetadataUI(fileType, uploadState);
    updateStatusBadgeUI(fileType, FileStatus.READY);
}

/**
 * Mark file upload as failed
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {string} errorMessage - Error message
 */
export function failFileUpload(fileType, errorMessage) {
    const uploadState = state.tool1[`${fileType}Upload`];
    if (!uploadState) return;

    uploadState.status = FileStatus.ERROR;
    uploadState.error = errorMessage;
    
    updateState(`tool1.${fileType}Upload`, uploadState);
    updateStatusBadgeUI(fileType, FileStatus.ERROR, errorMessage);
}

/**
 * Clear file upload
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 */
export function clearFileUpload(fileType) {
    updateState(`tool1.${fileType}Upload`, null);
    updateState(`tool1.${fileType}Data`, null);
    
    // Clear UI
    clearFileMetadataUI(fileType);
    clearStatusBadgeUI(fileType);
    clearProgressBarUI(fileType);
}

/**
 * Update file metadata UI
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {Object} uploadState - Upload state object
 */
function updateFileMetadataUI(fileType, uploadState) {
    const metadataEl = document.getElementById(`${fileType}Metadata`);
    if (!metadataEl) return;

    const { name, size, uploadDate, rowCount } = uploadState.metadata;
    const formattedSize = formatFileSize(size);
    const formattedDate = formatDate(uploadDate);

    metadataEl.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600 flex items-center gap-2">
                    <i class="ph ph-file-text text-indigo-500" aria-hidden="true"></i>
                    <strong>File:</strong>
                </span>
                <span class="text-slate-800 font-medium">${name}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600 flex items-center gap-2">
                    <i class="ph ph-clock text-slate-400" aria-hidden="true"></i>
                    <strong>Uploaded:</strong>
                </span>
                <span class="text-slate-800">${formattedDate}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600 flex items-center gap-2">
                    <i class="ph ph-rows text-emerald-500" aria-hidden="true"></i>
                    <strong>Rows:</strong>
                </span>
                <span class="text-slate-800 font-medium">${rowCount > 0 ? rowCount.toLocaleString() : 'Processing...'}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
                <span class="text-slate-600 flex items-center gap-2">
                    <i class="ph ph-hard-drives text-slate-400" aria-hidden="true"></i>
                    <strong>Size:</strong>
                </span>
                <span class="text-slate-800">${formattedSize}</span>
            </div>
        </div>
    `;
    
    metadataEl.classList.remove('hidden');
}

/**
 * Update progress bar UI
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {number} progress - Progress percentage
 * @param {string} status - Current status
 */
function updateProgressBarUI(fileType, progress, status) {
    const progressContainer = document.getElementById(`${fileType}Progress`);
    if (!progressContainer) return;

    const statusText = getStatusText(status);
    
    progressContainer.innerHTML = `
        <div class="space-y-2">
            <div class="flex items-center justify-between text-xs text-slate-600">
                <span>${statusText}</span>
                <span class="font-medium">${Math.round(progress)}%</span>
            </div>
            <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div class="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                     style="width: ${progress}%"
                     role="progressbar"
                     aria-valuenow="${progress}"
                     aria-valuemin="0"
                     aria-valuemax="100"></div>
            </div>
        </div>
    `;
    
    progressContainer.classList.remove('hidden');
    
    // Hide progress bar when complete
    if (progress >= 100 && status === FileStatus.READY) {
        setTimeout(() => {
            progressContainer.classList.add('hidden');
        }, 1000);
    }
}

/**
 * Update status badge UI
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 * @param {string} status - File status
 * @param {string} errorMessage - Optional error message
 */
function updateStatusBadgeUI(fileType, status, errorMessage = null) {
    const badgeContainer = document.getElementById(`${fileType}StatusBadge`);
    if (!badgeContainer) return;

    const badgeConfig = getStatusBadgeConfig(status);
    
    badgeContainer.innerHTML = `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${badgeConfig.classes}">
            <i class="${badgeConfig.icon}" aria-hidden="true"></i>
            ${badgeConfig.text}
        </span>
        ${errorMessage ? `<span class="text-xs text-red-600 mt-1">${errorMessage}</span>` : ''}
    `;
    
    badgeContainer.classList.remove('hidden');
}

/**
 * Clear file metadata UI
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 */
function clearFileMetadataUI(fileType) {
    const metadataEl = document.getElementById(`${fileType}Metadata`);
    if (metadataEl) {
        metadataEl.innerHTML = '';
        metadataEl.classList.add('hidden');
    }
}

/**
 * Clear status badge UI
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 */
function clearStatusBadgeUI(fileType) {
    const badgeContainer = document.getElementById(`${fileType}StatusBadge`);
    if (badgeContainer) {
        badgeContainer.innerHTML = '';
        badgeContainer.classList.add('hidden');
    }
}

/**
 * Clear progress bar UI
 * @param {string} fileType - 'protokoll' or 'abrechnung'
 */
function clearProgressBarUI(fileType) {
    const progressContainer = document.getElementById(`${fileType}Progress`);
    if (progressContainer) {
        progressContainer.innerHTML = '';
        progressContainer.classList.add('hidden');
    }
}

/**
 * Get status badge configuration
 * @param {string} status - File status
 * @returns {Object} Badge configuration
 */
function getStatusBadgeConfig(status) {
    const configs = {
        [FileStatus.IDLE]: {
            text: 'Idle',
            icon: 'ph ph-circle',
            classes: 'bg-slate-100 text-slate-600'
        },
        [FileStatus.UPLOADING]: {
            text: 'Uploading',
            icon: 'ph ph-arrow-up',
            classes: 'bg-blue-100 text-blue-700'
        },
        [FileStatus.PROCESSING]: {
            text: 'Processing',
            icon: 'ph ph-spinner animate-spin',
            classes: 'bg-yellow-100 text-yellow-700'
        },
        [FileStatus.READY]: {
            text: 'Ready',
            icon: 'ph ph-check-circle',
            classes: 'bg-emerald-100 text-emerald-700'
        },
        [FileStatus.ERROR]: {
            text: 'Error',
            icon: 'ph ph-warning-circle',
            classes: 'bg-red-100 text-red-700'
        }
    };
    
    return configs[status] || configs[FileStatus.IDLE];
}

/**
 * Get status text
 * @param {string} status - File status
 * @returns {string} Status text
 */
function getStatusText(status) {
    const texts = {
        [FileStatus.UPLOADING]: 'Uploading file...',
        [FileStatus.PROCESSING]: 'Processing data...',
        [FileStatus.READY]: 'Complete',
        [FileStatus.ERROR]: 'Failed'
    };
    
    return texts[status] || 'Processing...';
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
function formatDate(date) {
    return date.toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

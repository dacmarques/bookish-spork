/**
 * Tool 1 - File Metadata Display Module
 * Shows file information in the UI
 */

import { formatFileSize } from '../utils.js';

/**
 * Show file metadata in UI
 * @param {string} type - File type ('protokoll' or 'abrechnung')
 * @param {File} file - File object
 * @param {boolean} isValid - Whether file is valid
 * @param {number} rowCount - Number of rows in the file (optional)
 */
export function showFileMetadata(type, file, isValid, rowCount = null) {
    const metadataId = type === 'protokoll' ? 'protokollMetadata' : 'abrechnungMetadata';
    const metadata = document.getElementById(metadataId);
    
    if (!metadata) return;
    
    const statusClass = isValid ? 'status-ready' : 'status-error';
    const statusText = isValid ? 'Ready' : 'Invalid';
    const statusIcon = isValid ? 'ph-check-circle' : 'ph-x-circle';
    
    const rowCountDisplay = rowCount ? `<span class="text-xs text-slate-500"> • ${rowCount} rows</span>` : '';
    
    metadata.innerHTML = `
        <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <div class="text-sm font-medium text-slate-700 truncate">${file.name}</div>
                    <div class="status-badge ${statusClass}">
                        <i class="ph ${statusIcon}"></i>
                        ${statusText}
                    </div>
                </div>
                <div class="text-xs text-slate-500 mt-1">
                    ${formatFileSize(file.size)}${rowCountDisplay}
                </div>
            </div>
            <button 
                class="btn-icon-sm clear-upload-btn" 
                data-file-type="${type}"
                title="Clear upload"
                aria-label="Clear ${type} file upload">
                <i class="ph ph-x"></i>
            </button>
        </div>
    `;
    
    metadata.classList.remove('hidden');
    
    // Attach clear handler
    const clearBtn = metadata.querySelector('.clear-upload-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => clearFileUpload(type));
    }
}

/**
 * Clear file upload and reset UI
 * @param {string} type - File type ('protokoll' or 'abrechnung')
 */
export function clearFileUpload(type) {
    const metadataId = type === 'protokoll' ? 'protokollMetadata' : 'abrechnungMetadata';
    const inputId = type === 'protokoll' ? 'protokollFileInput' : 'abrechnungFileInput';
    const dropzoneId = type === 'protokoll' ? 'protokollDropzone' : 'abrechnungDropzone';
    
    // Hide metadata
    const metadata = document.getElementById(metadataId);
    if (metadata) {
        metadata.classList.add('hidden');
        metadata.innerHTML = '';
    }
    
    // Clear file input
    const input = document.getElementById(inputId);
    if (input) {
        input.value = '';
    }
    
    // Reset dropzone styling
    const dropzone = document.getElementById(dropzoneId);
    if (dropzone) {
        dropzone.classList.remove('drag-over', 'file-loaded');
    }
    
    // Clear state (imported dynamically to avoid circular dependency)
    import('../state.js').then(({ updateState }) => {
        if (type === 'protokoll') {
            updateState('tool1.protokollData', null);
        } else {
            updateState('tool1.abrechnungData', null);
        }
    });
    
    // Show toast feedback
    import('../toast.js').then(({ showSuccess }) => {
        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} file cleared`);
    });
}

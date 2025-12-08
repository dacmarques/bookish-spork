/**
 * Tool 3 - Row Manager File Processor
 * Handles Excel file reading for row management
 */

import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderTable } from './renderer.js';

/**
 * Process uploaded Excel file for Row Manager
 * 
 * Validates file type, reads Excel content, and loads data into the row manager.
 * Extracts headers from the first row and data from subsequent rows. Updates
 * application state and triggers table rendering. Shows/hides appropriate UI
 * sections based on processing success.
 * 
 * @param {File} file - Excel file object from file input or drag-drop
 * @returns {void}
 * 
 * @sideEffects
 * - Validates file extension (.xlsx, .xls)
 * - Updates state.tool3.headers with first row
 * - Updates state.tool3.data with remaining rows
 * - Clears selection state (selectedIndices, lastSelectedIndex)
 * - Triggers renderTable() to display data
 * - Updates file metadata UI with dimensions
 * - Toggles visibility of upload area and results sections
 * - Shows error toast for invalid files
 * 
 * @example
 * // Called from file input change handler
 * const file = event.target.files[0];
 * processFile(file); // Loads Excel, renders table
 */
export function processFile(file) {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        showFileMetadata(file, false);
        showToast("Please upload a valid Excel file.", 'error');
        return;
    }

    showFileMetadata(file, true);

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

            if (json.length > 0) {
                state.tool3.headers = json[0];
                state.tool3.data = json.slice(1);
                state.tool3.selectedIndices.clear();
                state.tool3.lastSelectedIndex = null;

                renderTable();

                // Update dimensions in metadata
                const dimEl = document.getElementById('rmDimensions');
                if (dimEl) {
                    dimEl.textContent = `${state.tool3.data.length} rows × ${state.tool3.headers.length} columns`;
                    dimEl.classList.remove('hidden');
                }

                // Hide upload, show results
                const dropArea = document.getElementById('rm-drop-area');
                const results = document.getElementById('rm-results');
                if (dropArea) dropArea.classList.add('hidden');
                if (results) results.classList.remove('hidden');

                showToast(`Loaded ${file.name}`, 'success');
            } else {
                showToast("Empty file.", 'error');
            }
        } catch (err) {
            console.error(err);
            showToast("Error processing file", 'error');
        }
    };
    reader.readAsArrayBuffer(file);
}

/**
 * Display file metadata
 * @param {File} file - Uploaded file
 * @param {boolean} isValid - Whether file is valid
 */
function showFileMetadata(file, isValid) {
    const metadataEl = document.getElementById('rmMetadata');
    const fileNameEl = document.getElementById('rmFileName');
    const fileSizeEl = document.getElementById('rmFileSize');
    const validationEl = document.getElementById('rmValidation');

    if (!metadataEl || !fileNameEl || !fileSizeEl || !validationEl) return;

    // Format file size
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB} KB`;

    // Update metadata display
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = sizeDisplay;

    // Show validation status
    if (isValid) {
        validationEl.innerHTML = '<span class="text-green-700"><i class="ph ph-check-circle"></i> Valid file type</span>';
    } else {
        validationEl.innerHTML = '<span class="text-red-700"><i class="ph ph-x-circle"></i> Invalid file type - only .xlsx and .xls files are supported</span>';
    }

    metadataEl.classList.remove('hidden');
}

/**
 * Clear upload and reset state
 */
export function clearRowManagerUpload() {
    // Reset file input
    const fileInput = document.getElementById('rm-file-input');
    if (fileInput) fileInput.value = '';

    // Hide metadata
    const metadataEl = document.getElementById('rmMetadata');
    if (metadataEl) metadataEl.classList.add('hidden');

    // Clear data
    state.tool3.data = [];
    state.tool3.headers = [];
    state.tool3.selectedIndices.clear();
    state.tool3.lastSelectedIndex = null;

    // Hide results, show upload
    const results = document.getElementById('rm-results');
    const dropArea = document.getElementById('rm-drop-area');
    if (results) results.classList.add('hidden');
    if (dropArea) dropArea.classList.remove('hidden');

    showToast('Upload cleared', 'info');
}

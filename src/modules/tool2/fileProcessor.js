/**
 * Tool 2 - Smart Extractor File Processor
 * Handles Excel file reading and data extraction
 */

import { state, updateState } from '../state.js';
import { showToast } from '../toast.js';
import { processData } from './analyzer.js';

/**
 * Handle multiple file uploads
 * @param {FileList} files - Files from input or drop
 */
export function handleFiles(files) {
    const filesArray = [...files];
    const excelFiles = filesArray.filter(file => file.name.match(/\.xlsx$|\.xls$/));
    const invalidFiles = filesArray.filter(file => !file.name.match(/\.xlsx$|\.xls$/));

    // Show error for invalid files
    if (invalidFiles.length > 0) {
        showToast(`✗ Unsupported format: ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
    }

    if (excelFiles.length === 0) {
        return;
    }

    // Show file metadata section
    const metadataEl = document.getElementById('extractorMetadata');
    const fileListEl = document.getElementById('extractorFileList');
    const clearBtn = document.getElementById('btnClearUpload');

    metadataEl.classList.remove('hidden');
    if (clearBtn) clearBtn.classList.remove('hidden');

    // Add file info to list with validation feedback
    excelFiles.forEach(file => {
        const sizeKB = (file.size / 1024).toFixed(2);
        const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB} KB`;
        
        // Validate file
        const isValid = file.name.match(/\.xlsx$|\.xls$/i);
        const statusIcon = isValid ? 'check-circle' : 'x-circle';
        const statusColor = isValid ? 'text-green-600' : 'text-red-600';
        const statusText = isValid ? '✓ Valid .xlsx file' : '✗ Invalid format';

        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200';
        fileItem.setAttribute('data-filename', file.name);
        fileItem.innerHTML = `
            <div class="flex items-center gap-2 flex-1 min-w-0">
                <i class="ph ph-file-xls text-lg text-emerald-600 flex-shrink-0" aria-hidden="true"></i>
                <div class="flex-1 min-w-0">
                    <div class="font-medium text-sm text-slate-700 truncate" title="${file.name}">${file.name}</div>
                    <div class="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span>${sizeDisplay}</span>
                        <span class="text-slate-300">•</span>
                        <span class="row-count">Processing...</span>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
                <span class="validation-status text-xs font-medium ${statusColor} flex items-center gap-1">
                    <i class="ph ph-${statusIcon}" aria-hidden="true"></i>
                    ${statusText}
                </span>
            </div>
        `;
        fileListEl.appendChild(fileItem);

        // Initialize metadata for this file
        state.tool2.fileMetadata.set(file.name, {
            size: sizeDisplay,
            rowCount: null
        });
    });

    // Update file count badge
    updateFileCountBadge();

    // Process files
    excelFiles.forEach(readExcel);

    // Reset input so same file can be selected again if needed
    const fileInput = document.getElementById('fileElem');
    if (fileInput) fileInput.value = '';
}

/**
 * Update file count badge
 */
function updateFileCountBadge() {
    const badge = document.getElementById('fileCountBadge');
    if (badge) {
        const count = state.tool2.fileMetadata.size;
        badge.textContent = `${count} file${count !== 1 ? 's' : ''}`;
    }
}

/**
 * Read and process a single Excel file
 * 
 * Uses FileReader API to read the Excel file as an ArrayBuffer, then parses
 * it with the XLSX library. Converts the first worksheet to a 2D array matrix
 * and passes it to the analyzer for data extraction. Updates UI with row count
 * metadata and handles errors gracefully.
 * 
 * @param {File} file - Excel file object from input or drag-drop
 * @returns {void}
 * 
 * @sideEffects
 * - Reads file contents asynchronously
 * - Updates file metadata UI with row count
 * - Triggers processData() with extracted matrix
 * - Shows error toast on parsing failure
 * - Initializes Lucide icons after UI updates
 * 
 * @throws Will catch and display errors during file reading or parsing
 */
function readExcel(file) {
    const reader = new FileReader();

    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Assume first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to Array of Arrays
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

            // Update row count in metadata
            const rowCount = jsonData.length;
            if (state.tool2.fileMetadata.has(file.name)) {
                state.tool2.fileMetadata.get(file.name).rowCount = rowCount;
            }

            // Update UI to show row count
            updateFileRowCount(file.name, rowCount);

            processData(jsonData, file.name);
            showToast(`Datei gelesen: ${file.name}`, 'success');

        } catch (err) {
            console.error(err);
            showToast(`Fehler bei ${file.name}`, 'error');

            // Update UI to show error
            updateFileRowCount(file.name, 'Error');
        }
    };

    reader.readAsArrayBuffer(file);
}

/**
 * Update row count display for a file
 * @param {string} fileName - Name of the file
 * @param {number|string} rowCount - Row count or error message
 */
function updateFileRowCount(fileName, rowCount) {
    const fileListEl = document.getElementById('extractorFileList');
    const fileItem = Array.from(fileListEl.children).find(
        item => item.getAttribute('data-filename') === fileName
    );

    if (fileItem) {
        const rowCountEl = fileItem.querySelector('.row-count');
        const validationStatus = fileItem.querySelector('.validation-status');

        if (rowCountEl) {
            if (typeof rowCount === 'number') {
                rowCountEl.textContent = `${rowCount} rows`;
                rowCountEl.classList.remove('text-slate-500');
                rowCountEl.classList.add('text-slate-600', 'font-medium');
                
                // Update validation status to show success
                if (validationStatus) {
                    validationStatus.innerHTML = `
                        <i class="ph ph-check-circle" aria-hidden="true"></i>
                        ✓ ${rowCount} rows extracted
                    `;
                    validationStatus.className = 'validation-status text-xs font-medium text-green-600 flex items-center gap-1';
                }
            } else {
                rowCountEl.textContent = rowCount;
                rowCountEl.classList.add('text-red-600', 'font-medium');
                
                // Update validation status to show error
                if (validationStatus) {
                    validationStatus.innerHTML = `
                        <i class="ph ph-x-circle" aria-hidden="true"></i>
                        ✗ ${rowCount}
                    `;
                    validationStatus.className = 'validation-status text-xs font-medium text-red-600 flex items-center gap-1';
                }
            }
        }
    }
}

/**
 * Clear all uploaded files and reset state
 */
export function clearExtractorUpload() {
    const fileListEl = document.getElementById('extractorFileList');
    const metadataEl = document.getElementById('extractorMetadata');
    const clearBtn = document.getElementById('btnClearUpload');
    
    fileListEl.innerHTML = '';
    metadataEl.classList.add('hidden');
    if (clearBtn) clearBtn.classList.add('hidden');
    
    // Reset state
    state.tool2.fileMetadata.clear();
    
    // Reset file input
    const fileInput = document.getElementById('fileElem');
    if (fileInput) fileInput.value = '';
    
    showToast('Files cleared', 'success');
}

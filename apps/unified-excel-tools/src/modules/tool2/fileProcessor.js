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

    if (excelFiles.length === 0 && filesArray.length > 0) {
        showToast('Nur Excel-Dateien (.xlsx, .xls) erlaubt.', 'error');
        return;
    }

    // Show file metadata
    const metadataEl = document.getElementById('extractorMetadata');
    const fileListEl = document.getElementById('extractorFileList');

    metadataEl.classList.remove('hidden');

    // Add file info to list
    excelFiles.forEach(file => {
        const sizeKB = (file.size / 1024).toFixed(2);
        const sizeDisplay = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(2)} MB` : `${sizeKB} KB`;

        const fileItem = document.createElement('div');
        fileItem.className = 'flex items-center gap-2 text-xs';
        fileItem.setAttribute('data-filename', file.name);
        fileItem.innerHTML = `
            <i data-lucide="file-spreadsheet" class="w-3 h-3 text-blue-600"></i>
            <span class="font-medium">${file.name}</span>
            <span class="text-slate-400">•</span>
            <span class="text-slate-500">${sizeDisplay}</span>
            <span class="text-slate-400 row-count-separator hidden">•</span>
            <span class="text-slate-500 row-count hidden">Processing...</span>
        `;
        fileListEl.appendChild(fileItem);

        // Initialize metadata for this file
        state.tool2.fileMetadata.set(file.name, {
            size: sizeDisplay,
            rowCount: null
        });
    });

    // Re-initialize Lucide icons for new elements
    if (window.lucide) window.lucide.createIcons();

    // Process files
    excelFiles.forEach(readExcel);

    // Reset input so same file can be selected again if needed
    const fileInput = document.getElementById('fileElem');
    if (fileInput) fileInput.value = '';
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
        const separatorEl = fileItem.querySelector('.row-count-separator');

        if (rowCountEl && separatorEl) {
            rowCountEl.textContent = typeof rowCount === 'number' ? `${rowCount} rows` : rowCount;
            rowCountEl.classList.remove('hidden');
            separatorEl.classList.remove('hidden');
        }
    }
}

/**
 * Clear all uploaded files and reset state
 */
export function clearExtractorUpload() {
    const fileListEl = document.getElementById('extractorFileList');
    const metadataEl = document.getElementById('extractorMetadata');
    
    fileListEl.innerHTML = '';
    metadataEl.classList.add('hidden');
    
    // Reset state
    state.tool2.fileMetadata.clear();
    
    showToast('Uploads cleared', 'info');
}

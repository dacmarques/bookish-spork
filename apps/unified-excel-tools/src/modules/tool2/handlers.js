/**
 * Tool 2 - Smart Extractor Handlers
 * Event handlers for Smart Extractor tool
 */

import { state } from '../state.js';
import { handleFiles, clearExtractorUpload } from './fileProcessor.js';
import { renderTable, clearTable, exportToExcel } from './renderer.js';

/**
 * Setup Tool 2 event handlers
 */
export function setupTool2Handlers() {
    // Drop area handlers
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
        dropArea.addEventListener('click', () => {
            document.getElementById('fileElem')?.click();
        });

        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.add('drag-over');
        });

        dropArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only remove if leaving the dropzone itself
            if (e.target === dropArea) {
                dropArea.classList.remove('drag-over');
            }
        });

        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropArea.classList.remove('drag-over');
            
            const dt = e.dataTransfer;
            handleFiles(dt.files);
        });
    }

    // File input handler
    const fileInput = document.getElementById('fileElem');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleFiles(e.target.files);
            }
        });
    }

    // Filter input handler
    const filterInput = document.getElementById('filter-input-extractor');
    if (filterInput) {
        filterInput.addEventListener('keyup', (e) => {
            state.tool2.filter = e.target.value.toLowerCase();
            renderTable();
        });
    }

    // Make functions globally accessible for onclick handlers
    window.clearExtractorUpload = clearExtractorUpload;
    window.clearTable = clearTable;
    window.exportToExcel = exportToExcel;
    
    window.handleExtractorSort = function(column) {
        if (state.tool2.sort.column === column) {
            state.tool2.sort.direction = state.tool2.sort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            state.tool2.sort.column = column;
            state.tool2.sort.direction = 'asc';
        }
        renderTable();
    };

    console.log('Tool 2 handlers initialized');
}

/**
 * Tool 3 - Row Manager Handlers
 * Event handlers for Row Manager tool
 */

import { state } from '../state.js';
import { processFile, clearRowManagerUpload } from './fileProcessor.js';
import { handleTableClick, toggleSelectAll } from './selection.js';
import { handleDragStart, handleDragOver, handleDragEnd, handleDropRow, handleKeyboardReorder } from './dragDrop.js';
import { exportToExcel } from '../shared/export-utils.js';
import { showToast } from '../toast.js';

/**
 * Setup Tool 3 event handlers
 */
export function setupTool3Handlers() {
    // Copy Table Button Handler
    const btnCopyTable3 = document.getElementById('btnCopyTable3');
    if (btnCopyTable3) {
        btnCopyTable3.addEventListener('click', () => {
            const data = state.tool3.data;
            if (!data || data.length === 0) {
                showToast('No data to copy', 'error');
                return;
            }

            // Determine rows to copy: selected widely or all?
            // If we have selections, copy ONLY selected. If no selections, copy ALL.
            let rowsToCopy = [];
            if (state.tool3.selectedIndices.size > 0) {
                // Copy selected
                rowsToCopy = data.filter((_, index) => state.tool3.selectedIndices.has(index));
            } else {
                // Copy all (fallback)
                rowsToCopy = data;
            }

            if (rowsToCopy.length === 0) return;

            // Map to TSV
            const tsvContent = rowsToCopy.map(row => row.join('\t')).join('\n');

            navigator.clipboard.writeText(tsvContent)
                .then(() => {
                    const count = rowsToCopy.length;
                    showToast(`${count} row${count !== 1 ? 's' : ''} copied to clipboard!`, 'success');
                })
                .catch(err => {
                    console.error('Copy failed:', err);
                    showToast('Failed to copy rows', 'error');
                });
        });
    }

    // Export Buttons (Tool 3)
    const btnRmExportExcel = document.getElementById('btn-rm-export-excel');
    const btnRmSave = document.getElementById('btn-rm-save');

    const getRowManagerExportData = () => {
        if (!state.tool3.data || state.tool3.data.length === 0) return [];

        // Convert array of arrays back to array of objects using headers
        const headers = state.tool3.headers || [];
        // Fallback info if headers are missing

        return state.tool3.data.map(row => {
            const obj = {};
            row.forEach((cell, i) => {
                const header = headers[i] || `Column ${i + 1}`;
                obj[header] = cell;
            });
            return obj;
        });
    };

    if (btnRmExportExcel) {
        btnRmExportExcel.addEventListener('click', () => {
            exportToExcel(getRowManagerExportData(), 'Row_Manager_Export');
        });
    }

    if (btnRmSave) {
        btnRmSave.addEventListener('click', () => {
            exportToExcel(getRowManagerExportData(), 'Updated_File', 'Sheet1');
        });
    }

    // Drop area handlers
    const dropArea = document.getElementById('rm-drop-area');
    if (dropArea) {
        dropArea.addEventListener('click', () => {
            document.getElementById('rm-file-input')?.click();
        });

        // Keyboard accessibility for drop area
        dropArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('rm-file-input')?.click();
            }
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

            const file = e.dataTransfer.files[0];
            if (file) processFile(file);
        });
    }

    // File input handler
    const fileInput = document.getElementById('rm-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) processFile(file);
            e.target.value = ''; // Reset
        });
    }

    // Table event delegation
    const tbody = document.getElementById('rm-tbody');
    if (tbody) {
        tbody.addEventListener('click', handleTableClick);
        tbody.addEventListener('dragstart', handleDragStart);
        tbody.addEventListener('dragover', handleDragOver);
        tbody.addEventListener('dragend', handleDragEnd);
        tbody.addEventListener('drop', handleDropRow);
        tbody.addEventListener('keydown', handleKeyboardReorder);
    }

    // Select all checkbox
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'rm-select-all') {
            toggleSelectAll(e.target.checked);
        }
    });

    // Global functions for onclick handlers
    window.clearRowManagerUpload = clearRowManagerUpload;

    window.rmCopyRow = function (index) {
        const row = state.tool3.data[index];
        if (!row) return;
        const text = row.join('\t');
        navigator.clipboard.writeText(text).then(() => showToast("Row copied!", "success"));
    };

    window.rmBulkCopy = function (index) {
        const rows = state.tool3.data.slice(index, index + 22);
        if (!rows.length) return;
        const text = rows.map(r => r.join('\t')).join('\n');
        navigator.clipboard.writeText(text).then(() => showToast(`Copied ${rows.length} rows!`, "success"));
    };

    console.log('Tool 3 handlers initialized');
}

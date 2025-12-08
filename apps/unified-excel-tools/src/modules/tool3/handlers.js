/**
 * Tool 3 - Row Manager Handlers
 * Event handlers for Row Manager tool
 */

import { state } from '../state.js';
import { processFile, clearRowManagerUpload } from './fileProcessor.js';
import { handleTableClick, toggleSelectAll } from './selection.js';
import { handleDragStart, handleDragOver, handleDragEnd, handleDropRow } from './dragDrop.js';
import { showToast } from '../toast.js';

/**
 * Setup Tool 3 event handlers
 */
export function setupTool3Handlers() {
    // Drop area handlers
    const dropArea = document.getElementById('rm-drop-area');
    if (dropArea) {
        dropArea.addEventListener('click', () => {
            document.getElementById('rm-file-input')?.click();
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
    }

    // Select all checkbox
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'rm-select-all') {
            toggleSelectAll(e.target.checked);
        }
    });

    // Global functions for onclick handlers
    window.clearRowManagerUpload = clearRowManagerUpload;

    window.rmCopyRow = function(index) {
        const row = state.tool3.data[index];
        if (!row) return;
        const text = row.join('\t');
        navigator.clipboard.writeText(text).then(() => showToast("Row copied!", "success"));
    };

    window.rmBulkCopy = function(index) {
        const rows = state.tool3.data.slice(index, index + 22);
        if (!rows.length) return;
        const text = rows.map(r => r.join('\t')).join('\n');
        navigator.clipboard.writeText(text).then(() => showToast(`Copied ${rows.length} rows!`, "success"));
    };

    console.log('Tool 3 handlers initialized');
}

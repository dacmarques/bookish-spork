/**
 * Tool 2 - Smart Extractor Handlers
 * Event handlers for Smart Extractor tool
 */

import { state } from '../state.js';
import { handleFiles, clearExtractorUpload } from './fileProcessor.js';
import { renderTable, clearTable } from './renderer.js';
import { exportToExcel, exportToCSV, exportToJSON } from '../shared/export-utils.js';
import { readFromClipboard, parseClipboardData } from '../shared/clipboard-utils.js';
import { showToast } from '../toast.js';
import { initTableEnhancements, applyEnhancements } from './tableEnhancements.js';

/**
 * Setup Tool 2 event handlers
 */
export function setupTool2Handlers() {
    // Initialize advanced table features
    initTableEnhancements();
    
    // Make applyEnhancements globally accessible for renderer
    window.applyTableEnhancements = applyEnhancements;
    // Drop area handlers
    const dropArea = document.getElementById('drop-area');
    if (dropArea) {
        dropArea.addEventListener('click', () => {
            document.getElementById('fileElem')?.click();
        });

        // Keyboard accessibility
        dropArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                document.getElementById('fileElem')?.click();
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

    // Debug section toggle
    const debugToggle = document.getElementById('tool2DebugToggle');
    const debugContent = document.getElementById('tool2DebugContent');
    const debugIcon = document.getElementById('tool2DebugCollapseIcon');

    if (debugToggle && debugContent) {
        debugToggle.addEventListener('click', () => {
            const isExpanded = debugToggle.getAttribute('aria-expanded') === 'true';
            debugToggle.setAttribute('aria-expanded', !isExpanded);
            debugContent.classList.toggle('hidden');
            if (debugIcon) {
                debugIcon.classList.toggle('rotated');
            }
        });
    }

    // Copy debug info button
    const copyDebugBtn = document.getElementById('copyTool2DebugBtn');
    if (copyDebugBtn) {
        copyDebugBtn.addEventListener('click', () => {
            const debugInfo = document.getElementById('tool2DebugInfo');
            if (debugInfo) {
                navigator.clipboard.writeText(debugInfo.textContent).then(() => {
                    import('../toast.js').then(({ showToast }) => {
                        showToast('Debug info copied to clipboard', 'success');
                    });
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    import('../toast.js').then(({ showToast }) => {
                        showToast('Failed to copy debug info', 'error');
                    });
                });
            }
        });
    }

    // Copy Table Button
    const btnCopyTable2 = document.getElementById('btnCopyTable2');
    if (btnCopyTable2) {
        btnCopyTable2.addEventListener('click', () => {
            if (state.tool2.extractedData.length === 0) {
                showToast('No data to copy', 'error');
                return;
            }

            // Define headers
            const headers = ['File', 'Auftrag Nr.', 'Anlage', 'Einsatzort', 'Datum', 'Std.', 'Summe', 'Bemerkung'];

            // Generate TSV content
            const rows = state.tool2.extractedData.map(item => [
                item.fileName,
                item.auftragsNr,
                item.anlage,
                item.einsatzort,
                item.datum,
                item.fachmonteur,
                item.sumRaw.toString().replace('.', ','), // German decimal format for Excel
                item.bemerkung
            ].join('\t'));

            const tsvContent = [headers.join('\t'), ...rows].join('\n');

            navigator.clipboard.writeText(tsvContent)
                .then(() => showToast('Table copied to clipboard!', 'success'))
                .catch(err => {
                    console.error('Copy failed:', err);
                    showToast('Failed to copy table', 'error');
                });
        });
    }

    // Make functions globally accessible for onclick handlers
    window.clearExtractorUpload = clearExtractorUpload;
    window.clearTable = clearTable;
    // Export Buttons
    const btnExportExcel = document.getElementById('btn-export');
    const btnExportCsv = document.getElementById('btn-export-csv');
    const btnExportJson = document.getElementById('btn-export-json');

    const getExportData = () => {
        return state.tool2.extractedData.map(item => ({
            "Dateiname": item.fileName,
            "Auftragsnummer": item.auftragsNr,
            "Anlage": item.anlage,
            "Einsatzort": item.einsatzort,
            "Datum": item.datum,
            "Fachmonteurstunden": item.fachmonteur,
            "Auftragssumme": item.sumRaw,
            "Bemerkung": item.bemerkung
        }));
    };

    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', () => {
            exportToExcel(getExportData(), 'Smart_Extractor_Export');
        });
    }

    if (btnExportCsv) {
        btnExportCsv.addEventListener('click', () => {
            exportToCSV(getExportData(), 'Smart_Extractor_Export');
        });
    }

    if (btnExportJson) {
        btnExportJson.addEventListener('click', () => {
            exportToJSON(state.tool2.extractedData, 'Smart_Extractor_Export');
        });
    }

    // Paste from Clipboard
    const btnPasteClipboard = document.getElementById('btnPasteClipboard');
    if (btnPasteClipboard) {
        btnPasteClipboard.addEventListener('click', async () => {
            const text = await readFromClipboard();
            if (!text) return;

            const rows = parseClipboardData(text);
            if (rows.length === 0) {
                showToast('Clipboard is empty or invalid', 'warning');
                return;
            }

            // Simple heuristic to map clipboard data => extractedData
            // Assuming simplified structure or trying to guess. 
            // For now, let's treat them as new records with "Clipboard" as filename.

            let newRecords = 0;
            rows.forEach(row => {
                // Skip empty rows
                if (row.length < 2) return;

                // Attempt to map columns. This is "best effort" mapping.
                // Assuming order: Auftrag, Anlage, Einsatzort, Datum, Std, Summe
                // If data has headers, we might want to skip the first row if it looks like headers.

                // Basic Check if it's a header row
                const firstCell = String(row[0]).toLowerCase();
                if (firstCell.includes('auftrag') || firstCell.includes('anlage')) return;

                const item = {
                    id: Date.now() + Math.random(),
                    fileName: 'Clipboard Import',
                    auftragsNr: row[0] || '',
                    anlage: row[1] || '',
                    einsatzort: row[2] || '',
                    datum: row[3] || '',
                    fachmonteur: row[4] || '',
                    sumRaw: parseFloat((row[5] || '0').replace(',', '.')) || 0,
                    bemerkung: row[6] || ''
                };

                if (item.auftragsNr || item.anlage) {
                    state.tool2.extractedData.push(item);
                    state.tool2.validRecords++;
                    state.tool2.totalSum += item.sumRaw;
                    newRecords++;
                }
            });

            if (newRecords > 0) {
                renderTable();
                import('./renderer.js').then(({ updateUI }) => updateUI());
                showToast(`Imported ${newRecords} rows from clipboard`, 'success');
            } else {
                showToast('No valid rows found in clipboard', 'info');
            }
        });
    }

    // Make functions globally accessible for onclick handlers
    window.clearExtractorUpload = clearExtractorUpload;
    window.clearTable = clearTable;

    window.handleExtractorSort = function (column) {
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

/**
 * Tool 1 - File Processor Module
 * Handles Excel file processing for Value Counter tool
 */

import { state, updateState } from '../state.js';
import { showError, showSuccess } from '../toast.js';
import { isValidExcelFile } from '../utils.js';
import { saveToUploadHistory } from '../uploadHistory.js';
import { showFileMetadata } from './metadata.js';
import { analyzeData, updateDebugInfo } from './analyzer.js';
import { renderTable } from './renderer.js';

/**
 * Process Protokoll file
 * @param {File} file - Excel file to process
 */
export function processProtokolFile(file) {
    if (!isValidExcelFile(file)) {
        showFileMetadata('protokoll', file, false);
        showError('Invalid file format. Please upload an Excel file (.xlsx or .xls)');
        return;
    }

    saveToUploadHistory(file, 'protokoll');

    // Show loading indicator
    const processingIndicator = document.getElementById('processingIndicator');
    if (processingIndicator) {
        processingIndicator.innerHTML = `<i class="ph ph-spinner animate-spin text-lg" aria-hidden="true"></i> Processing ${file.name}...`;
        processingIndicator.classList.remove('hidden');
    }

    setTimeout(() => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

                updateState('tool1.protokollData', rows);
                showFileMetadata('protokoll', file, true, rows.length);
                analyzeData(rows);
                showSuccess(`Protokoll file loaded: ${file.name}`);
            } catch (error) {
                console.error('Error processing Protokoll file:', error);
                showFileMetadata('protokoll', file, false);
                showError('Failed to process Protokoll file');
            } finally {
                if (processingIndicator) {
                    processingIndicator.classList.add('hidden');
                    // Reset text
                    setTimeout(() => {
                        processingIndicator.innerHTML = `<i class="ph ph-spinner animate-spin text-lg" aria-hidden="true"></i> Processing...`;
                    }, 500);
                }
            }
        };

        reader.onerror = () => {
            showError('Failed to read file');
            if (processingIndicator) processingIndicator.classList.add('hidden');
        };

        reader.readAsArrayBuffer(file);
    }, 50);
}
/**
 * Process Abrechnung file
 * @param {File} file - Excel file to process
 */
export function processAbrechnungFile(file) {
    if (!isValidExcelFile(file)) {
        showFileMetadata('abrechnung', file, false);
        showError('Invalid file format. Please upload an Excel file (.xlsx or .xls)');
        return;
    }

    saveToUploadHistory(file, 'abrechnung');

    // Show loading indicator with filename
    const processingIndicator = document.getElementById('processingIndicator');
    if (processingIndicator) {
        processingIndicator.innerHTML = `<i class="ph ph-spinner animate-spin text-lg" aria-hidden="true"></i> Processing ${file.name}...`;
        processingIndicator.classList.remove('hidden');
    }

    // Small timeout to allow UI to update (show spinner) before heavy processing
    setTimeout(() => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

                updateState('tool1.abrechnungData', rows);
                showFileMetadata('abrechnung', file, true, rows.length);
                countTargetValues(rows);
                updateDebugInfo();
                showSuccess(`Abrechnung file loaded: ${file.name}`);
            } catch (error) {
                console.error('Error processing Abrechnung file:', error);
                showFileMetadata('abrechnung', file, false);
                showError('Failed to process Abrechnung file');
            } finally {
                // Hide loading indicator
                if (processingIndicator) {
                    processingIndicator.classList.add('hidden');
                    // Reset text
                    setTimeout(() => {
                        processingIndicator.innerHTML = `<i class="ph ph-spinner animate-spin text-lg" aria-hidden="true"></i> Processing...`;
                    }, 500);
                }
            }
        };

        reader.onerror = () => {
            showError('Failed to read file');
            if (processingIndicator) processingIndicator.classList.add('hidden');
        };

        reader.readAsArrayBuffer(file);
    }, 50);
}

/**
 * Count target values in Abrechnung data
 * 
 * Performs a case-insensitive search through all cells in the Abrechnung file
 * to count occurrences of each target value extracted from the Protokoll file.
 * Uses substring matching (includes) to find targets within cell content.
 * Updates application state and triggers table rendering with the results.
 * 
 * @param {Array<Array<any>>} rows - 2D array of Excel data from Abrechnung file
 * @returns {void}
 * 
 * @sideEffects
 * - Updates state.tool1.lastCountsMap with counts for each target
 * - Updates state.tool1.lastTotalMatches with total matches found
 * - Updates state.tool1.lastRowCount with number of rows processed
 * - Updates state.tool1.lastUniqueTargets with count of targets that had matches
 * - Triggers renderTable() to display results
 * 
 * @example
 * // If currentTargets = ['ABC123', 'XYZ789'] and Abrechnung contains:
 * // Row 1: ['ABC123', 'data', 'ABC123']
 * // Row 2: ['XYZ789', 'info']
 * // Results: {ABC123: 2, XYZ789: 1}, totalMatches: 3
 */
function countTargetValues(rows) {
    const targets = state.tool1.currentTargets;
    if (targets.length === 0) return;

    const countsMap = {};
    let totalMatches = 0;

    targets.forEach(target => {
        countsMap[target] = 0;
    });

    // Count occurrences
    rows.forEach(row => {
        row.forEach(cell => {
            const cellStr = String(cell).trim();
            targets.forEach(target => {
                if (cellStr.toLowerCase().includes(target.toLowerCase())) {
                    countsMap[target]++;
                    totalMatches++;
                }
            });
        });
    });

    // Calculate unique targets found (targets with at least 1 match)
    const uniqueTargetsFound = Object.values(countsMap).filter(count => count > 0).length;

    updateState('tool1.lastCountsMap', countsMap);
    updateState('tool1.lastTotalMatches', totalMatches);
    updateState('tool1.lastRowCount', rows.length);
    updateState('tool1.lastUniqueTargets', uniqueTargetsFound);

    renderTable(countsMap, totalMatches, rows.length, uniqueTargetsFound);
}

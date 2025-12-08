/**
 * Tool 1 - Data Analyzer Module
 * Analyzes Protokoll data and extracts header information
 */

import { state, updateState } from '../state.js';

/**
 * Analyze Protokoll data and extract header information
 * @param {Array} rows - Excel rows
 */
export function analyzeData(rows) {
    const extractedHeader = {};
    
    // Extract header fields
    extractedHeader.datum = findValue(rows, "Nr.:");
    extractedHeader.auftragNr = findValue(rows, "Auftrag Nr.:");
    extractedHeader.ort = findOrtValue(rows);
    extractedHeader.kunde = findValue(rows, "Kunde:");
    extractedHeader.anlage = findValue(rows, "Anlage:");
    
    updateState('tool1.extractedHeader', extractedHeader);
    
    // Render extracted header
    renderExtractedHeader(extractedHeader);
}

/**
 * Find value in rows by search string
 * 
 * Searches through all cells in the Excel data matrix to find a cell matching
 * the search string, then returns the value from the cell immediately to its right.
 * This is used to extract header metadata from Protokoll files where labels are
 * in one cell and values are in the adjacent cell.
 * 
 * @param {Array<Array<any>>} rows - 2D array representing Excel rows and columns
 * @param {string} searchStr - Exact string to search for (case-sensitive)
 * @returns {string} The value found in the cell to the right of the match, or empty string if not found
 * 
 * @example
 * const rows = [['Name:', 'John'], ['Age:', '30']];
 * findValue(rows, 'Name:'); // Returns 'John'
 */
function findValue(rows, searchStr) {
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
            const cell = String(row[c]).trim();
            if (cell === searchStr && c + 1 < row.length) {
                return String(row[c + 1]).trim();
            }
        }
    }
    return '';
}

/**
 * Find "Ort" value (special case - looks below instead of right)
 * 
 * Special extraction logic for the "Ort" (location) field in Protokoll files.
 * Unlike other fields, "Ort" appears twice in the document. We need the second
 * occurrence, and its value is located in the cell directly BELOW the label
 * (not to the right like other fields).
 * 
 * @param {Array<Array<any>>} rows - 2D array representing Excel rows and columns
 * @returns {string} The value found below the second occurrence of "Ort:", or empty string if not found
 * 
 * @example
 * const rows = [
 *   ['Ort:', 'Berlin'],     // First occurrence (ignored)
 *   ['...'],
 *   ['Ort:'],               // Second occurrence
 *   ['Munich']              // Value returned (cell below)
 * ];
 * findOrtValue(rows); // Returns 'Munich'
 */
function findOrtValue(rows) {
    let occ = 0;
    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        for (let c = 0; c < row.length; c++) {
            const cell = String(row[c]).trim();
            if (cell === "Ort:") {
                occ++;
                if (occ === 2 && r + 1 < rows.length) {
                    return String(rows[r + 1][c]).trim();
                }
            }
        }
    }
    return '';
}

/**
 * Render extracted header information to the UI
 * 
 * Takes the extracted metadata from the Protokoll file and renders it in a
 * grid layout with labels and values. Updates the DOM element with ID
 * 'extractedHeaderInfo'. Each field is displayed with an uppercase label
 * and the extracted value (or 'N/A' if not found).
 * 
 * @param {Object} header - Extracted header data object
 * @param {string} header.datum - Date value from "Nr.:" field
 * @param {string} header.auftragNr - Order number from "Auftrag Nr.:" field
 * @param {string} header.ort - Location from "Ort:" field (second occurrence)
 * @param {string} header.kunde - Customer name from "Kunde:" field
 * @param {string} header.anlage - Facility/plant name from "Anlage:" field
 * 
 * @returns {void}
 */
function renderExtractedHeader(header) {
    const container = document.getElementById('extractedHeaderInfo');
    if (!container) return;
    
    container.innerHTML = `
        <div class="grid grid-cols-2 gap-4">
            <div>
                <div class="text-xs text-slate-500 uppercase tracking-wide">Datum</div>
                <div class="text-sm font-medium text-slate-700 mt-1">${header.datum || 'N/A'}</div>
            </div>
            <div>
                <div class="text-xs text-slate-500 uppercase tracking-wide">Auftrag Nr.</div>
                <div class="text-sm font-medium text-slate-700 mt-1">${header.auftragNr || 'N/A'}</div>
            </div>
            <div>
                <div class="text-xs text-slate-500 uppercase tracking-wide">Ort</div>
                <div class="text-sm font-medium text-slate-700 mt-1">${header.ort || 'N/A'}</div>
            </div>
            <div>
                <div class="text-xs text-slate-500 uppercase tracking-wide">Kunde</div>
                <div class="text-sm font-medium text-slate-700 mt-1">${header.kunde || 'N/A'}</div>
            </div>
            <div class="col-span-2">
                <div class="text-xs text-slate-500 uppercase tracking-wide">Anlage</div>
                <div class="text-sm font-medium text-slate-700 mt-1">${header.anlage || 'N/A'}</div>
            </div>
        </div>
    `;
    
    // Update debug info
    updateDebugInfo();
}

/**
 * Update debug information display
 */
export function updateDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;
    
    const { tool1 } = state;
    const timestamp = new Date().toLocaleString();
    
    const debugData = {
        timestamp,
        files: {
            protokoll: tool1.protokollData ? `Loaded (${tool1.protokollData.length} rows)` : 'Not loaded',
            abrechnung: tool1.abrechnungData ? `Loaded (${tool1.abrechnungData.length} rows)` : 'Not loaded',
        },
        extractedHeader: tool1.extractedHeader || {},
        targets: {
            count: tool1.currentTargets.length,
            list: tool1.currentTargets,
        },
        results: {
            totalMatches: tool1.lastTotalMatches || 0,
            uniqueTargets: tool1.lastCountsMap ? Object.keys(tool1.lastCountsMap).length : 0,
        },
        sort: tool1.sort,
    };
    
    debugInfo.textContent = JSON.stringify(debugData, null, 2);
}

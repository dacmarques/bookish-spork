/**
 * Tool 2 - Smart Extractor Data Analyzer
 * Extracts and processes data from Excel matrices
 */

import { state } from '../state.js';
import { showToast } from '../toast.js';
import { renderTable, updateUI } from './renderer.js';

/**
 * Helper: Clean string for comparison
 */
const cleanStr = (val) => String(val || '').trim().toLowerCase();

/**
 * Parse Excel date to DD.MM.YYYY format
 * 
 * Converts Excel numeric date values (days since 1900) to human-readable
 * German date format. Excel stores dates as sequential numbers where
 * 1 = January 1, 1900. Uses XLSX library's SSF (SpreadSheet Format) parser.
 * 
 * @param {number|string} value - Excel date value (numeric) or pre-formatted string
 * @returns {string} Date formatted as DD.MM.YYYY (e.g., "15.03.2024"), or empty string if invalid
 * 
 * @example
 * parseExcelDate(44927); // Returns "15.01.2023" (Excel numeric date)
 * parseExcelDate("15.01.2023"); // Returns "15.01.2023" (already formatted)
 * parseExcelDate(""); // Returns ""
 */
function parseExcelDate(value) {
    if (!value) return "";
    
    // Excel numeric date
    if (typeof value === 'number') {
        const dateObj = XLSX.SSF.parse_date_code(value);
        if (dateObj) {
            const day = String(dateObj.d).padStart(2, '0');
            const month = String(dateObj.m).padStart(2, '0');
            return `${day}.${month}.${dateObj.y}`;
        }
    }
    
    // If it's already a string, assume it's fine but maybe trim it
    return String(value).trim();
}

/**
 * Parse currency value to number
 * 
 * Intelligently parses currency strings from both German and US formats.
 * Removes currency symbols (€, $, etc.) and handles different decimal/thousand
 * separators. German format uses periods for thousands and commas for decimals,
 * while US format is the opposite.
 * 
 * @param {number|string} value - Currency value to parse
 * @returns {number} Parsed numeric value, or 0 if parsing fails
 * 
 * @example
 * parseCurrency("1.234,56 €"); // Returns 1234.56 (German format)
 * parseCurrency("1,234.56"); // Returns 1234.56 (US format)
 * parseCurrency("50,00"); // Returns 50.00 (German decimal)
 * parseCurrency(123.45); // Returns 123.45 (already numeric)
 * parseCurrency(""); // Returns 0
 * 
 * @algorithm
 * 1. Return as-is if already a number
 * 2. Strip currency symbols and whitespace
 * 3. Detect format by position of comma vs period
 * 4. Convert to standard decimal format (period for decimal)
 * 5. Parse with parseFloat
 */
function parseCurrency(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;

    // Remove currency symbols and whitespace
    let clean = String(value).replace(/[^\d.,-]/g, '').trim();

    // German format detection
    if (clean.indexOf(',') > -1 && clean.indexOf('.') > -1) {
        if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
            // German: 1.234,56
            clean = clean.replace(/\./g, '').replace(',', '.');
        } else {
            // US: 1,234.56
            clean = clean.replace(/,/g, '');
        }
    } else if (clean.indexOf(',') > -1) {
        // Assume German decimal only: 50,00
        clean = clean.replace(',', '.');
    }

    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

/**
 * Flexible value finder in Excel matrix
 * 
 * Searches through a 2D Excel matrix to find a cell matching the search label,
 * then extracts the associated value based on the specified logic type.
 * Performs case-insensitive matching with whitespace trimming.
 * 
 * @param {Array<Array<any>>} matrix - 2D array of Excel data (rows × columns)
 * @param {string} searchLabel - Label text to search for (e.g., "Total:", "Name:")
 * @param {'next_col'|'prev_col'|'next_row'} logicType - Where to find the value relative to the label:
 *   - 'next_col': Value is in the cell to the right of the label
 *   - 'prev_col': Value is in the cell to the left of the label
 *   - 'next_row': Value is in the cell below the label (same column)
 * @returns {string} Found value or empty string if not found or out of bounds
 * 
 * @example
 * const data = [
 *   ['Name:', 'John', 'Age:', '30'],
 *   ['City:'],
 *   ['Berlin']
 * ];
 * findValueInMatrix(data, 'Name:', 'next_col'); // Returns 'John'
 * findValueInMatrix(data, '30', 'prev_col'); // Returns 'Age:'
 * findValueInMatrix(data, 'City:', 'next_row'); // Returns 'Berlin'
 */
function findValueInMatrix(matrix, searchLabel, logicType) {
    const label = cleanStr(searchLabel);

    for (let r = 0; r < matrix.length; r++) {
        const row = matrix[r];
        if (!row) continue;

        for (let c = 0; c < row.length; c++) {
            const cellValue = cleanStr(row[c]);

            if (cellValue.includes(label) && cellValue.length > 0) {
                // Next Column (Scan right up to 5 cells for non-empty)
                if (logicType === 'next_col') {
                    for (let offset = 1; offset <= 5; offset++) {
                        let val = row[c + offset];
                        if (val !== undefined && val !== null && String(val).trim() !== "") {
                            return val;
                        }
                    }
                    return "";
                }

                // Previous Column (Immediate left)
                if (logicType === 'prev_col') {
                    let val = row[c - 1];
                    return (val !== undefined && val !== null && String(val).trim() !== "") ? val : "";
                }

                // Next Row (Below)
                if (logicType === 'next_row') {
                    if (matrix[r + 1]) {
                        let val = matrix[r + 1][c];
                        return (val !== undefined && val !== null && String(val).trim() !== "") ? val : "";
                    }
                    return "";
                }
            }
        }
    }
    return "";
}

/**
 * Process Excel data and extract relevant information
 * @param {Array<Array>} matrix - 2D array of Excel data
 * @param {string} fileName - Name of the source file
 */
export function processData(matrix, fileName) {
    // Hide empty state
    const emptyState = document.getElementById('empty-state');
    if (emptyState) emptyState.style.display = 'none';

    // Extract data using column mapping
    const rawDatum = findValueInMatrix(matrix, "Datum", 'next_col');
    const datum = parseExcelDate(rawDatum) || rawDatum;

    const auftragsNr = findValueInMatrix(matrix, "Auftrags-Nr.", 'next_col');
    const anlage = findValueInMatrix(matrix, "Anlage", 'next_col');
    const einsatzort = findValueInMatrix(matrix, "Einsatzort", 'next_col');
    const fachmonteur = findValueInMatrix(matrix, "Fachmonteurstunde", 'prev_col');
    const bemerkung = findValueInMatrix(matrix, "Bemerkung", 'next_row');

    const rawSum = findValueInMatrix(matrix, "Auftragssumme", 'next_col');
    const parsedSum = rawSum !== "" ? parseCurrency(rawSum) : 0;

    // Build debug info
    const debugData = {
        fileName,
        matrixSize: `${matrix.length} rows × ${matrix[0]?.length || 0} columns`,
        extractedValues: {
            'Datum (raw)': rawDatum,
            'Datum (parsed)': datum,
            'Auftrags-Nr.': auftragsNr,
            'Anlage': anlage,
            'Einsatzort': einsatzort,
            'Fachmonteurstunde': fachmonteur,
            'Auftragssumme (raw)': rawSum,
            'Auftragssumme (parsed)': parsedSum,
            'Bemerkung': bemerkung
        },
        firstFiveRows: matrix.slice(0, 5).map(row => row.slice(0, 8))
    };
    
    updateDebugInfo(debugData);

    // Prevent adding empty rows if essentially no data found
    if (!datum && !auftragsNr && !parsedSum) {
        showToast(`Keine relevanten Daten in ${fileName} gefunden`, 'error');
        return;
    }

    // Update Global State
    if (parsedSum > 0) {
        state.tool2.totalSum += parsedSum;
        state.tool2.validRecords++;
    }

    // Save for Export
    const record = {
        fileName,
        datum,
        auftragsNr,
        anlage,
        einsatzort,
        fachmonteur,
        sumRaw: parsedSum,
        bemerkung
    };
    state.tool2.extractedData.push(record);

    updateUI();
    renderTable();
}

/**
 * Update debug information display
 * @param {Object} debugData - Debug data to display
 */
function updateDebugInfo(debugData) {
    const debugInfoEl = document.getElementById('tool2DebugInfo');
    if (!debugInfoEl) return;

    const debugText = `
File: ${debugData.fileName}
Matrix Size: ${debugData.matrixSize}

Extracted Values:
${Object.entries(debugData.extractedValues)
    .map(([key, value]) => `  ${key}: ${value || '(empty)'}`)
    .join('\n')}

First 5 Rows (Preview):
${debugData.firstFiveRows.map((row, i) => 
    `  Row ${i + 1}: [${row.map(cell => JSON.stringify(cell)).join(', ')}]`
).join('\n')}
    `.trim();

    debugInfoEl.textContent = debugText;
}

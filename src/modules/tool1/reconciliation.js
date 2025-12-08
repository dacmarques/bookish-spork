/**
 * Tool 1 - Reconciliation Module
 * Compares Protokoll and Abrechnung files to find matches and discrepancies
 */

import { state, updateState } from '../state.js';

/**
 * Reconciliation result types
 */
export const ReconciliationType = {
    MATCH: 'match',
    MISSING_IN_ABRECHNUNG: 'missing_in_abrechnung',
    MISSING_IN_PROTOKOLL: 'missing_in_protokoll',
    AMOUNT_MISMATCH: 'amount_mismatch',
    DATE_MISMATCH: 'date_mismatch'
};

/**
 * Perform reconciliation between Protokoll and Abrechnung files
 * @returns {Object} Reconciliation results
 */
export function performReconciliation() {
    const protokollData = state.tool1.protokollData;
    const abrechnungData = state.tool1.abrechnungData;

    if (!protokollData || !abrechnungData) {
        return null;
    }

    const results = {
        matches: [],
        discrepancies: [],
        summary: {
            totalProtokoll: protokollData.length - 1, // Exclude header
            totalAbrechnung: abrechnungData.length - 1,
            matchCount: 0,
            discrepancyCount: 0,
            missingInAbrechnung: 0,
            missingInProtokoll: 0,
            amountMismatches: 0
        }
    };

    // Extract headers
    const protokollHeader = protokollData[0] || [];
    const abrechnungHeader = abrechnungData[0] || [];

    // Find key columns (Auftrags-Nr., Betrag, Datum)
    const protokollColumns = findKeyColumns(protokollHeader);
    const abrechnungColumns = findKeyColumns(abrechnungHeader);

    if (!protokollColumns.orderNumber || !abrechnungColumns.orderNumber) {
        console.warn('Could not find order number columns for reconciliation');
        return results;
    }

    // Build maps for fast lookup
    const protokollMap = new Map();
    const abrechnungMap = new Map();

    // Process Protokoll data
    for (let i = 1; i < protokollData.length; i++) {
        const row = protokollData[i];
        const orderNumber = normalizeOrderNumber(row[protokollColumns.orderNumber]);
        
        if (orderNumber) {
            protokollMap.set(orderNumber, {
                index: i,
                row: row,
                orderNumber: orderNumber,
                amount: parseAmount(row[protokollColumns.amount]),
                date: row[protokollColumns.date] || ''
            });
        }
    }

    // Process Abrechnung data
    for (let i = 1; i < abrechnungData.length; i++) {
        const row = abrechnungData[i];
        const orderNumber = normalizeOrderNumber(row[abrechnungColumns.orderNumber]);
        
        if (orderNumber) {
            abrechnungMap.set(orderNumber, {
                index: i,
                row: row,
                orderNumber: orderNumber,
                amount: parseAmount(row[abrechnungColumns.amount]),
                date: row[abrechnungColumns.date] || ''
            });
        }
    }

    // Compare and find matches/discrepancies
    protokollMap.forEach((protokollEntry, orderNumber) => {
        const abrechnungEntry = abrechnungMap.get(orderNumber);

        if (!abrechnungEntry) {
            // Missing in Abrechnung
            results.discrepancies.push({
                type: ReconciliationType.MISSING_IN_ABRECHNUNG,
                orderNumber: orderNumber,
                protokollData: protokollEntry,
                abrechnungData: null,
                message: `Order ${orderNumber} found in Protokoll but missing in Abrechnung`
            });
            results.summary.missingInAbrechnung++;
        } else {
            // Compare amounts
            const amountMatch = Math.abs(protokollEntry.amount - abrechnungEntry.amount) < 0.01;

            if (amountMatch) {
                results.matches.push({
                    type: ReconciliationType.MATCH,
                    orderNumber: orderNumber,
                    protokollData: protokollEntry,
                    abrechnungData: abrechnungEntry,
                    amount: protokollEntry.amount
                });
                results.summary.matchCount++;
            } else {
                results.discrepancies.push({
                    type: ReconciliationType.AMOUNT_MISMATCH,
                    orderNumber: orderNumber,
                    protokollData: protokollEntry,
                    abrechnungData: abrechnungEntry,
                    message: `Amount mismatch for order ${orderNumber}: Protokoll ${protokollEntry.amount.toFixed(2)} vs Abrechnung ${abrechnungEntry.amount.toFixed(2)}`,
                    difference: Math.abs(protokollEntry.amount - abrechnungEntry.amount)
                });
                results.summary.amountMismatches++;
            }

            // Mark as processed
            abrechnungMap.delete(orderNumber);
        }
    });

    // Remaining entries in Abrechnung are missing in Protokoll
    abrechnungMap.forEach((abrechnungEntry, orderNumber) => {
        results.discrepancies.push({
            type: ReconciliationType.MISSING_IN_PROTOKOLL,
            orderNumber: orderNumber,
            protokollData: null,
            abrechnungData: abrechnungEntry,
            message: `Order ${orderNumber} found in Abrechnung but missing in Protokoll`
        });
        results.summary.missingInProtokoll++;
    });

    results.summary.discrepancyCount = results.discrepancies.length;

    // Save to state
    updateState('tool1.reconciliation', results);

    return results;
}

/**
 * Find key columns in header row
 * @param {Array} header - Header row
 * @returns {Object} Column indices
 */
function findKeyColumns(header) {
    const columns = {
        orderNumber: null,
        amount: null,
        date: null
    };

    header.forEach((cell, index) => {
        const normalized = String(cell).toLowerCase().trim();

        // Order number patterns
        if (normalized.includes('auftrags') || normalized.includes('order') || 
            normalized.includes('nr.') || normalized.includes('nummer')) {
            columns.orderNumber = index;
        }

        // Amount patterns
        if (normalized.includes('betrag') || normalized.includes('amount') || 
            normalized.includes('summe') || normalized.includes('wert')) {
            columns.amount = index;
        }

        // Date patterns
        if (normalized.includes('datum') || normalized.includes('date') || 
            normalized.includes('zeit') || normalized.includes('time')) {
            columns.date = index;
        }
    });

    return columns;
}

/**
 * Normalize order number for comparison
 * @param {*} value - Order number value
 * @returns {string} Normalized order number
 */
function normalizeOrderNumber(value) {
    if (value === null || value === undefined || value === '') {
        return '';
    }

    return String(value).trim().toUpperCase();
}

/**
 * Parse amount from cell value
 * @param {*} value - Amount value
 * @returns {number} Parsed amount
 */
function parseAmount(value) {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        // Remove currency symbols, spaces, and convert German format
        const cleaned = value
            .replace(/[€$£\s]/g, '')
            .replace(/\./g, '') // Remove thousand separators
            .replace(',', '.'); // Convert decimal comma to dot

        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    return 0;
}

/**
 * Get reconciliation summary statistics
 * @returns {Object} Summary statistics
 */
export function getReconciliationSummary() {
    const reconciliation = state.tool1.reconciliation;
    
    if (!reconciliation) {
        return {
            hasData: false,
            totalProtokoll: 0,
            totalAbrechnung: 0,
            matchCount: 0,
            discrepancyCount: 0,
            matchPercentage: 0
        };
    }

    const { summary } = reconciliation;
    const total = Math.max(summary.totalProtokoll, summary.totalAbrechnung);
    const matchPercentage = total > 0 ? (summary.matchCount / total) * 100 : 0;

    return {
        hasData: true,
        ...summary,
        matchPercentage: matchPercentage.toFixed(1)
    };
}

/**
 * Get discrepancies by type
 * @param {string} type - Reconciliation type
 * @returns {Array} Filtered discrepancies
 */
export function getDiscrepanciesByType(type) {
    const reconciliation = state.tool1.reconciliation;
    
    if (!reconciliation || !reconciliation.discrepancies) {
        return [];
    }

    if (!type) {
        return reconciliation.discrepancies;
    }

    return reconciliation.discrepancies.filter(d => d.type === type);
}

/**
 * Export reconciliation results to CSV
 * @returns {string} CSV content
 */
export function exportReconciliationToCSV() {
    const reconciliation = state.tool1.reconciliation;
    
    if (!reconciliation) {
        return '';
    }

    const rows = [
        ['Type', 'Order Number', 'Protokoll Amount', 'Abrechnung Amount', 'Difference', 'Message']
    ];

    // Add matches
    reconciliation.matches.forEach(match => {
        rows.push([
            'Match',
            match.orderNumber,
            match.amount.toFixed(2),
            match.amount.toFixed(2),
            '0.00',
            'Amounts match'
        ]);
    });

    // Add discrepancies
    reconciliation.discrepancies.forEach(discrepancy => {
        const protokollAmount = discrepancy.protokollData ? discrepancy.protokollData.amount.toFixed(2) : 'N/A';
        const abrechnungAmount = discrepancy.abrechnungData ? discrepancy.abrechnungData.amount.toFixed(2) : 'N/A';
        const difference = discrepancy.difference ? discrepancy.difference.toFixed(2) : 'N/A';

        rows.push([
            getReconciliationTypeLabel(discrepancy.type),
            discrepancy.orderNumber,
            protokollAmount,
            abrechnungAmount,
            difference,
            discrepancy.message
        ]);
    });

    return rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}

/**
 * Get reconciliation type label
 * @param {string} type - Reconciliation type
 * @returns {string} Label
 */
function getReconciliationTypeLabel(type) {
    const labels = {
        [ReconciliationType.MATCH]: 'Match',
        [ReconciliationType.MISSING_IN_ABRECHNUNG]: 'Missing in Abrechnung',
        [ReconciliationType.MISSING_IN_PROTOKOLL]: 'Missing in Protokoll',
        [ReconciliationType.AMOUNT_MISMATCH]: 'Amount Mismatch',
        [ReconciliationType.DATE_MISMATCH]: 'Date Mismatch'
    };

    return labels[type] || 'Unknown';
}

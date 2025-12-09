/**
 * Tool 1 - Analytics Module
 * Calculates summary statistics and metrics for the dashboard
 */

/**
 * Calculate summary statistics from data
 * @param {Array} data - Array of row objects (headers + data)
 * @returns {Object} Statistics object
 */
export function calculateStatistics(data) {
    if (!data || data.length <= 1) {
        return createEmptyStats();
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Find amount column
    const amountIndex = findColumnIndex(headers, ['betrag', 'amount', 'summe', 'wert']);

    if (amountIndex === -1) {
        console.warn('Could not find amount column for statistics');
        return createEmptyStats();
    }

    let totalAmount = 0;
    let validCount = 0;
    const amounts = [];

    rows.forEach(row => {
        const val = row[amountIndex];
        const amount = parseAmount(val);

        if (amount !== 0 || (val !== null && val !== undefined && val !== '')) {
            totalAmount += amount;
            amounts.push(amount);
            validCount++;
        }
    });

    return {
        totalAmount: totalAmount,
        averageAmount: validCount > 0 ? totalAmount / validCount : 0,
        transactionCount: validCount,
        amounts: amounts // For sparklines/charts
    };
}

/**
 * Calculate date range from data
 * @param {Array} data - Array of row objects
 * @returns {Object} Date range object { min, max, label }
 */
export function calculateDateRange(data) {
    if (!data || data.length <= 1) {
        return { min: null, max: null, label: 'No dates' };
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Find date column
    const dateIndex = findColumnIndex(headers, ['datum', 'date', 'zeit', 'time']);

    if (dateIndex === -1) {
        return { min: null, max: null, label: 'No date column' };
    }

    let minDate = null;
    let maxDate = null;

    rows.forEach(row => {
        const val = row[dateIndex];
        const date = parseDate(val);

        if (date) {
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
        }
    });

    if (!minDate || !maxDate) {
        return { min: null, max: null, label: 'No valid dates' };
    }

    return {
        min: minDate,
        max: maxDate,
        label: formatDateRange(minDate, maxDate)
    };
}

/**
 * Prepare data for sparkline
 * @param {Array} amounts - Array of amount values
 * @param {number} points - Number of points to sample (default 20)
 * @returns {Array} Array of normalized values for sparkline
 */
export function generateTrendData(amounts, points = 20) {
    if (!amounts || amounts.length === 0) return [];

    // If fewer points than requested, return all
    if (amounts.length <= points) return amounts;

    // Simple sampling
    const step = Math.floor(amounts.length / points);
    const sampled = [];

    for (let i = 0; i < amounts.length; i += step) {
        sampled.push(amounts[i]);
    }

    // Ensure we don't exceed requested points too much
    return sampled.slice(0, points);
}


/**
 * Assess data health (completeness of key columns)
 * @param {Array} data - Array of row objects
 * @returns {Object} Health metrics { score, completeness, issues }
 */
export function assessDataHealth(data) {
    if (!data || data.length <= 1) {
        return { score: 0, completeness: 0, issues: ['No data loaded'] };
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Identify columns
    const amountIdx = findColumnIndex(headers, ['betrag', 'amount', 'summe', 'wert']);
    const dateIdx = findColumnIndex(headers, ['datum', 'date']);
    const orderIdx = findColumnIndex(headers, ['auftrag', 'order', 'nr']);

    const requiredIndices = [amountIdx, dateIdx, orderIdx].filter(i => i !== -1);

    if (requiredIndices.length === 0) {
        return { score: 0, completeness: 0, issues: ['Could not identify key columns'] };
    }

    let totalCells = rows.length * requiredIndices.length;
    let filledCells = 0;
    const missingCounts = { amount: 0, date: 0, order: 0 };

    rows.forEach(row => {
        if (amountIdx !== -1) {
            if (hasValue(row[amountIdx])) filledCells++;
            else missingCounts.amount++;
        }
        if (dateIdx !== -1) {
            if (hasValue(row[dateIdx])) filledCells++;
            else missingCounts.date++;
        }
        if (orderIdx !== -1) {
            if (hasValue(row[orderIdx])) filledCells++;
            else missingCounts.order++;
        }
    });

    const completeness = totalCells > 0 ? (filledCells / totalCells) * 100 : 0;
    const score = Math.round(completeness);

    const issues = [];
    if (missingCounts.amount > 0) issues.push(`${missingCounts.amount} missing amounts`);
    if (missingCounts.date > 0) issues.push(`${missingCounts.date} missing dates`);
    if (missingCounts.order > 0) issues.push(`${missingCounts.order} missing order numbers`);

    if (issues.length === 0 && rows.length > 0) {
        issues.push('Data looks healthy');
    }

    return { score, completeness, issues };
}

function hasValue(val) {
    return val !== undefined && val !== null && String(val).trim() !== '';
}

// --- Helpers ---

function createEmptyStats() {
    return {
        totalAmount: 0,
        averageAmount: 0,
        transactionCount: 0,
        amounts: []
    };
}

function findColumnIndex(headers, keywords) {
    if (!headers) return -1;

    return headers.findIndex(cell => {
        const str = String(cell).toLowerCase().trim();
        return keywords.some(k => str.includes(k));
    });
}

function parseAmount(value) {
    if (typeof value === 'number') return value;
    if (!value) return 0;

    if (typeof value === 'string') {
        const cleaned = value
            .replace(/[€$£\s]/g, '')
            .replace(/\./g, '') // Remove thousand separators
            .replace(',', '.'); // Convert decimal comma to dot

        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
}

function parseDate(value) {
    if (!value) return null;

    // Excel serial date (if number)
    if (typeof value === 'number') {
        // Excel base date is 1899-12-30
        const date = new Date(Math.round((value - 25569) * 86400 * 1000));
        return isNaN(date.getTime()) ? null : date;
    }

    if (typeof value === 'string') {
        // Try parsing DD.MM.YYYY
        const parts = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
        if (parts) {
            return new Date(parts[3], parts[2] - 1, parts[1]);
        }

        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
    }

    return null;
}

function formatDateRange(min, max) {
    const options = { day: '2-digit', month: '2-digit', year: '2-digit' };
    return `${min.toLocaleDateString('de-DE', options)} - ${max.toLocaleDateString('de-DE', options)}`;
}

/**
 * Export Utilities
 * Shared functions for exporting data to various formats
 */

import { showToast } from '../toast.js';

/**
 * Generate a filename with timestamp
 * @param {string} baseName - Base name for the file
 * @param {string} extension - File extension (e.g., 'xlsx', 'csv')
 * @returns {string} Formatted filename
 */
export function generateFilename(baseName, extension) {
    const dateStr = new Date().toISOString().slice(0, 10);
    return `${baseName}_${dateStr}.${extension}`;
}

/**
 * Export data to Excel (.xlsx)
 * @param {Array<Object>} data - Array of data objects
 * @param {string} baseName - Base filename
 * @param {string} sheetName - Name of the worksheet
 * @param {Function} [transformFn] - Optional function to transform data before export
 */
export function exportToExcel(data, baseName, sheetName = "Data", transformFn = null) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    if (typeof XLSX === 'undefined') {
        showToast('Excel library not loaded', 'error');
        return;
    }

    try {
        const exportData = transformFn ? data.map(transformFn) : data;

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const filename = generateFilename(baseName, 'xlsx');
        XLSX.writeFile(wb, filename);

        showToast('Excel file downloaded', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Failed to export Excel file', 'error');
    }
}

/**
 * Export data to CSV
 * @param {Array<Object>} data - Array of data objects
 * @param {string} baseName - Base filename
 * @param {Function} [transformFn] - Optional function to transform data before export
 */
export function exportToCSV(data, baseName, transformFn = null) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    try {
        const exportData = transformFn ? data.map(transformFn) : data;

        // simple CSV conversion
        if (exportData.length === 0) return;

        const headers = Object.keys(exportData[0]);
        const csvRows = [];

        // Add Header
        csvRows.push(headers.join(','));

        // Add Data
        for (const row of exportData) {
            const values = headers.map(header => {
                const escaped = ('' + row[header]).replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', generateFilename(baseName, 'csv'));
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('CSV file downloaded', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Failed to export CSV file', 'error');
    }
}

/**
 * Export data to JSON
 * @param {Array<Object>} data - Array of data objects
 * @param {string} baseName - Base filename
 */
export function exportToJSON(data, baseName) {
    if (!data || data.length === 0) {
        showToast('No data to export', 'error');
        return;
    }

    try {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', generateFilename(baseName, 'json'));
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showToast('JSON file downloaded', 'success');
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Failed to export JSON file', 'error');
    }
}

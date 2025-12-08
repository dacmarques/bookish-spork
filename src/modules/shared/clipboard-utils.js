/**
 * Clipboard Utilities
 * Shared functions for clipboard interactions
 */

import { showToast } from '../toast.js';

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
    if (!navigator.clipboard) {
        showToast('Clipboard API not supported', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        // Toast is usually handled by caller for specific messaging, 
        // but we can return true/false or throw to let caller handle ui
    } catch (err) {
        console.error('Failed to copy: ', err);
        throw err;
    }
}

/**
 * Parse clipboard data (TSV from Excel)
 * @param {string} text - Raw clipboard text
 * @returns {Array<Array<string>>} 2D array of values
 */
export function parseClipboardData(text) {
    if (!text) return [];

    // Split by new line, then by tab
    // Excel usually uses \t for columns and \n or \r\n for rows
    return text.trim().split(/\r?\n/).map(line => line.split('\t'));
}

/**
 * Trigger paste from clipboard
 * @returns {Promise<string>} Clipboard text content
 */
export async function readFromClipboard() {
    if (!navigator.clipboard) {
        showToast('Clipboard API not supported', 'error');
        return null;
    }

    try {
        const text = await navigator.clipboard.readText();
        return text;
    } catch (err) {
        console.error('Failed to read clipboard: ', err);
        showToast('Failed to read from clipboard. Check permissions.', 'error');
        return null;
    }
}

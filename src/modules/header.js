/**
 * Header Module
 * Manages global header metrics and information
 */

import { state } from './state.js';

/**
 * Update global header metrics
 */
export function updateGlobalHeader() {
    const fileCount = document.getElementById('global-file-count');
    const totalSum = document.getElementById('global-total-sum');
    
    // Count uploaded files across all tools
    let count = 0;
    if (state.tool1.protokollData) count++;
    if (state.tool1.abrechnungData) count++;
    count += state.tool2.uploadedFiles.length;
    if (state.tool3.currentFile) count++;
    
    if (fileCount) {
        fileCount.textContent = count;
    }
    
    // Calculate total sum from Tool 1
    if (totalSum && state.tool1.lastTotalMatches) {
        totalSum.textContent = state.tool1.lastTotalMatches;
    }
}

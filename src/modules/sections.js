/**
 * Collapsible Sections Module
 * Manages expandable/collapsible UI sections
 */

import { saveToStorage } from './utils.js';

/**
 * Toggle section visibility
 * @param {string} sectionId - Section identifier
 * @param {string} contentId - Content element ID
 * @param {string} iconId - Icon element ID
 */
export function toggleSection(sectionId, contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    
    if (!content) return;
    
    const isExpanded = content.classList.contains('expanded');
    const toggleButton = document.getElementById(`${sectionId}Toggle`);
    
    if (isExpanded) {
        content.classList.remove('expanded');
        if (icon) icon.classList.remove('rotated');
        if (toggleButton) toggleButton.setAttribute('aria-expanded', 'false');
    } else {
        content.classList.add('expanded');
        if (icon) icon.classList.add('rotated');
        if (toggleButton) toggleButton.setAttribute('aria-expanded', 'true');
    }
    
    // Save state
    const storageKey = `${sectionId}-expanded`;
    saveToStorage(storageKey, !isExpanded);
}

/**
 * Restore section states from localStorage
 */
export function restoreSectionStates() {
    // Restore Target Values state
    const targetValuesExpanded = localStorage.getItem('targetValues-expanded');
    const targetValuesContent = document.getElementById('targetValuesContent');
    const targetValuesIcon = document.getElementById('targetValuesIcon');
    const targetValuesToggle = document.getElementById('targetValuesToggle');
    
    if (targetValuesExpanded === 'false') {
        if (targetValuesContent) targetValuesContent.classList.remove('expanded');
        if (targetValuesIcon) targetValuesIcon.classList.remove('rotated');
        if (targetValuesToggle) targetValuesToggle.setAttribute('aria-expanded', 'false');
    } else {
        if (targetValuesContent) targetValuesContent.classList.add('expanded');
        if (targetValuesIcon) targetValuesIcon.classList.add('rotated');
        if (targetValuesToggle) targetValuesToggle.setAttribute('aria-expanded', 'true');
    }
    
    // Restore Extracted Details state
    const extractedExpanded = localStorage.getItem('extractedDetails-expanded');
    const extractedContent = document.getElementById('extractedDetailsContent');
    const extractedIcon = document.getElementById('extractedDetailsIcon');
    const extractedToggle = document.getElementById('extractedDetailsToggle');
    
    if (extractedExpanded === 'false') {
        if (extractedContent) extractedContent.classList.remove('expanded');
        if (extractedIcon) extractedIcon.classList.remove('rotated');
        if (extractedToggle) extractedToggle.setAttribute('aria-expanded', 'false');
    } else {
        if (extractedContent) extractedContent.classList.add('expanded');
        if (extractedIcon) extractedIcon.classList.add('rotated');
        if (extractedToggle) extractedToggle.setAttribute('aria-expanded', 'true');
    }
    
    // Restore Debug section state
    const debugCollapsed = localStorage.getItem('uet_debug_collapsed') === 'true';
    const debugContent = document.getElementById('debugContent');
    const debugIcon = document.getElementById('debugCollapseIcon');
    const debugToggle = document.getElementById('debugToggle');
    
    if (debugCollapsed) {
        if (debugContent) debugContent.classList.remove('expanded');
        if (debugIcon) debugIcon.classList.remove('rotated');
        if (debugToggle) debugToggle.setAttribute('aria-expanded', 'false');
    } else {
        if (debugToggle) debugToggle.setAttribute('aria-expanded', 'true');
    }
}

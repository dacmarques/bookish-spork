/**
 * Navigation Module
 * Handles tab switching and navigation state
 */

import { updateState } from './state.js';
import { updateLastActivity } from './activity.js';

/**
 * Switch between tool tabs
 * @param {string} tabName - Tab name ('tool1', 'tool2', 'tool3')
 */
export function switchTab(tabName) {
    const contents = {
        'tool1': document.getElementById('tool1-content'),
        'tool2': document.getElementById('tool2-content'),
        'tool3': document.getElementById('tool3-content')
    };
    
    const navButtons = {
        'tool1': document.getElementById('nav-tool1'),
        'tool2': document.getElementById('nav-tool2'),
        'tool3': document.getElementById('nav-tool3')
    };
    
    // Hide all content
    Object.values(contents).forEach(content => {
        if (content) content.classList.add('hidden');
    });
    
    // Remove active class from all nav buttons
    Object.values(navButtons).forEach(btn => {
        if (btn) btn.classList.remove('active');
    });
    
    // Show selected content
    if (contents[tabName]) {
        contents[tabName].classList.remove('hidden');
    }
    
    // Add active class to selected nav button
    if (navButtons[tabName]) {
        navButtons[tabName].classList.add('active');
    }
    
    // Update state
    updateState('ui.activeTab', tabName);
    updateLastActivity();
    
    // Save to localStorage
    localStorage.setItem('uet_active_tab', tabName);
}

/**
 * Restore last active tab
 */
export function restoreActiveTab() {
    const savedTab = localStorage.getItem('uet_active_tab');
    if (savedTab) {
        switchTab(savedTab);
    }
}

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
    
    // Add navigation transition effect
    document.body.classList.add('navigating');
    
    // Hide all content
    Object.values(contents).forEach(content => {
        if (content) content.classList.add('hidden');
    });
    
    // Remove active class and aria-current from all nav buttons
    Object.values(navButtons).forEach(btn => {
        if (btn) {
            btn.classList.remove('active');
            btn.removeAttribute('aria-current');
        }
    });
    
    // Show selected content
    if (contents[tabName]) {
        contents[tabName].classList.remove('hidden');
    }
    
    // Add active class and aria-current to selected nav button
    if (navButtons[tabName]) {
        navButtons[tabName].classList.add('active');
        navButtons[tabName].setAttribute('aria-current', 'page');
    }
    
    // Close mobile menu if open
    const sidebar = document.querySelector('aside.sidebar');
    if (sidebar?.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
        document.getElementById('mobileMenuToggle')?.setAttribute('aria-expanded', 'false');
        document.getElementById('mobile-nav-backdrop')?.remove();
    }
    
    // Update state
    updateState('ui.activeTab', tabName);
    updateLastActivity();
    
    // Save to localStorage
    try {
        localStorage.setItem('uet_active_tab', tabName);
    } catch (e) {
        console.error('Failed to save active tab:', e);
    }
    
    // Remove navigation transition effect after animation
    requestAnimationFrame(() => {
        document.body.classList.remove('navigating');
    });
}

/**
 * Restore last active tab
 */
export function restoreActiveTab() {
    const savedTab = localStorage.getItem('uet_active_tab') || null;
    if (savedTab) {
        switchTab(savedTab);
    }
}

/**
 * Setup mobile menu toggle functionality
 */
export function setupMobileMenu() {
    const menuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('aside.sidebar');
    
    if (!menuToggle || !sidebar) return;
    
    menuToggle.addEventListener('click', () => {
        const isOpen = sidebar.classList.toggle('mobile-open');
        menuToggle.setAttribute('aria-expanded', isOpen.toString());
        
        // Close on backdrop click
        if (isOpen) {
            const backdrop = document.createElement('div');
            backdrop.className = 'fixed inset-0 bg-black bg-opacity-50 z-40';
            backdrop.id = 'mobile-nav-backdrop';
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
                menuToggle.setAttribute('aria-expanded', 'false');
                backdrop.remove();
            });
            document.body.appendChild(backdrop);
        } else {
            document.getElementById('mobile-nav-backdrop')?.remove();
        }
    });
}

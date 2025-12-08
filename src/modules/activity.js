/**
 * Activity Tracking Module
 * Tracks and displays last user activity
 */

import { formatTime } from './utils.js';

/**
 * Update last activity timestamp
 */
export function updateLastActivity() {
    const now = new Date();
    const timeStr = formatTime(now);
    
    const activityEl = document.getElementById('last-activity');
    if (activityEl) {
        activityEl.textContent = timeStr;
    }
    
    // Save to localStorage
    localStorage.setItem('uet_last_activity', timeStr);
}

/**
 * Restore last activity from localStorage
 */
export function restoreLastActivity() {
    const savedActivity = localStorage.getItem('uet_last_activity');
    if (savedActivity) {
        const activityEl = document.getElementById('last-activity');
        if (activityEl) {
            activityEl.textContent = savedActivity;
        }
    }
}

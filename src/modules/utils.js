/**
 * Utility Functions Module
 * Reusable helper functions
 */

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Format date to locale string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

/**
 * Format time to locale string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTime(date) {
    return new Date(date).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * Format file size to human readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export function saveToStorage(key, value) {
    try {
        // Use direct localStorage for backward compatibility
        // New code should use storage.js directly
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save to localStorage:', e);
        // If quota exceeded, try to cleanup
        if (e.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded. Please clear old data.');
            window.dispatchEvent(new CustomEvent('storageQuotaExceeded'));
        }
    }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @returns {*} Parsed value or null
 */
export function loadFromStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error('Failed to load from localStorage:', e);
        return null;
    }
}

/**
 * Measure performance of a function
 * @param {string} label - Performance label
 * @param {Function} fn - Function to measure
 * @returns {*} Function result
 */
export function measurePerformance(label, fn) {
    const perfMode = localStorage.getItem('uet_performance_mode') === 'true';
    if (!perfMode) return fn();
    
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return result;
}

/**
 * Batch DOM updates using DocumentFragment
 * @param {HTMLElement} container - Container element
 * @param {Array} items - Items to render
 * @param {Function} renderFn - Render function for each item
 */
export function batchDOMUpdate(container, items, renderFn) {
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const element = renderFn(item);
        if (element) fragment.appendChild(element);
    });
    container.appendChild(fragment);
}

/**
 * Schedule update on next animation frame
 * @param {Function} callback - Function to execute
 */
export function scheduleUpdate(callback) {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);
    });
}

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validate Excel file
 * @param {File} file - File to validate
 * @returns {boolean} True if valid Excel file
 */
export function isValidExcelFile(file) {
    return file && file.name.match(/\.(xlsx|xls)$/i);
}

/**
 * Deep clone object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

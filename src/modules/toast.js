/**
 * Toast Notification System
 * Displays temporary notifications to users
 */

let toastContainer = null;
let toastQueue = [];
let isProcessing = false;

/**
 * Initialize toast container
 */
function initToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
        toastContainer.style.cssText = 'pointer-events: none;';
        document.body.appendChild(toastContainer);
    }
}

/**
 * Show toast notification
 * @param {string} message - Toast message
 * @param {string} type - Toast type: 'success', 'error', 'info', 'warning'
 * @param {number} duration - Duration in milliseconds (default: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    initToastContainer();
    
    toastQueue.push({ message, type, duration });
    
    if (!isProcessing) {
        processToastQueue();
    }
}

/**
 * Process toast queue
 */
function processToastQueue() {
    if (toastQueue.length === 0) {
        isProcessing = false;
        return;
    }
    
    isProcessing = true;
    const { message, type, duration } = toastQueue.shift();
    
    const toast = createToastElement(message, type);
    toastContainer.appendChild(toast);
    
    // Trigger enter animation
    setTimeout(() => {
        toast.classList.remove('toast-enter');
    }, 10);
    
    // Auto-dismiss
    setTimeout(() => {
        dismissToast(toast);
        setTimeout(() => processToastQueue(), 300);
    }, duration);
}

/**
 * Create toast element
 * @param {string} message - Toast message
 * @param {string} type - Toast type
 * @returns {HTMLElement} Toast element
 */
function createToastElement(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    
    const icon = getToastIcon(type);
    
    toast.innerHTML = `
        <i class="${icon}" aria-hidden="true"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" 
                class="ml-auto text-current opacity-70 hover:opacity-100 transition-opacity"
                aria-label="Close notification">
            <i class="ph ph-x text-lg"></i>
        </button>
    `;
    
    return toast;
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} Icon class
 */
function getToastIcon(type) {
    const icons = {
        success: 'ph ph-check-circle text-xl',
        error: 'ph ph-x-circle text-xl',
        warning: 'ph ph-warning text-xl',
        info: 'ph ph-info text-xl'
    };
    return icons[type] || icons.info;
}

/**
 * Dismiss toast
 * @param {HTMLElement} toast - Toast element
 */
function dismissToast(toast) {
    toast.classList.add('toast-exit');
    setTimeout(() => {
        toast.remove();
    }, 300);
}

/**
 * Show success toast
 * @param {string} message - Success message
 */
export function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * Show error toast
 * @param {string} message - Error message
 */
export function showError(message) {
    showToast(message, 'error', 4000);
}

/**
 * Show warning toast
 * @param {string} message - Warning message
 */
export function showWarning(message) {
    showToast(message, 'warning');
}

/**
 * Show info toast
 * @param {string} message - Info message
 */
export function showInfo(message) {
    showToast(message, 'info');
}

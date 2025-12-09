/**
 * Modal Management Module
 * Handles modal dialogs (settings, help, etc.)
 */

// Store last focused element to restore focus on close
let lastFocusedElement = null;

/**
 * Open settings modal
 */
export function openSettingsModal() {
    lastFocusedElement = document.activeElement;
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        // Focus first focusable element or the modal itself
        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable) {
            focusable.focus();
        } else {
            modal.setAttribute('tabindex', '-1');
            modal.focus();
        }

        // Trap focus (simple implementation)
        modal.addEventListener('keydown', handleFocusTrap);
    }
}

/**
 * Close settings modal
 */
export function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.removeEventListener('keydown', handleFocusTrap);
    }

    // Restore focus
    if (lastFocusedElement) {
        lastFocusedElement.focus();
        lastFocusedElement = null;
    }
}

/**
 * Toggle help panel
 */
export function toggleHelpPanel() {
    const helpPanel = document.getElementById('helpPanel');
    if (!helpPanel) return;

    if (helpPanel.classList.contains('hidden')) {
        // Open
        lastFocusedElement = document.activeElement;
        helpPanel.classList.remove('hidden');
        helpPanel.classList.add('flex');

        // Focus close button or panel
        const closeBtn = document.getElementById('closeHelpPanel');
        if (closeBtn) {
            closeBtn.focus();
        } else {
            helpPanel.setAttribute('tabindex', '-1');
            helpPanel.focus();
        }
    } else {
        // Close
        helpPanel.classList.add('hidden');
        helpPanel.classList.remove('flex');

        if (lastFocusedElement) {
            lastFocusedElement.focus();
            lastFocusedElement = null;
        }
    }
}

/**
 * Handle focus trap within modal
 * @param {KeyboardEvent} e 
 */
function handleFocusTrap(e) {
    if (e.key === 'Tab') {
        const modal = e.currentTarget;
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    } else if (e.key === 'Escape') {
        closeSettingsModal();
    }
}

/**
 * Modal Management Module
 * Handles modal dialogs (settings, help, etc.)
 */

/**
 * Open settings modal
 */
export function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
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
    }
}

/**
 * Toggle help panel
 */
export function toggleHelpPanel() {
    const helpPanel = document.getElementById('helpPanel');
    if (!helpPanel) return;
    
    if (helpPanel.classList.contains('hidden')) {
        helpPanel.classList.remove('hidden');
        helpPanel.classList.add('flex');
    } else {
        helpPanel.classList.add('hidden');
        helpPanel.classList.remove('flex');
    }
}

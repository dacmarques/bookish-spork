/**
 * Event Handlers Module
 * Manages all user interactions and event listeners
 */

import { state, updateState } from './state.js';
import { switchTab } from './navigation.js';
import { openSettingsModal, closeSettingsModal, toggleHelpPanel } from './modals.js';
import { toggleSection } from './sections.js';
import { processProtokolFile, processAbrechnungFile } from './tool1/fileProcessor.js';
import { renderTable } from './tool1/renderer.js';
import { setupTool2Handlers } from './tool2/handlers.js';
import { setupTool3Handlers } from './tool3/handlers.js';

/**
 * Initialize all event handlers
 */
export function initializeHandlers() {
    // Navigation handlers
    setupNavigationHandlers();

    // Modal handlers
    setupModalHandlers();

    // Tool-specific handlers
    setupTool1Handlers();
    setupTool2Handlers();
    setupTool3Handlers();

    // Global keyboard shortcuts
    setupKeyboardShortcuts();
}

/**
 * Setup navigation event handlers
 */
function setupNavigationHandlers() {
    // Tab switching
    document.getElementById('nav-tool1')?.addEventListener('click', () => switchTab('tool1'));
    document.getElementById('nav-tool2')?.addEventListener('click', () => switchTab('tool2'));
    document.getElementById('nav-tool3')?.addEventListener('click', () => switchTab('tool3'));
}

/**
 * Setup modal event handlers
 */
function setupModalHandlers() {
    // Settings modal
    document.getElementById('settingsBtn')?.addEventListener('click', openSettingsModal);
    document.getElementById('closeSettingsModal')?.addEventListener('click', closeSettingsModal);

    // Help panel
    document.getElementById('helpBtn')?.addEventListener('click', toggleHelpPanel);
    document.getElementById('closeHelpPanel')?.addEventListener('click', toggleHelpPanel);
}

/**
 * Setup Tool 1 (Value Counter) handlers
 */
function setupTool1Handlers() {
    // File upload handlers
    const protokollInput = document.getElementById('protokollFileInput');
    const abrechnungInput = document.getElementById('abrechnungFileInput');

    if (protokollInput) {
        protokollInput.addEventListener('change', (e) => {
            if (e.target.files[0]) processProtokolFile(e.target.files[0]);
        });
    }

    if (abrechnungInput) {
        abrechnungInput.addEventListener('change', (e) => {
            if (e.target.files[0]) processAbrechnungFile(e.target.files[0]);
        });
    }

    // Drag and drop handlers
    setupDragDrop('protokollDropzone', (file) => processProtokolFile(file));
    setupDragDrop('abrechnungDropzone', (file) => processAbrechnungFile(file));

    // Keyboard accessibility for dropzones
    setupAccessibleDropzone('protokollDropzone', 'protokollFileInput');
    setupAccessibleDropzone('abrechnungDropzone', 'abrechnungFileInput');

    // Target values update
    const targetValuesArea = document.getElementById('targetValues');
    if (targetValuesArea) {
        targetValuesArea.addEventListener('input', updateTargets);
    }

    // Reset button
    document.getElementById('resetTargetsBtn')?.addEventListener('click', resetDefaultTargets);

    // Section toggles
    document.getElementById('extractedDetailsToggle')?.addEventListener('click', () => {
        toggleSection('extractedDetails', 'extractedDetailsContent', 'extractedDetailsIcon');
    });


    document.getElementById('debugToggle')?.addEventListener('click', () => {
        toggleSection('debug', 'debugContent', 'debugCollapseIcon');
    });

    // Copy debug info button
    document.getElementById('copyDebugBtn')?.addEventListener('click', copyDebugInfo);

    // Sort handlers
    const sortHeaders = document.querySelectorAll('th[data-sort]');
    sortHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            const currentSort = state.tool1.sort;

            let direction = 'asc';
            // If clicking same column, toggle direction
            if (currentSort.column === column) {
                direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // Default directions for new columns
                direction = column === 'count' ? 'desc' : 'asc';
            }

            updateState('tool1.sort', { column, direction });

            // Re-render table with new sort
            const { lastCountsMap, lastTotalMatches, lastRowCount, lastUniqueTargets } = state.tool1;
            renderTable(lastCountsMap, lastTotalMatches, lastRowCount, lastUniqueTargets);
        });
    });
}

/**
 * Setup drag and drop for file upload areas
 */
function setupDragDrop(areaId, dropHandler) {
    const area = document.getElementById(areaId);
    if (!area) return;

    area.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.add('drag-over');
    });

    area.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only remove if leaving the dropzone itself, not its children
        if (e.target === area) {
            area.classList.remove('drag-over');
        }
    });

    area.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        area.classList.remove('drag-over');

        if (e.dataTransfer.files[0]) {
            dropHandler(e.dataTransfer.files[0]);
        }
    });
}

/**
 * Update target values from textarea
 */
function updateTargets() {
    const targetValuesArea = document.getElementById('targetValues');
    const targets = targetValuesArea.value
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    updateState('tool1.currentTargets', targets);
}

/**
 * Reset target values to defaults
 */
function resetDefaultTargets() {
    const DEFAULT_TARGETS = [
        'Montage', 'Demontage', 'Reparatur', 'Wartung',
        'Inbetriebnahme', 'Prüfung', 'Beratung', 'Schulung'
    ];

    const targetValuesArea = document.getElementById('targetValues');
    if (targetValuesArea) {
        targetValuesArea.value = DEFAULT_TARGETS.join('\n');
        updateTargets();
    }
}

/**
 * Setup global keyboard shortcuts
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + 1/2/3 for tab switching
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '3') {
            e.preventDefault();
            const tabMap = { '1': 'tool1', '2': 'tool2', '3': 'tool3' };
            switchTab(tabMap[e.key]);
        }

        // Ctrl/Cmd + H for help
        if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
            e.preventDefault();
            toggleHelpPanel();
        }
    });
}

/**
 * Setup keyboard accessibility for file dropzones
 */
function setupAccessibleDropzone(dropzoneId, inputId) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);

    if (!dropzone || !input) return;

    // Allow triggering via keyboard (Enter or Space)
    dropzone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            input.click();
        }
    });

    // Ensure click triggers input (redundant but safe)
    dropzone.addEventListener('click', () => {
        input.click();
    });
}

/**
 * Copy debug information to clipboard
 */
async function copyDebugInfo() {
    const debugInfo = document.getElementById('debugInfo');
    if (!debugInfo) return;

    const text = debugInfo.textContent;

    try {
        await navigator.clipboard.writeText(text);
        
        // Show success feedback
        const btn = document.getElementById('copyDebugBtn');
        const icon = btn?.querySelector('i');
        
        if (icon) {
            icon.className = 'ph ph-check';
            setTimeout(() => {
                icon.className = 'ph ph-copy';
            }, 2000);
        }
        
        // Import and show toast
        const { showSuccess } = await import('./toast.js');
        showSuccess('Debug information copied to clipboard');
    } catch (error) {
        console.error('Failed to copy debug info:', error);
        const { showError } = await import('./toast.js');
        showError('Failed to copy to clipboard');
    }
}

/**
 * Empty States & Contextual Help Module
 * Provides rich empty state displays with contextual actions
 */

/**
 * Render empty state for a container
 * @param {string} containerId - Container element ID
 * @param {Object} config - Empty state configuration
 */
export function renderEmptyState(containerId, config) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const {
        icon = 'ph-file-dashed',
        title = 'Keine Daten vorhanden',
        message = 'Laden Sie eine Datei hoch, um zu beginnen.',
        actions = [],
        hint = null
    } = config;
    
    const html = `
        <div class="empty-state">
            <i class="ph ${icon} empty-state-icon" aria-hidden="true"></i>
            <div class="empty-state-text">${title}</div>
            <div class="empty-state-subtext">${message}</div>
            ${actions.length > 0 ? renderActions(actions) : ''}
            ${hint ? `<div class="empty-state-hint">${hint}</div>` : ''}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Attach action handlers
    attachActionHandlers(container, actions);
}

/**
 * Render action buttons
 */
function renderActions(actions) {
    return `
        <div class="empty-state-actions" style="margin-top: 1.5rem; display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center;">
            ${actions.map((action, index) => `
                <button class="btn ${action.primary ? 'btn-primary' : 'btn-secondary'} empty-state-action"
                        data-action-index="${index}"
                        aria-label="${action.label}">
                    ${action.icon ? `<i class="ph ${action.icon}"></i>` : ''}
                    ${action.label}
                </button>
            `).join('')}
        </div>
    `;
}

/**
 * Attach action handlers
 */
function attachActionHandlers(container, actions) {
    const buttons = container.querySelectorAll('.empty-state-action');
    buttons.forEach(button => {
        const index = parseInt(button.getAttribute('data-action-index'));
        const action = actions[index];
        
        if (action && action.handler) {
            button.addEventListener('click', action.handler);
        }
    });
}

/**
 * Predefined empty states for common scenarios
 */
export const EmptyStates = {
    /**
     * No file uploaded
     */
    noFile: (uploadHandler) => ({
        icon: 'ph-upload-simple',
        title: 'Keine Datei hochgeladen',
        message: 'Ziehen Sie eine Excel-Datei hierher oder klicken Sie auf "Datei auswählen".',
        actions: uploadHandler ? [{
            label: 'Datei auswählen',
            icon: 'ph-file-arrow-up',
            primary: true,
            handler: uploadHandler
        }] : [],
        hint: '💡 Unterstützte Formate: .xlsx, .xls'
    }),
    
    /**
     * No data extracted
     */
    noData: () => ({
        icon: 'ph-database',
        title: 'Keine Daten gefunden',
        message: 'Die hochgeladene Datei enthält keine gültigen Daten.',
        hint: '⚠️ Stellen Sie sicher, dass die Datei die erwarteten Spalten enthält.'
    }),
    
    /**
     * No search results
     */
    noResults: (clearHandler) => ({
        icon: 'ph-magnifying-glass',
        title: 'Keine Ergebnisse gefunden',
        message: 'Ihre Suche ergab keine Treffer. Versuchen Sie andere Suchbegriffe.',
        actions: clearHandler ? [{
            label: 'Suche zurücksetzen',
            icon: 'ph-x',
            primary: false,
            handler: clearHandler
        }] : []
    }),
    
    /**
     * No reconciliation data
     */
    noReconciliation: () => ({
        icon: 'ph-arrows-left-right',
        title: 'Keine Abgleichsdaten',
        message: 'Laden Sie sowohl Protokoll- als auch Abrechnungsdateien hoch, um einen Abgleich durchzuführen.',
        hint: '📋 Beide Dateien müssen die Spalte "Auftrags-Nr." enthalten.'
    }),
    
    /**
     * Processing/Loading state
     */
    processing: () => ({
        icon: 'ph-spinner',
        title: 'Verarbeitung läuft...',
        message: 'Ihre Daten werden verarbeitet. Bitte warten Sie einen Moment.',
        hint: null
    }),
    
    /**
     * Error state
     */
    error: (retryHandler) => ({
        icon: 'ph-warning-circle',
        title: 'Fehler aufgetreten',
        message: 'Beim Verarbeiten der Daten ist ein Fehler aufgetreten.',
        actions: retryHandler ? [{
            label: 'Erneut versuchen',
            icon: 'ph-arrow-clockwise',
            primary: true,
            handler: retryHandler
        }] : [],
        hint: '💡 Überprüfen Sie das Dateiformat und versuchen Sie es erneut.'
    }),
    
    /**
     * Empty table
     */
    emptyTable: () => ({
        icon: 'ph-table',
        title: 'Tabelle ist leer',
        message: 'Fügen Sie Zeilen hinzu, um mit der Bearbeitung zu beginnen.',
        hint: null
    }),
    
    /**
     * No history
     */
    noHistory: () => ({
        icon: 'ph-clock-counter-clockwise',
        title: 'Kein Verlauf vorhanden',
        message: 'Ihre Aktionen werden hier angezeigt, sobald Sie Änderungen vornehmen.',
        hint: null
    })
};

/**
 * Show contextual help message
 * @param {string} containerId - Container element ID
 * @param {string} message - Help message
 * @param {string} type - Message type: 'info', 'tip', 'warning'
 */
export function showContextualHelp(containerId, message, type = 'info') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const icons = {
        info: 'ph-info',
        tip: 'ph-lightbulb',
        warning: 'ph-warning'
    };
    
    const colors = {
        info: 'var(--color-action)',
        tip: '#10b981',
        warning: '#f59e0b'
    };
    
    const helpDiv = document.createElement('div');
    helpDiv.className = 'contextual-help';
    helpDiv.style.cssText = `
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background-color: ${type === 'warning' ? '#fef3c7' : type === 'tip' ? '#d1fae5' : '#dbeafe'};
        border-left: 4px solid ${colors[type]};
        border-radius: 0.5rem;
        margin: 1rem 0;
        font-size: 0.875rem;
        color: var(--text-primary);
        animation: slideInRight 0.3s ease-out;
    `;
    
    helpDiv.innerHTML = `
        <i class="ph ${icons[type]}" style="font-size: 1.25rem; color: ${colors[type]};" aria-hidden="true"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(helpDiv);
    
    return helpDiv;
}

/**
 * Clear empty state and show content
 * @param {string} containerId - Container element ID
 */
export function clearEmptyState(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }
}

/**
 * Settings/Preferences Panel Module (#13)
 * Configurable user preferences with persistence
 */

import { state, updateSetting, resetSettings, saveSettings } from './state.js';
import { showToast } from './toast.js';

/**
 * Initialize settings panel
 */
export function initializeSettings() {
    // Listen for settings button click
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="open-settings"]')) {
            openSettingsPanel();
        }
        
        if (e.target.closest('[data-action="close-settings"]')) {
            closeSettingsPanel();
        }
        
        if (e.target.closest('[data-action="reset-settings"]')) {
            handleResetSettings();
        }
        
        if (e.target.closest('[data-action="save-settings"]')) {
            handleSaveSettings();
        }
    });
    
    // Listen for setting changes
    document.addEventListener('change', (e) => {
        if (e.target.matches('[data-setting]')) {
            handleSettingChange(e.target);
        }
    });
}

/**
 * Open settings panel
 */
function openSettingsPanel() {
    const existingPanel = document.getElementById('settings-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = createSettingsPanel();
    document.body.appendChild(panel);
    
    // Animate in
    requestAnimationFrame(() => {
        panel.classList.add('active');
    });
    
    // Trap focus
    trapFocus(panel);
}

/**
 * Close settings panel
 */
function closeSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    if (panel) {
        panel.classList.remove('active');
        setTimeout(() => panel.remove(), 300);
    }
}

/**
 * Create settings panel HTML
 */
function createSettingsPanel() {
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.className = 'settings-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-labelledby', 'settings-title');
    panel.setAttribute('aria-modal', 'true');
    
    panel.innerHTML = `
        <div class="settings-overlay" data-action="close-settings"></div>
        <div class="settings-content">
            <div class="settings-header">
                <h2 id="settings-title">Einstellungen</h2>
                <button 
                    class="btn-icon" 
                    data-action="close-settings"
                    aria-label="Schließen"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"/>
                    </svg>
                </button>
            </div>
            
            <div class="settings-body">
                ${renderSettingsSections()}
            </div>
            
            <div class="settings-footer">
                <button 
                    class="btn btn-secondary" 
                    data-action="reset-settings"
                >
                    Zurücksetzen
                </button>
                <div class="settings-footer-actions">
                    <button 
                        class="btn btn-secondary" 
                        data-action="close-settings"
                    >
                        Abbrechen
                    </button>
                    <button 
                        class="btn btn-primary" 
                        data-action="save-settings"
                    >
                        Speichern
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return panel;
}

/**
 * Render settings sections
 */
function renderSettingsSections() {
    return `
        <div class="settings-section">
            <h3>Darstellung</h3>
            <div class="setting-item">
                <label for="setting-theme">
                    <span class="setting-label">Theme</span>
                    <span class="setting-description">Farbschema der Anwendung</span>
                </label>
                <select 
                    id="setting-theme" 
                    data-setting="theme"
                    class="form-control"
                >
                    <option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Hell</option>
                    <option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Dunkel</option>
                    <option value="auto" ${state.settings.theme === 'auto' ? 'selected' : ''}>Automatisch</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label for="setting-show-debug">
                    <span class="setting-label">Debug-Informationen anzeigen</span>
                    <span class="setting-description">Zeigt technische Details zur Fehlersuche</span>
                </label>
                <input 
                    type="checkbox" 
                    id="setting-show-debug"
                    data-setting="showDebugInfo"
                    ${state.settings.showDebugInfo ? 'checked' : ''}
                />
            </div>
        </div>
        
        <div class="settings-section">
            <h3>Formatierung</h3>
            <div class="setting-item">
                <label for="setting-date-format">
                    <span class="setting-label">Datumsformat</span>
                    <span class="setting-description">Format für Datumsanzeige</span>
                </label>
                <select 
                    id="setting-date-format" 
                    data-setting="dateFormat"
                    class="form-control"
                >
                    <option value="DD.MM.YYYY" ${state.settings.dateFormat === 'DD.MM.YYYY' ? 'selected' : ''}>DD.MM.YYYY</option>
                    <option value="YYYY-MM-DD" ${state.settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
                    <option value="MM/DD/YYYY" ${state.settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label for="setting-currency">
                    <span class="setting-label">Währungssymbol</span>
                    <span class="setting-description">Symbol für Geldbeträge</span>
                </label>
                <input 
                    type="text" 
                    id="setting-currency"
                    data-setting="currencySymbol"
                    class="form-control"
                    value="${state.settings.currencySymbol}"
                    maxlength="3"
                />
            </div>
            
            <div class="setting-item">
                <label for="setting-decimal">
                    <span class="setting-label">Dezimaltrennzeichen</span>
                    <span class="setting-description">Zeichen für Dezimalstellen</span>
                </label>
                <select 
                    id="setting-decimal" 
                    data-setting="decimalSeparator"
                    class="form-control"
                >
                    <option value="," ${state.settings.decimalSeparator === ',' ? 'selected' : ''}>, (Komma)</option>
                    <option value="." ${state.settings.decimalSeparator === '.' ? 'selected' : ''}>. (Punkt)</option>
                </select>
            </div>
            
            <div class="setting-item">
                <label for="setting-thousands">
                    <span class="setting-label">Tausendertrennzeichen</span>
                    <span class="setting-description">Zeichen für Tausender</span>
                </label>
                <select 
                    id="setting-thousands" 
                    data-setting="thousandsSeparator"
                    class="form-control"
                >
                    <option value="." ${state.settings.thousandsSeparator === '.' ? 'selected' : ''}>. (Punkt)</option>
                    <option value="," ${state.settings.thousandsSeparator === ',' ? 'selected' : ''}>, (Komma)</option>
                    <option value=" " ${state.settings.thousandsSeparator === ' ' ? 'selected' : ''}>(Leerzeichen)</option>
                    <option value="" ${state.settings.thousandsSeparator === '' ? 'selected' : ''}>Keine</option>
                </select>
            </div>
        </div>
        
        <div class="settings-section">
            <h3>Automatisches Speichern</h3>
            <div class="setting-item">
                <label for="setting-auto-save">
                    <span class="setting-label">Automatisches Speichern aktivieren</span>
                    <span class="setting-description">Speichert Sitzung automatisch im Browser</span>
                </label>
                <input 
                    type="checkbox" 
                    id="setting-auto-save"
                    data-setting="autoSave"
                    ${state.settings.autoSave ? 'checked' : ''}
                />
            </div>
            
            <div class="setting-item">
                <label for="setting-auto-save-interval">
                    <span class="setting-label">Speicherintervall (Sekunden)</span>
                    <span class="setting-description">Wie oft automatisch gespeichert wird</span>
                </label>
                <input 
                    type="number" 
                    id="setting-auto-save-interval"
                    data-setting="autoSaveInterval"
                    class="form-control"
                    value="${state.settings.autoSaveInterval / 1000}"
                    min="10"
                    max="300"
                    step="10"
                    ${!state.settings.autoSave ? 'disabled' : ''}
                />
            </div>
        </div>
    `;
}

/**
 * Handle setting change
 */
function handleSettingChange(input) {
    const setting = input.dataset.setting;
    let value;
    
    if (input.type === 'checkbox') {
        value = input.checked;
    } else if (input.type === 'number') {
        value = parseInt(input.value) * 1000; // Convert to milliseconds
    } else {
        value = input.value;
    }
    
    // Update state (but don't save yet)
    const keys = setting.split('.');
    let current = state.settings;
    for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    // Handle dependencies
    if (setting === 'autoSave') {
        const intervalInput = document.getElementById('setting-auto-save-interval');
        if (intervalInput) {
            intervalInput.disabled = !value;
        }
    }
}

/**
 * Handle save settings
 */
function handleSaveSettings() {
    saveSettings();
    showToast('Einstellungen gespeichert', 'success');
    closeSettingsPanel();
}

/**
 * Handle reset settings
 */
function handleResetSettings() {
    if (confirm('Möchten Sie alle Einstellungen auf die Standardwerte zurücksetzen?')) {
        resetSettings();
        showToast('Einstellungen zurückgesetzt', 'info');
        closeSettingsPanel();
    }
}

/**
 * Trap focus within panel
 */
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettingsPanel();
        }
        
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    });
    
    // Focus first element
    firstElement?.focus();
}

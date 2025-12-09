/**
 * Input Validation UI Module
 * Real-time validation for form inputs with visual feedback
 */

import { showToast } from './toast.js';

/**
 * Validation rules
 */
export const ValidationRules = {
    required: (value) => value && value.trim().length > 0,
    email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    number: (value) => !isNaN(parseFloat(value)) && isFinite(value),
    minLength: (min) => (value) => value && value.length >= min,
    maxLength: (max) => (value) => value && value.length <= max,
    min: (min) => (value) => parseFloat(value) >= min,
    max: (max) => (value) => parseFloat(value) <= max,
    pattern: (regex) => (value) => regex.test(value),
    custom: (fn) => fn
};

/**
 * Initialize input validation
 * @param {string} formId - Form element ID
 * @param {Object} rules - Validation rules for each field
 */
export function initializeInputValidation(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    // Attach validation to each input
    Object.keys(rules).forEach(fieldName => {
        const input = form.querySelector(`[name="${fieldName}"]`);
        if (!input) return;
        
        const fieldRules = rules[fieldName];
        
        // Real-time validation on input
        input.addEventListener('input', () => {
            validateField(input, fieldRules);
        });
        
        // Validation on blur
        input.addEventListener('blur', () => {
            validateField(input, fieldRules, true);
        });
    });
    
    // Form submission validation
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        Object.keys(rules).forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (input) {
                const valid = validateField(input, rules[fieldName], true);
                if (!valid) isValid = false;
            }
        });
        
        if (isValid) {
            // Trigger custom submit event
            form.dispatchEvent(new CustomEvent('validSubmit', {
                detail: getFormData(form)
            }));
        } else {
            showToast('Bitte korrigieren Sie die Fehler im Formular', 'error');
        }
    });
}

/**
 * Validate a single field
 * @param {HTMLElement} input - Input element
 * @param {Object} rules - Validation rules
 * @param {boolean} showError - Whether to show error message
 * @returns {boolean} Whether field is valid
 */
export function validateField(input, rules, showError = false) {
    const value = input.value;
    let isValid = true;
    let errorMessage = '';
    
    // Check each rule
    for (const [ruleName, ruleConfig] of Object.entries(rules)) {
        if (ruleName === 'message') continue;
        
        const rule = ruleConfig.rule || ruleConfig;
        const message = ruleConfig.message || rules.message || 'Ungültiger Wert';
        
        if (typeof rule === 'function') {
            if (!rule(value)) {
                isValid = false;
                errorMessage = message;
                break;
            }
        }
    }
    
    // Update UI
    updateFieldUI(input, isValid, showError ? errorMessage : '');
    
    return isValid;
}

/**
 * Update field UI based on validation state
 */
function updateFieldUI(input, isValid, errorMessage) {
    const container = input.closest('.form-group') || input.parentElement;
    let errorDiv = container.querySelector('.input-error');
    let helperDiv = container.querySelector('.input-helper');
    
    // Set aria-invalid
    input.setAttribute('aria-invalid', !isValid);
    
    if (!isValid && errorMessage) {
        // Show error
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'input-error';
            errorDiv.setAttribute('role', 'alert');
            container.appendChild(errorDiv);
        }
        
        errorDiv.innerHTML = `
            <i class="ph ph-warning-circle" aria-hidden="true"></i>
            <span>${errorMessage}</span>
        `;
        
        // Hide helper text when showing error
        if (helperDiv) {
            helperDiv.style.display = 'none';
        }
    } else {
        // Remove error
        if (errorDiv) {
            errorDiv.remove();
        }
        
        // Show helper text again
        if (helperDiv) {
            helperDiv.style.display = 'block';
        }
        
        // Show success state if field has value
        if (isValid && input.value.trim().length > 0) {
            input.setAttribute('aria-invalid', 'false');
        } else {
            input.removeAttribute('aria-invalid');
        }
    }
}

/**
 * Get form data as object
 */
function getFormData(form) {
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    return data;
}

/**
 * Add helper text to input
 * @param {string} inputName - Input name attribute
 * @param {string} helperText - Helper text to display
 */
export function addHelperText(inputName, helperText) {
    const input = document.querySelector(`[name="${inputName}"]`);
    if (!input) return;
    
    const container = input.closest('.form-group') || input.parentElement;
    let helperDiv = container.querySelector('.input-helper');
    
    if (!helperDiv) {
        helperDiv = document.createElement('div');
        helperDiv.className = 'input-helper';
        helperDiv.setAttribute('id', `${inputName}-helper`);
        container.appendChild(helperDiv);
        
        // Link helper to input
        input.setAttribute('aria-describedby', `${inputName}-helper`);
    }
    
    helperDiv.textContent = helperText;
}

/**
 * Add character counter to input
 * @param {string} inputName - Input name attribute
 * @param {number} maxLength - Maximum length
 */
export function addCharacterCounter(inputName, maxLength) {
    const input = document.querySelector(`[name="${inputName}"]`);
    if (!input) return;
    
    const container = input.closest('.form-group') || input.parentElement;
    
    // Create counter element
    const counter = document.createElement('div');
    counter.className = 'character-counter';
    counter.style.cssText = `
        font-size: 0.75rem;
        color: var(--text-tertiary);
        text-align: right;
        margin-top: 0.25rem;
    `;
    
    const updateCounter = () => {
        const length = input.value.length;
        counter.textContent = `${length} / ${maxLength}`;
        
        if (length > maxLength) {
            counter.style.color = 'var(--color-error)';
        } else if (length > maxLength * 0.9) {
            counter.style.color = 'var(--color-warning, #f59e0b)';
        } else {
            counter.style.color = 'var(--text-tertiary)';
        }
    };
    
    container.appendChild(counter);
    updateCounter();
    
    input.addEventListener('input', updateCounter);
}

/**
 * Validate field interdependency
 * @param {string} field1Name - First field name
 * @param {string} field2Name - Second field name
 * @param {Function} validator - Validation function (value1, value2) => boolean
 * @param {string} errorMessage - Error message
 */
export function validateFieldDependency(field1Name, field2Name, validator, errorMessage) {
    const field1 = document.querySelector(`[name="${field1Name}"]`);
    const field2 = document.querySelector(`[name="${field2Name}"]`);
    
    if (!field1 || !field2) return;
    
    const validate = () => {
        const isValid = validator(field1.value, field2.value);
        
        if (!isValid) {
            updateFieldUI(field2, false, errorMessage);
        } else {
            updateFieldUI(field2, true, '');
        }
    };
    
    field1.addEventListener('input', validate);
    field2.addEventListener('input', validate);
}

/**
 * Clear all validation errors in a form
 * @param {string} formId - Form element ID
 */
export function clearValidationErrors(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    form.querySelectorAll('.input-error').forEach(error => error.remove());
    form.querySelectorAll('[aria-invalid]').forEach(input => {
        input.removeAttribute('aria-invalid');
    });
}

/**
 * Add validation status badge to input
 * Enhancement #21
 * @param {string} inputName - Input name attribute
 */
export function addValidationBadge(inputName) {
    const input = document.querySelector(`[name="${inputName}"]`);
    if (!input) return;
    
    const container = input.closest('.form-group') || input.parentElement;
    
    // Make container relative for badge positioning
    container.style.position = 'relative';
    
    // Create badge element
    const badge = document.createElement('div');
    badge.className = 'validation-badge';
    badge.style.cssText = `
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        display: none;
    `;
    badge.setAttribute('aria-hidden', 'true');
    
    container.appendChild(badge);
    
    // Update badge on input
    const updateBadge = () => {
        const value = input.value.trim();
        const isInvalid = input.getAttribute('aria-invalid') === 'true';
        
        if (!value) {
            badge.style.display = 'none';
            return;
        }
        
        badge.style.display = 'block';
        
        if (isInvalid) {
            badge.innerHTML = '<i class="ph ph-x-circle text-red-500 text-lg"></i>';
        } else {
            badge.innerHTML = '<i class="ph ph-check-circle text-green-500 text-lg"></i>';
        }
    };
    
    input.addEventListener('input', updateBadge);
    
    // Use MutationObserver to watch for aria-invalid changes
    const observer = new MutationObserver(updateBadge);
    observer.observe(input, { attributes: true, attributeFilter: ['aria-invalid'] });
}

/**
 * Add inline correction suggestion
 * Enhancement #21
 * @param {string} inputName - Input name attribute
 * @param {Function} suggestionFn - Function that returns suggestion string
 */
export function addCorrectionSuggestion(inputName, suggestionFn) {
    const input = document.querySelector(`[name="${inputName}"]`);
    if (!input) return;
    
    const container = input.closest('.form-group') || input.parentElement;
    
    // Create suggestion element
    const suggestionDiv = document.createElement('div');
    suggestionDiv.className = 'correction-suggestion';
    suggestionDiv.style.cssText = `
        font-size: 0.75rem;
        color: #6366f1;
        margin-top: 0.25rem;
        display: none;
        cursor: pointer;
    `;
    suggestionDiv.setAttribute('role', 'button');
    suggestionDiv.setAttribute('tabindex', '0');
    
    container.appendChild(suggestionDiv);
    
    // Update suggestion on input
    const updateSuggestion = () => {
        const value = input.value.trim();
        const isInvalid = input.getAttribute('aria-invalid') === 'true';
        
        if (!isInvalid || !value) {
            suggestionDiv.style.display = 'none';
            return;
        }
        
        const suggestion = suggestionFn(value);
        
        if (suggestion && suggestion !== value) {
            suggestionDiv.style.display = 'block';
            suggestionDiv.innerHTML = `
                <i class="ph ph-lightbulb mr-1"></i>
                Did you mean: <strong>${suggestion}</strong>?
            `;
            
            // Click to apply suggestion
            suggestionDiv.onclick = () => {
                input.value = suggestion;
                input.dispatchEvent(new Event('input', { bubbles: true }));
                suggestionDiv.style.display = 'none';
            };
            
            // Keyboard support
            suggestionDiv.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    suggestionDiv.click();
                }
            };
        } else {
            suggestionDiv.style.display = 'none';
        }
    };
    
    input.addEventListener('input', updateSuggestion);
    
    // Watch for validation state changes
    const observer = new MutationObserver(updateSuggestion);
    observer.observe(input, { attributes: true, attributeFilter: ['aria-invalid'] });
}

/**
 * Add real-time field comparison validation
 * Enhancement #21
 * @param {string} startFieldName - Start field name (e.g., "startValue")
 * @param {string} endFieldName - End field name (e.g., "endValue")
 * @param {string} errorMessage - Error message to display
 */
export function addComparisonValidation(startFieldName, endFieldName, errorMessage = 'End value must be greater than start value') {
    validateFieldDependency(
        startFieldName,
        endFieldName,
        (startValue, endValue) => {
            if (!startValue || !endValue) return true;
            
            const start = parseFloat(startValue);
            const end = parseFloat(endValue);
            
            if (isNaN(start) || isNaN(end)) return true;
            
            return end >= start;
        },
        errorMessage
    );
}

/**
 * Initialize enhanced validation for a field
 * Enhancement #21 - Combines all features
 * @param {string} inputName - Input name attribute
 * @param {Object} options - Configuration options
 */
export function initializeEnhancedValidation(inputName, options = {}) {
    const {
        maxLength = null,
        helperText = null,
        showBadge = true,
        correctionFn = null
    } = options;
    
    // Add character counter
    if (maxLength) {
        addCharacterCounter(inputName, maxLength);
    }
    
    // Add helper text
    if (helperText) {
        addHelperText(inputName, helperText);
    }
    
    // Add validation badge
    if (showBadge) {
        addValidationBadge(inputName);
    }
    
    // Add correction suggestion
    if (correctionFn) {
        addCorrectionSuggestion(inputName, correctionFn);
    }
}

/**
 * Common correction suggestions
 */
export const CorrectionSuggestions = {
    /**
     * Email typo correction
     */
    email: (value) => {
        const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
        const match = value.match(/^(.+)@(.+)$/);
        
        if (!match) return null;
        
        const [, localPart, domain] = match;
        
        // Check for common typos
        const typos = {
            'gmai.com': 'gmail.com',
            'gmial.com': 'gmail.com',
            'yahooo.com': 'yahoo.com',
            'outlok.com': 'outlook.com'
        };
        
        if (typos[domain]) {
            return `${localPart}@${typos[domain]}`;
        }
        
        return null;
    },
    
    /**
     * Number formatting suggestion
     */
    number: (value) => {
        // Remove non-numeric characters except decimal point
        const cleaned = value.replace(/[^\d.,]/g, '');
        if (cleaned !== value) {
            return cleaned;
        }
        return null;
    },
    
    /**
     * Trim whitespace suggestion
     */
    trim: (value) => {
        const trimmed = value.trim();
        if (trimmed !== value) {
            return trimmed;
        }
        return null;
    }
};

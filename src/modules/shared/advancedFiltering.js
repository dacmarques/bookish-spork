/**
 * Advanced Filtering System Module
 * Multi-field filtering with presets and real-time preview
 * Enhancement #14
 */

import { state, updateState } from '../state.js';
import { showToast } from '../toast.js';

/**
 * Filter state for each tool
 */
const filterState = new Map();

/**
 * Filter presets
 */
const filterPresets = {
    tool1: [
        { 
            name: 'High Count', 
            icon: 'ph-arrow-up', 
            filters: { minCount: 10 },
            description: 'Rows with count ≥ 10'
        },
        { 
            name: 'Low Count', 
            icon: 'ph-arrow-down', 
            filters: { maxCount: 5 },
            description: 'Rows with count ≤ 5'
        },
        { 
            name: 'All Active', 
            icon: 'ph-check-circle', 
            filters: { minCount: 1 },
            description: 'All non-zero counts'
        }
    ],
    tool2: [
        { 
            name: 'High Value', 
            icon: 'ph-currency-eur', 
            filters: { minValue: 1000 },
            description: 'Values ≥ 1000€'
        },
        { 
            name: 'Recent', 
            icon: 'ph-clock', 
            filters: { recent: true },
            description: 'Last 7 days'
        }
    ]
};

/**
 * Initialize advanced filtering
 * @param {string} toolKey - State key (e.g., 'tool1', 'tool2')
 * @param {string} containerId - Container element ID
 * @param {Function} renderCallback - Function to call after filtering
 * @param {Object} options - Configuration options
 */
export function initializeAdvancedFiltering(toolKey, containerId, renderCallback, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Initialize filter state
    if (!filterState.has(toolKey)) {
        filterState.set(toolKey, {
            active: {},
            matchCount: 0,
            totalCount: 0
        });
    }

    // Render filter UI
    renderFilterUI(container, toolKey, renderCallback, options);
}

/**
 * Render filter UI
 * @param {HTMLElement} container - Container element
 * @param {string} toolKey - State key
 * @param {Function} renderCallback - Render callback
 * @param {Object} options - Configuration options
 */
function renderFilterUI(container, toolKey, renderCallback, options) {
    const { fields = [], presets = true } = options;
    
    container.className = 'filter-panel bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4';
    container.setAttribute('role', 'search');
    container.setAttribute('aria-label', 'Advanced filtering options');

    let html = `
        <div class="flex items-center justify-between mb-3">
            <h4 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <i class="ph ph-funnel text-indigo-600" aria-hidden="true"></i>
                Advanced Filters
            </h4>
            <div class="flex items-center gap-2">
                <span id="filter-match-badge-${toolKey}" class="text-xs text-slate-600 font-medium px-2 py-1 bg-white rounded border border-slate-200">
                    <span id="filter-match-count-${toolKey}">0</span> matches
                </span>
                <button id="filter-clear-${toolKey}" 
                        class="text-xs text-slate-600 hover:text-slate-800 px-2 py-1 hover:bg-white rounded transition-colors"
                        aria-label="Clear all filters">
                    <i class="ph ph-x mr-1"></i>Clear
                </button>
            </div>
        </div>
    `;

    // Render filter presets
    if (presets && filterPresets[toolKey]) {
        html += `
            <div class="space-y-2">
                <label class="text-xs font-medium text-slate-600 uppercase tracking-wide">Quick Filters</label>
                <div class="flex flex-wrap gap-2" role="group" aria-label="Filter presets">
        `;

        filterPresets[toolKey].forEach((preset, index) => {
            html += `
                <button class="filter-preset-btn px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
                        data-preset-index="${index}"
                        aria-label="${preset.description}"
                        title="${preset.description}">
                    <i class="${preset.icon}" aria-hidden="true"></i>
                    ${preset.name}
                </button>
            `;
        });

        html += `
                </div>
            </div>
        `;
    }

    // Render custom filter fields
    if (fields.length > 0) {
        html += `
            <div class="space-y-3 pt-3 border-t border-slate-200">
                <label class="text-xs font-medium text-slate-600 uppercase tracking-wide">Custom Filters</label>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        `;

        fields.forEach(field => {
            html += renderFilterField(field, toolKey);
        });

        html += `
                </div>
            </div>
        `;
    }

    container.innerHTML = html;

    // Attach event listeners
    attachFilterEventListeners(container, toolKey, renderCallback);
}

/**
 * Render a single filter field
 * @param {Object} field - Field configuration
 * @param {string} toolKey - State key
 * @returns {string} HTML string
 */
function renderFilterField(field, toolKey) {
    const { key, label, type = 'text', placeholder = '', min, max, options = [] } = field;
    const currentFilters = filterState.get(toolKey).active;
    const value = currentFilters[key] || '';

    let inputHtml = '';

    switch (type) {
        case 'number':
            inputHtml = `
                <input type="number" 
                       id="filter-${key}-${toolKey}" 
                       data-filter-key="${key}"
                       class="filter-input w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       placeholder="${placeholder}"
                       ${min !== undefined ? `min="${min}"` : ''}
                       ${max !== undefined ? `max="${max}"` : ''}
                       value="${value}"
                       aria-label="${label}">
            `;
            break;

        case 'range':
            inputHtml = `
                <div class="flex items-center gap-2">
                    <input type="number" 
                           id="filter-${key}-min-${toolKey}" 
                           data-filter-key="${key}-min"
                           class="filter-input w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="Min"
                           value="${currentFilters[key + '-min'] || ''}"
                           aria-label="${label} minimum">
                    <span class="text-slate-400">–</span>
                    <input type="number" 
                           id="filter-${key}-max-${toolKey}" 
                           data-filter-key="${key}-max"
                           class="filter-input w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                           placeholder="Max"
                           value="${currentFilters[key + '-max'] || ''}"
                           aria-label="${label} maximum">
                </div>
            `;
            break;

        case 'select':
            inputHtml = `
                <select id="filter-${key}-${toolKey}" 
                        data-filter-key="${key}"
                        class="filter-input w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        aria-label="${label}">
                    <option value="">All</option>
                    ${options.map(opt => `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
                </select>
            `;
            break;

        case 'text':
        default:
            inputHtml = `
                <input type="text" 
                       id="filter-${key}-${toolKey}" 
                       data-filter-key="${key}"
                       class="filter-input w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       placeholder="${placeholder}"
                       value="${value}"
                       aria-label="${label}">
            `;
    }

    return `
        <div class="filter-field">
            <label class="block text-xs font-medium text-slate-700 mb-1">${label}</label>
            ${inputHtml}
        </div>
    `;
}

/**
 * Attach event listeners to filter UI
 * @param {HTMLElement} container - Container element
 * @param {string} toolKey - State key
 * @param {Function} renderCallback - Render callback
 */
function attachFilterEventListeners(container, toolKey, renderCallback) {
    // Preset buttons
    const presetButtons = container.querySelectorAll('.filter-preset-btn');
    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const index = parseInt(btn.getAttribute('data-preset-index'));
            applyPreset(toolKey, index, renderCallback);
            
            // Visual feedback
            btn.classList.add('bg-indigo-100', 'border-indigo-400');
            setTimeout(() => {
                btn.classList.remove('bg-indigo-100', 'border-indigo-400');
            }, 300);
        });
    });

    // Filter inputs
    const filterInputs = container.querySelectorAll('.filter-input');
    filterInputs.forEach(input => {
        input.addEventListener('input', debounce(() => {
            updateFilter(toolKey, renderCallback);
        }, 300));
    });

    // Clear button
    const clearBtn = container.querySelector(`#filter-clear-${toolKey}`);
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            clearFilters(toolKey, renderCallback);
            
            // Clear all inputs
            filterInputs.forEach(input => {
                input.value = '';
            });
        });
    }
}

/**
 * Apply filter preset
 * @param {string} toolKey - State key
 * @param {number} presetIndex - Preset index
 * @param {Function} renderCallback - Render callback
 */
function applyPreset(toolKey, presetIndex, renderCallback) {
    const preset = filterPresets[toolKey][presetIndex];
    if (!preset) return;

    const currentState = filterState.get(toolKey);
    currentState.active = { ...preset.filters };

    updateFilter(toolKey, renderCallback);
    showToast(`Applied filter: ${preset.name}`, 'success');
}

/**
 * Update filter
 * @param {string} toolKey - State key
 * @param {Function} renderCallback - Render callback
 */
function updateFilter(toolKey, renderCallback) {
    const container = document.querySelector(`[role="search"]`);
    if (!container) return;

    const inputs = container.querySelectorAll('.filter-input');
    const currentState = filterState.get(toolKey);
    const newFilters = {};

    inputs.forEach(input => {
        const key = input.getAttribute('data-filter-key');
        const value = input.value.trim();
        
        if (value) {
            newFilters[key] = input.type === 'number' ? parseFloat(value) : value;
        }
    });

    currentState.active = newFilters;

    // Update state if available
    if (state[toolKey] && state[toolKey].filter !== undefined) {
        updateState(`${toolKey}.filter`, newFilters);
    }

    // Call render callback
    if (renderCallback && typeof renderCallback === 'function') {
        renderCallback();
    }

    // Update match count
    updateMatchCount(toolKey);
}

/**
 * Clear all filters
 * @param {string} toolKey - State key
 * @param {Function} renderCallback - Render callback
 */
export function clearFilters(toolKey, renderCallback) {
    const currentState = filterState.get(toolKey);
    if (currentState) {
        currentState.active = {};
    }

    // Update state
    if (state[toolKey] && state[toolKey].filter !== undefined) {
        updateState(`${toolKey}.filter`, {});
    }

    // Call render callback
    if (renderCallback && typeof renderCallback === 'function') {
        renderCallback();
    }

    // Update match count
    updateMatchCount(toolKey);
    
    showToast('Filters cleared', 'success');
}

/**
 * Filter data array
 * @param {Array} data - Data array
 * @param {string} toolKey - State key
 * @param {Object} fieldConfig - Field configuration for data access
 * @returns {Array} Filtered data
 */
export function filterData(data, toolKey, fieldConfig = {}) {
    const currentState = filterState.get(toolKey);
    if (!currentState || Object.keys(currentState.active).length === 0) {
        return data;
    }

    const filters = currentState.active;
    
    return data.filter(item => {
        for (const [key, value] of Object.entries(filters)) {
            // Handle range filters
            if (key.endsWith('-min')) {
                const field = key.replace('-min', '');
                const itemValue = getFieldValue(item, field, fieldConfig);
                if (itemValue < value) return false;
                continue;
            }
            
            if (key.endsWith('-max')) {
                const field = key.replace('-max', '');
                const itemValue = getFieldValue(item, field, fieldConfig);
                if (itemValue > value) return false;
                continue;
            }

            // Handle special filters
            if (key === 'minCount') {
                const count = getFieldValue(item, 'count', fieldConfig);
                if (count < value) return false;
                continue;
            }

            if (key === 'maxCount') {
                const count = getFieldValue(item, 'count', fieldConfig);
                if (count > value) return false;
                continue;
            }

            if (key === 'minValue') {
                const itemValue = getFieldValue(item, 'value', fieldConfig);
                if (itemValue < value) return false;
                continue;
            }

            // Handle text search
            const itemValue = getFieldValue(item, key, fieldConfig);
            if (typeof value === 'string') {
                const searchValue = value.toLowerCase();
                const itemStr = String(itemValue).toLowerCase();
                if (!itemStr.includes(searchValue)) return false;
            } else if (itemValue !== value) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Get field value from item
 * @param {Object} item - Data item
 * @param {string} field - Field key
 * @param {Object} fieldConfig - Field configuration
 * @returns {*} Field value
 */
function getFieldValue(item, field, fieldConfig) {
    if (fieldConfig[field] && typeof fieldConfig[field] === 'function') {
        return fieldConfig[field](item);
    }
    return item[field];
}

/**
 * Update match count display
 * @param {string} toolKey - State key
 */
function updateMatchCount(toolKey) {
    const matchCountEl = document.getElementById(`filter-match-count-${toolKey}`);
    const currentState = filterState.get(toolKey);
    
    if (matchCountEl && currentState) {
        matchCountEl.textContent = currentState.matchCount;
    }
}

/**
 * Set match count
 * @param {string} toolKey - State key
 * @param {number} matchCount - Number of matches
 * @param {number} totalCount - Total number of items
 */
export function setMatchCount(toolKey, matchCount, totalCount) {
    const currentState = filterState.get(toolKey);
    if (currentState) {
        currentState.matchCount = matchCount;
        currentState.totalCount = totalCount;
        updateMatchCount(toolKey);
    }
}

/**
 * Get active filters
 * @param {string} toolKey - State key
 * @returns {Object} Active filters
 */
export function getActiveFilters(toolKey) {
    const currentState = filterState.get(toolKey);
    return currentState ? { ...currentState.active } : {};
}

/**
 * Check if filters are active
 * @param {string} toolKey - State key
 * @returns {boolean} Whether filters are active
 */
export function hasActiveFilters(toolKey) {
    const filters = getActiveFilters(toolKey);
    return Object.keys(filters).length > 0;
}

/**
 * Debounce helper
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

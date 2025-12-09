/**
 * General-Purpose Tooltip Component
 * Provides contextual help tooltips for any element
 */

let activeTooltip = null;

/**
 * Initialize tooltip system
 * Automatically attaches tooltips to elements with data-tooltip attribute
 */
export function initializeTooltips() {
    // Attach to existing elements
    attachTooltipsToElements();
    
    // Watch for dynamically added elements
    const observer = new MutationObserver(() => {
        attachTooltipsToElements();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

/**
 * Attach tooltips to elements with data-tooltip attribute
 */
function attachTooltipsToElements() {
    const elements = document.querySelectorAll('[data-tooltip]:not([data-tooltip-initialized])');
    
    elements.forEach(element => {
        element.setAttribute('data-tooltip-initialized', 'true');
        
        // Mouse events
        element.addEventListener('mouseenter', handleMouseEnter);
        element.addEventListener('mouseleave', handleMouseLeave);
        
        // Keyboard accessibility
        if (element.tabIndex >= 0 || element.tagName === 'BUTTON' || element.tagName === 'A') {
            element.addEventListener('focus', handleFocus);
            element.addEventListener('blur', handleBlur);
        }
    });
}

/**
 * Handle mouse enter
 */
function handleMouseEnter(e) {
    const element = e.currentTarget;
    const message = element.getAttribute('data-tooltip');
    const position = element.getAttribute('data-tooltip-position') || 'top';
    
    if (message) {
        showTooltip(element, message, position);
    }
}

/**
 * Handle mouse leave
 */
function handleMouseLeave() {
    hideTooltip();
}

/**
 * Handle focus (keyboard navigation)
 */
function handleFocus(e) {
    const element = e.currentTarget;
    const message = element.getAttribute('data-tooltip');
    const position = element.getAttribute('data-tooltip-position') || 'top';
    
    if (message) {
        showTooltip(element, message, position);
    }
}

/**
 * Handle blur
 */
function handleBlur() {
    hideTooltip();
}

/**
 * Show tooltip
 * @param {HTMLElement} element - Target element
 * @param {string} message - Tooltip message
 * @param {string} position - Position: 'top', 'bottom', 'left', 'right'
 */
export function showTooltip(element, message, position = 'top') {
    // Remove existing tooltip
    hideTooltip();
    
    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.setAttribute('role', 'tooltip');
    tooltip.setAttribute('aria-hidden', 'false');
    tooltip.textContent = message;
    
    document.body.appendChild(tooltip);
    
    // Position tooltip
    positionTooltip(tooltip, element, position);
    
    // Show with animation
    requestAnimationFrame(() => {
        tooltip.classList.add('tooltip-visible');
    });
    
    activeTooltip = tooltip;
}

/**
 * Position tooltip relative to element
 */
function positionTooltip(tooltip, element, position) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const spacing = 8;
    
    let top, left;
    
    switch (position) {
        case 'top':
            top = rect.top - tooltipRect.height - spacing;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            tooltip.classList.add('tooltip-top');
            break;
            
        case 'bottom':
            top = rect.bottom + spacing;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            tooltip.classList.add('tooltip-bottom');
            break;
            
        case 'left':
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.left - tooltipRect.width - spacing;
            tooltip.classList.add('tooltip-left');
            break;
            
        case 'right':
            top = rect.top + (rect.height / 2) - (tooltipRect.height / 2);
            left = rect.right + spacing;
            tooltip.classList.add('tooltip-right');
            break;
            
        default:
            top = rect.top - tooltipRect.height - spacing;
            left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
            tooltip.classList.add('tooltip-top');
    }
    
    // Adjust if tooltip goes off screen
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (left < spacing) {
        left = spacing;
    } else if (left + tooltipRect.width > viewportWidth - spacing) {
        left = viewportWidth - tooltipRect.width - spacing;
    }
    
    if (top < spacing) {
        // Flip to bottom if not enough space on top
        top = rect.bottom + spacing;
        tooltip.classList.remove('tooltip-top');
        tooltip.classList.add('tooltip-bottom');
    } else if (top + tooltipRect.height > viewportHeight - spacing) {
        // Flip to top if not enough space on bottom
        top = rect.top - tooltipRect.height - spacing;
        tooltip.classList.remove('tooltip-bottom');
        tooltip.classList.add('tooltip-top');
    }
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
}

/**
 * Hide tooltip
 */
export function hideTooltip() {
    if (activeTooltip) {
        activeTooltip.classList.remove('tooltip-visible');
        setTimeout(() => {
            if (activeTooltip && activeTooltip.parentNode) {
                activeTooltip.remove();
            }
            activeTooltip = null;
        }, 200);
    }
}

/**
 * Create info icon with tooltip
 * @param {string} message - Tooltip message
 * @returns {string} HTML string for info icon
 */
export function createInfoIcon(message) {
    return `<i class="ph ph-info tooltip-trigger" 
               data-tooltip="${message}" 
               data-tooltip-position="top"
               tabindex="0"
               role="button"
               aria-label="More information"></i>`;
}

/**
 * Internal Tabs Module
 * Manages tab-based navigation within tool views
 */

/**
 * Initialize internal tab navigation
 */
export function initializeInternalTabs() {
    const tabButtons = document.querySelectorAll('.internal-tab');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            handleTabSwitch(button);
        });
        
        // Keyboard navigation
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleTabSwitch(button);
            }
        });
    });
}

/**
 * Handle tab switching
 * @param {HTMLElement} clickedTab - The tab button that was clicked
 */
function handleTabSwitch(clickedTab) {
    const tabName = clickedTab.dataset.tab;
    const container = clickedTab.closest('section');
    
    // Update tab states
    const allTabs = container.querySelectorAll('.internal-tab');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    
    clickedTab.classList.add('active');
    clickedTab.setAttribute('aria-selected', 'true');
    
    // Show/hide corresponding sections
    scrollToSection(tabName, container);
}

/**
 * Scroll to the corresponding section smoothly
 * @param {string} tabName - The name of the tab (import, analysis, debug)
 * @param {HTMLElement} container - The container element
 */
function scrollToSection(tabName, container) {
    let targetSection;
    
    switch(tabName) {
        case 'import':
            targetSection = container.querySelector('.section-group-upload');
            break;
        case 'analysis':
            targetSection = container.querySelector('.section-group-data');
            break;
        case 'debug':
            targetSection = container.querySelector('.section-card[aria-labelledby="debug-heading"]');
            break;
    }
    
    if (targetSection) {
        targetSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
        
        // Add a subtle highlight animation
        targetSection.style.animation = 'highlight-section 0.6s ease';
        setTimeout(() => {
            targetSection.style.animation = '';
        }, 600);
    }
}

/**
 * Update active tab based on scroll position (optional)
 */
export function updateActiveTabOnScroll() {
    // This can be implemented to automatically switch active tab
    // as user scrolls to different sections
    // Left as future enhancement
}

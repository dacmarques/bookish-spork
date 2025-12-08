/**
 * Scroll Indicators Module
 * Manages scroll indicators for horizontally scrollable tables
 */

import { throttle } from './utils.js';

/**
 * Initialize scroll indicators for table containers
 */
export function initializeScrollIndicators() {
    const tableContainers = document.querySelectorAll('.table-container, .overflow-auto, .overflow-x-auto');
    
    tableContainers.forEach(container => {
        const updateScrollIndicators = throttle(() => {
            const scrollLeft = container.scrollLeft;
            const scrollWidth = container.scrollWidth;
            const clientWidth = container.clientWidth;
            
            // Check if scrolled from left edge
            if (scrollLeft > 10) {
                container.classList.add('scroll-left');
            } else {
                container.classList.remove('scroll-left');
            }
            
            // Check if scrolled from right edge
            if (scrollLeft + clientWidth < scrollWidth - 10) {
                container.classList.add('scroll-right');
            } else {
                container.classList.remove('scroll-right');
            }
        }, 100);
        
        container.addEventListener('scroll', updateScrollIndicators);
        
        // Initial check
        updateScrollIndicators();
        
        // Re-check on window resize
        window.addEventListener('resize', updateScrollIndicators);
    });
}

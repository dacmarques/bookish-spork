/**
 * Virtual Scrolling Module
 * Implements efficient rendering for large datasets by only rendering visible rows
 */

/**
 * Virtual scroll configuration and state
 */
class VirtualScroller {
    constructor(config) {
        this.container = config.container;
        this.data = config.data || [];
        this.rowHeight = config.rowHeight || 60;
        this.renderRow = config.renderRow;
        this.overscan = config.overscan || 5; // Extra rows to render above/below viewport
        
        this.scrollTop = 0;
        this.viewportHeight = 0;
        this.totalHeight = 0;
        
        this.init();
    }

    init() {
        if (!this.container) return;
        
        this.viewportHeight = this.container.clientHeight;
        this.totalHeight = this.data.length * this.rowHeight;
        
        // Create scroll container structure
        this.wrapper = document.createElement('div');
        this.wrapper.style.height = `${this.totalHeight}px`;
        this.wrapper.style.position = 'relative';
        
        this.content = document.createElement('div');
        this.content.style.position = 'absolute';
        this.content.style.top = '0';
        this.content.style.left = '0';
        this.content.style.right = '0';
        
        this.wrapper.appendChild(this.content);
        this.container.appendChild(this.wrapper);
        
        // Bind scroll handler
        this.container.addEventListener('scroll', () => this.handleScroll());
        
        // Initial render
        this.render();
    }

    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.render();
    }

    render() {
        const startIndex = Math.max(0, Math.floor(this.scrollTop / this.rowHeight) - this.overscan);
        const endIndex = Math.min(
            this.data.length,
            Math.ceil((this.scrollTop + this.viewportHeight) / this.rowHeight) + this.overscan
        );
        
        const visibleData = this.data.slice(startIndex, endIndex);
        const offsetY = startIndex * this.rowHeight;
        
        // Clear and render visible rows
        this.content.innerHTML = '';
        this.content.style.transform = `translateY(${offsetY}px)`;
        
        visibleData.forEach((item, index) => {
            const actualIndex = startIndex + index;
            const row = this.renderRow(item, actualIndex);
            if (row) this.content.appendChild(row);
        });
    }

    updateData(newData) {
        this.data = newData;
        this.totalHeight = this.data.length * this.rowHeight;
        this.wrapper.style.height = `${this.totalHeight}px`;
        this.render();
    }

    destroy() {
        if (this.container && this.wrapper) {
            this.container.removeChild(this.wrapper);
        }
    }
}

/**
 * Create virtual scroller for table
 * @param {Object} config - Configuration object
 * @param {HTMLElement} config.container - Scroll container element
 * @param {Array} config.data - Data array to render
 * @param {number} config.rowHeight - Height of each row in pixels
 * @param {Function} config.renderRow - Function to render a single row
 * @param {number} config.overscan - Number of extra rows to render (default: 5)
 * @returns {VirtualScroller} Virtual scroller instance
 */
export function createVirtualScroller(config) {
    return new VirtualScroller(config);
}

/**
 * Check if virtual scrolling should be enabled based on data size
 * @param {number} dataLength - Number of items in dataset
 * @param {number} threshold - Threshold to enable virtual scrolling (default: 100)
 * @returns {boolean} True if virtual scrolling should be enabled
 */
export function shouldUseVirtualScroll(dataLength, threshold = 100) {
    return dataLength > threshold;
}

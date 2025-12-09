/**
 * Search Highlighting Module
 * Highlights matching text, auto-scrolls to matches, and provides keyboard navigation
 * Enhancement #28
 */

/**
 * Search highlight state
 */
class SearchHighlighter {
    constructor() {
        this.currentIndex = 0;
        this.matches = [];
        this.searchTerm = '';
        this.containerElement = null;
        this.highlightClass = 'search-highlight';
        this.activeHighlightClass = 'search-highlight-active';
    }

    /**
     * Initialize search highlighting for a container
     * @param {string|HTMLElement} container - Container element or ID
     * @param {Object} options - Configuration options
     */
    initialize(container, options = {}) {
        if (typeof container === 'string') {
            this.containerElement = document.getElementById(container);
        } else {
            this.containerElement = container;
        }

        if (!this.containerElement) {
            console.error('Search highlighter: Container not found');
            return;
        }

        // Apply options
        this.highlightClass = options.highlightClass || 'search-highlight';
        this.activeHighlightClass = options.activeHighlightClass || 'search-highlight-active';
        
        // Add keyboard navigation
        if (options.enableKeyboardNav !== false) {
            this.addKeyboardNavigation();
        }

        // Ensure highlight styles exist
        this.ensureStyles();
    }

    /**
     * Ensure highlight styles are defined
     */
    ensureStyles() {
        if (document.getElementById('search-highlight-styles')) return;

        const style = document.createElement('style');
        style.id = 'search-highlight-styles';
        style.textContent = `
            .${this.highlightClass} {
                background-color: #fef08a;
                padding: 2px 0;
                border-radius: 2px;
                transition: background-color 0.2s ease;
            }
            
            .${this.activeHighlightClass} {
                background-color: #fbbf24;
                box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.3);
                font-weight: 500;
            }
            
            @media (prefers-color-scheme: dark) {
                .${this.highlightClass} {
                    background-color: #854d0e;
                    color: #fef08a;
                }
                
                .${this.activeHighlightClass} {
                    background-color: #a16207;
                    color: #fef3c7;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Highlight search term in container
     * @param {string} searchTerm - Term to search for
     * @returns {number} Number of matches found
     */
    highlight(searchTerm) {
        // Clear previous highlights
        this.clearHighlights();

        if (!searchTerm || searchTerm.trim().length === 0) {
            return 0;
        }

        this.searchTerm = searchTerm.trim();
        this.matches = [];
        this.currentIndex = 0;

        // Get all text nodes in container
        const textNodes = this.getTextNodes(this.containerElement);

        // Highlight matching text
        textNodes.forEach(node => {
            this.highlightInNode(node, this.searchTerm);
        });

        // Collect all highlight elements
        this.matches = Array.from(
            this.containerElement.querySelectorAll(`.${this.highlightClass}`)
        );

        // Highlight first match as active
        if (this.matches.length > 0) {
            this.setActiveMatch(0);
            this.scrollToMatch(0);
        }

        return this.matches.length;
    }

    /**
     * Get all text nodes in an element
     * @param {HTMLElement} element - Root element
     * @returns {Array} Array of text nodes
     */
    getTextNodes(element) {
        const textNodes = [];
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: (node) => {
                    // Skip script, style, and already highlighted nodes
                    const parent = node.parentElement;
                    if (!parent) return NodeFilter.FILTER_REJECT;
                    
                    const tagName = parent.tagName.toLowerCase();
                    if (['script', 'style', 'noscript'].includes(tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    if (parent.classList.contains(this.highlightClass)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    // Skip empty text nodes
                    if (node.textContent.trim().length === 0) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node);
        }

        return textNodes;
    }

    /**
     * Highlight search term in a text node
     * @param {Node} node - Text node
     * @param {string} searchTerm - Search term
     */
    highlightInNode(node, searchTerm) {
        const text = node.textContent;
        const regex = new RegExp(this.escapeRegExp(searchTerm), 'gi');
        const matches = text.matchAll(regex);
        const matchesArray = Array.from(matches);

        if (matchesArray.length === 0) return;

        // Create document fragment with highlighted text
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        matchesArray.forEach(match => {
            const matchText = match[0];
            const matchIndex = match.index;

            // Add text before match
            if (matchIndex > lastIndex) {
                fragment.appendChild(
                    document.createTextNode(text.slice(lastIndex, matchIndex))
                );
            }

            // Add highlighted match
            const highlight = document.createElement('mark');
            highlight.className = this.highlightClass;
            highlight.textContent = matchText;
            fragment.appendChild(highlight);

            lastIndex = matchIndex + matchText.length;
        });

        // Add remaining text
        if (lastIndex < text.length) {
            fragment.appendChild(
                document.createTextNode(text.slice(lastIndex))
            );
        }

        // Replace original text node with highlighted version
        node.parentNode.replaceChild(fragment, node);
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        if (!this.containerElement) return;

        const highlights = this.containerElement.querySelectorAll(`.${this.highlightClass}`);
        
        highlights.forEach(highlight => {
            const text = highlight.textContent;
            const textNode = document.createTextNode(text);
            highlight.parentNode.replaceChild(textNode, highlight);
        });

        // Normalize text nodes (merge adjacent text nodes)
        this.containerElement.normalize();

        this.matches = [];
        this.currentIndex = 0;
        this.searchTerm = '';
    }

    /**
     * Set active match
     * @param {number} index - Match index
     */
    setActiveMatch(index) {
        if (index < 0 || index >= this.matches.length) return;

        // Remove active class from all matches
        this.matches.forEach(match => {
            match.classList.remove(this.activeHighlightClass);
        });

        // Add active class to current match
        this.matches[index].classList.add(this.activeHighlightClass);
        this.currentIndex = index;
    }

    /**
     * Scroll to match
     * @param {number} index - Match index
     * @param {Object} options - Scroll options
     */
    scrollToMatch(index, options = {}) {
        if (index < 0 || index >= this.matches.length) return;

        const match = this.matches[index];
        const { behavior = 'smooth', block = 'center' } = options;

        match.scrollIntoView({
            behavior,
            block,
            inline: 'nearest'
        });

        // Set active
        this.setActiveMatch(index);
    }

    /**
     * Go to next match
     */
    nextMatch() {
        if (this.matches.length === 0) return;

        const nextIndex = (this.currentIndex + 1) % this.matches.length;
        this.scrollToMatch(nextIndex);
    }

    /**
     * Go to previous match
     */
    previousMatch() {
        if (this.matches.length === 0) return;

        const prevIndex = this.currentIndex === 0 
            ? this.matches.length - 1 
            : this.currentIndex - 1;
        this.scrollToMatch(prevIndex);
    }

    /**
     * Get match count
     * @returns {number} Number of matches
     */
    getMatchCount() {
        return this.matches.length;
    }

    /**
     * Get current match index (1-based)
     * @returns {number} Current match number
     */
    getCurrentMatchNumber() {
        return this.matches.length > 0 ? this.currentIndex + 1 : 0;
    }

    /**
     * Add keyboard navigation
     */
    addKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Only handle if there are matches
            if (this.matches.length === 0) return;

            // Enter - next match
            if (e.key === 'Enter' && !e.shiftKey) {
                const activeElement = document.activeElement;
                
                // Only if focused on search input
                if (activeElement && activeElement.type === 'search') {
                    e.preventDefault();
                    this.nextMatch();
                }
            }

            // Shift+Enter - previous match
            if (e.key === 'Enter' && e.shiftKey) {
                const activeElement = document.activeElement;
                
                if (activeElement && activeElement.type === 'search') {
                    e.preventDefault();
                    this.previousMatch();
                }
            }

            // F3 - next match (standard browser shortcut)
            if (e.key === 'F3' && !e.shiftKey) {
                e.preventDefault();
                this.nextMatch();
            }

            // Shift+F3 - previous match
            if (e.key === 'F3' && e.shiftKey) {
                e.preventDefault();
                this.previousMatch();
            }
        });
    }

    /**
     * Escape special regex characters
     * @param {string} string - String to escape
     * @returns {string} Escaped string
     */
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

// Singleton instance
export const searchHighlighter = new SearchHighlighter();

/**
 * Create search UI with match counter
 * @param {string} containerId - Container ID for search UI
 * @param {string} targetContainerId - Container ID to search within
 * @returns {Object} UI elements
 */
export function createSearchUI(containerId, targetContainerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    container.className = 'search-ui-container flex items-center gap-2 p-2 bg-white border border-slate-300 rounded-lg';
    container.innerHTML = `
        <div class="flex-1 relative">
            <input type="search" 
                   id="searchInput-${containerId}"
                   class="w-full px-3 py-2 pr-8 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                   placeholder="Search..."
                   aria-label="Search within results">
            <i class="ph ph-magnifying-glass absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none"></i>
        </div>
        <div id="searchMatchCounter-${containerId}" class="text-xs text-slate-600 font-medium whitespace-nowrap hidden">
            <span id="searchCurrentMatch-${containerId}">0</span> / <span id="searchTotalMatches-${containerId}">0</span>
        </div>
        <button id="searchPrevBtn-${containerId}" 
                class="btn-icon-sm" 
                title="Previous match (Shift+Enter)"
                aria-label="Go to previous match"
                disabled>
            <i class="ph ph-caret-up"></i>
        </button>
        <button id="searchNextBtn-${containerId}" 
                class="btn-icon-sm" 
                title="Next match (Enter)"
                aria-label="Go to next match"
                disabled>
            <i class="ph ph-caret-down"></i>
        </button>
        <button id="searchClearBtn-${containerId}" 
                class="btn-icon-sm hidden" 
                title="Clear search"
                aria-label="Clear search">
            <i class="ph ph-x"></i>
        </button>
    `;

    // Get UI elements
    const searchInput = document.getElementById(`searchInput-${containerId}`);
    const matchCounter = document.getElementById(`searchMatchCounter-${containerId}`);
    const currentMatchEl = document.getElementById(`searchCurrentMatch-${containerId}`);
    const totalMatchesEl = document.getElementById(`searchTotalMatches-${containerId}`);
    const prevBtn = document.getElementById(`searchPrevBtn-${containerId}`);
    const nextBtn = document.getElementById(`searchNextBtn-${containerId}`);
    const clearBtn = document.getElementById(`searchClearBtn-${containerId}`);

    // Initialize highlighter
    searchHighlighter.initialize(targetContainerId);

    // Update match counter
    const updateCounter = () => {
        const total = searchHighlighter.getMatchCount();
        const current = searchHighlighter.getCurrentMatchNumber();

        if (total > 0) {
            matchCounter.classList.remove('hidden');
            currentMatchEl.textContent = current;
            totalMatchesEl.textContent = total;
            prevBtn.disabled = false;
            nextBtn.disabled = false;
        } else {
            matchCounter.classList.add('hidden');
            prevBtn.disabled = true;
            nextBtn.disabled = true;
        }
    };

    // Search on input
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = searchInput.value;
            
            if (searchTerm) {
                searchHighlighter.highlight(searchTerm);
                clearBtn.classList.remove('hidden');
            } else {
                searchHighlighter.clearHighlights();
                clearBtn.classList.add('hidden');
            }
            
            updateCounter();
        }, 300);
    });

    // Navigation buttons
    prevBtn.addEventListener('click', () => {
        searchHighlighter.previousMatch();
        updateCounter();
    });

    nextBtn.addEventListener('click', () => {
        searchHighlighter.nextMatch();
        updateCounter();
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchHighlighter.clearHighlights();
        clearBtn.classList.add('hidden');
        updateCounter();
        searchInput.focus();
    });

    return {
        searchInput,
        matchCounter,
        prevBtn,
        nextBtn,
        clearBtn
    };
}

/**
 * Initialize simple search highlighting
 * @param {string} searchInputId - Search input element ID
 * @param {string} targetContainerId - Container ID to search within
 * @param {Function} onSearch - Optional callback when search is performed
 */
export function initializeSearchHighlighting(searchInputId, targetContainerId, onSearch = null) {
    const searchInput = document.getElementById(searchInputId);
    if (!searchInput) return;

    searchHighlighter.initialize(targetContainerId);

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const searchTerm = searchInput.value;
            const matchCount = searchHighlighter.highlight(searchTerm);
            
            if (onSearch && typeof onSearch === 'function') {
                onSearch(searchTerm, matchCount);
            }
        }, 300);
    });
}

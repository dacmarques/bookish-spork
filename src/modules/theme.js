/**
 * Theme Management Module
 * Handles dark mode and theme switching
 */

/**
 * Initialize dark mode from localStorage or system preference
 */
export function initializeDarkMode() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;

    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
    } else {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    // Initialize toggle button
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleDarkMode);
    }

    // Update toggle button state
    updateThemeToggle();
}

/**
 * Toggle dark mode
 */
export function toggleDarkMode() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeToggle();
}

/**
 * Update theme toggle button icon
 */
function updateThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;

    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');

    const icon = themeToggle.querySelector('i');
    if (icon) {
        icon.className = currentTheme === 'dark'
            ? 'ph ph-sun text-lg'
            : 'ph ph-moon text-lg';
    }
}

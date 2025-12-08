/**
 * Theme Manager
 * Handles dark/light mode toggling and persistence.
 */

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggle');
    if (!themeToggleBtn) return;

    const icon = themeToggleBtn.querySelector('i');

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateIcon(theme);
    }

    function updateIcon(theme) {
        if (theme === 'dark') {
            icon.classList.replace('ph-moon', 'ph-sun');
            themeToggleBtn.setAttribute('aria-label', 'Switch to Light Mode');
        } else {
            icon.classList.replace('ph-sun', 'ph-moon');
            themeToggleBtn.setAttribute('aria-label', 'Switch to Dark Mode');
        }
    }

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Initialize
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);

    // Toggle Event
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });
});

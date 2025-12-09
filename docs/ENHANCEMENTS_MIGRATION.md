# Migration Guide for Enhancements

Guide for migrating existing code to use the new enhancement features.

## Overview

This guide helps you update existing code to leverage the new enhancements while maintaining backward compatibility.

---

## #16: Migrating to Tooltip System

### Before (Manual Tooltips)
```javascript
// Custom tooltip implementation
element.addEventListener('mouseenter', () => {
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = 'Help text';
    document.body.appendChild(tooltip);
    // Position manually...
});
```

### After (Automatic Tooltips)
```html
<!-- Just add data attributes -->
<button data-tooltip="Help text" data-tooltip-position="top">
    Button
</button>
```

**Migration Steps:**
1. Remove custom tooltip code
2. Add `data-tooltip` attribute to elements
3. Optionally add `data-tooltip-position`
4. Remove custom CSS for tooltips

---

## #3: Migrating to Input Validation

### Before (Manual Validation)
```javascript
// Manual validation
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = form.email.value;
    if (!email) {
        showError('Email required');
        return;
    }
    if (!email.includes('@')) {
        showError('Invalid email');
        return;
    }
    
    // Submit...
});
```

### After (Declarative Validation)
```javascript
import { initializeInputValidation, ValidationRules } from './modules/inputValidation.js';

initializeInputValidation('formId', {
    email: {
        required: { rule: ValidationRules.required, message: 'Email required' },
        email: { rule: ValidationRules.email, message: 'Invalid email' }
    }
});

form.addEventListener('validSubmit', (e) => {
    // Form is already validated
    const data = e.detail;
    // Submit...
});
```

**Migration Steps:**
1. Define validation rules object
2. Call `initializeInputValidation()`
3. Replace `submit` listener with `validSubmit`
4. Remove manual validation code
5. Add `form-group` and `form-label` classes to HTML

---

## #18: Migrating to Empty States

### Before (Manual Empty State)
```javascript
// Manual empty state
if (data.length === 0) {
    container.innerHTML = `
        <div class="text-center p-8">
            <p>No data available</p>
            <button onclick="upload()">Upload File</button>
        </div>
    `;
}
```

### After (Rich Empty States)
```javascript
import { renderEmptyState, EmptyStates } from './modules/emptyStates.js';

if (data.length === 0) {
    renderEmptyState('container', EmptyStates.noFile(() => upload()));
}
```

**Migration Steps:**
1. Import `renderEmptyState` and `EmptyStates`
2. Replace manual HTML with `renderEmptyState()`
3. Use predefined states or create custom ones
4. Remove custom empty state CSS

---

## #15: Migrating to Toast System

### Before (Alert or Custom Notifications)
```javascript
// Using alert
alert('File uploaded successfully');

// Or custom notification
const notification = document.createElement('div');
notification.className = 'notification success';
notification.textContent = 'Success!';
document.body.appendChild(notification);
setTimeout(() => notification.remove(), 3000);
```

### After (Toast Notifications)
```javascript
import { showSuccess } from './modules/toast.js';

showSuccess('File uploaded successfully');
```

**Migration Steps:**
1. Replace `alert()` calls with toast functions
2. Remove custom notification code
3. Use appropriate toast type (success, error, warning, info)
4. Remove custom notification CSS

---

## #5: Migrating to Export Utils

### Before (Manual Export)
```javascript
// Manual CSV export
const csv = data.map(row => Object.values(row).join(',')).join('\n');
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'export.csv';
a.click();
```

### After (Export Utils)
```javascript
import { exportToCSV } from './modules/shared/export-utils.js';

exportToCSV(data, 'Export');
```

**Migration Steps:**
1. Import export functions
2. Replace manual export code
3. Use `exportToExcel()`, `exportToCSV()`, or `exportToJSON()`
4. Remove manual blob/download code

---

## #1: Migrating to Dark Mode

### Before (Manual Theme Toggle)
```javascript
// Manual theme toggle
function toggleTheme() {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
}
```

### After (Theme Module)
```javascript
import { toggleDarkMode, initializeDarkMode } from './modules/theme.js';

// Initialize on app start
initializeDarkMode();

// Toggle programmatically
toggleDarkMode();
```

**Migration Steps:**
1. Remove manual theme toggle code
2. Import theme module
3. Call `initializeDarkMode()` on app start
4. Use `toggleDarkMode()` for programmatic toggle
5. Ensure HTML uses `data-theme` attribute instead of class

---

## Complete Migration Example

### Before
```javascript
// Old code
class MyTool {
    constructor() {
        this.setupValidation();
        this.setupTooltips();
        this.setupExport();
    }
    
    setupValidation() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!this.validateForm()) {
                alert('Invalid form');
                return;
            }
            this.submit();
        });
    }
    
    validateForm() {
        const email = this.form.email.value;
        return email && email.includes('@');
    }
    
    setupTooltips() {
        document.querySelectorAll('[title]').forEach(el => {
            el.addEventListener('mouseenter', () => {
                this.showTooltip(el, el.title);
            });
        });
    }
    
    setupExport() {
        this.exportBtn.addEventListener('click', () => {
            const csv = this.data.map(r => Object.values(r).join(',')).join('\n');
            this.downloadCSV(csv);
        });
    }
    
    showEmptyState() {
        this.container.innerHTML = '<p>No data</p>';
    }
}
```

### After
```javascript
// New code
import { initializeInputValidation, ValidationRules } from './modules/inputValidation.js';
import { renderEmptyState, EmptyStates } from './modules/emptyStates.js';
import { showSuccess, showError } from './modules/toast.js';
import { exportToCSV } from './modules/shared/export-utils.js';

class MyTool {
    constructor() {
        this.setupValidation();
        this.setupExport();
        // Tooltips are automatic via data-tooltip attributes
    }
    
    setupValidation() {
        initializeInputValidation('myForm', {
            email: {
                required: { rule: ValidationRules.required, message: 'Required' },
                email: { rule: ValidationRules.email, message: 'Invalid email' }
            }
        });
        
        this.form.addEventListener('validSubmit', (e) => {
            this.submit(e.detail);
        });
    }
    
    setupExport() {
        this.exportBtn.addEventListener('click', () => {
            exportToCSV(this.data, 'Export');
        });
    }
    
    showEmptyState() {
        renderEmptyState('container', EmptyStates.noData());
    }
    
    submit(data) {
        // Process data
        showSuccess('Form submitted successfully');
    }
}
```

**HTML Changes:**
```html
<!-- Before -->
<button title="Click to save">Save</button>

<!-- After -->
<button data-tooltip="Click to save" data-tooltip-position="top">Save</button>
```

---

## Backward Compatibility

All enhancements are **backward compatible**:
- Existing code continues to work
- No breaking changes
- Gradual migration possible
- Old and new patterns can coexist

## Migration Checklist

- [ ] Replace manual tooltips with `data-tooltip` attributes
- [ ] Migrate form validation to `initializeInputValidation()`
- [ ] Replace manual empty states with `renderEmptyState()`
- [ ] Replace alerts with toast notifications
- [ ] Use export utils instead of manual export code
- [ ] Initialize dark mode with `initializeDarkMode()`
- [ ] Update HTML with proper classes (`form-group`, `form-label`)
- [ ] Test all migrated features
- [ ] Remove old custom code
- [ ] Update documentation

## Testing After Migration

1. **Functionality:** All features work as before
2. **Accessibility:** Keyboard navigation and screen readers work
3. **Visual:** UI looks correct in light and dark modes
4. **Performance:** No performance degradation
5. **Browser:** Works in all supported browsers

## Rollback Plan

If issues arise:
1. Keep old code commented out during migration
2. Test thoroughly before removing old code
3. Use feature flags if needed
4. Gradual rollout per tool/feature

## Support

- See `ENHANCEMENTS_USAGE_GUIDE.md` for detailed examples
- See `ENHANCEMENTS_QUICK_REFERENCE.md` for quick lookups
- Test with `enhancements-demo.html`
- Check inline JSDoc comments in module files

---

## Summary

Migration is straightforward:
1. Import new modules
2. Replace manual code with declarative patterns
3. Update HTML attributes
4. Test thoroughly
5. Remove old code

Benefits:
- Less code to maintain
- Better accessibility
- Consistent UX
- Improved performance
- Easier testing

# Enhancements Quick Reference

Quick reference for using the implemented enhancements (#1, #3, #5, #15, #16, #18).

## 🌙 #1: Dark Mode

```javascript
import { toggleDarkMode } from './modules/theme.js';
toggleDarkMode(); // Toggle between light/dark
```

```html
<button id="themeToggle">
    <i class="ph ph-moon"></i>
</button>
```

---

## ✅ #3: Input Validation

```javascript
import { initializeInputValidation, ValidationRules } from './modules/inputValidation.js';

initializeInputValidation('formId', {
    email: {
        required: { rule: ValidationRules.required, message: 'Required' },
        email: { rule: ValidationRules.email, message: 'Invalid email' }
    },
    age: {
        number: { rule: ValidationRules.number, message: 'Must be number' },
        min: { rule: ValidationRules.min(18), message: 'Min age: 18' }
    }
});
```

**Available Rules:**
- `required`, `email`, `number`
- `minLength(n)`, `maxLength(n)`
- `min(n)`, `max(n)`
- `pattern(regex)`, `custom(fn)`

---

## 📥 #5: Data Export

```javascript
import { exportToExcel, exportToCSV, exportToJSON } from './modules/shared/export-utils.js';

const data = [{ Name: 'John', Age: 30 }];

exportToExcel(data, 'Export', 'Sheet1');
exportToCSV(data, 'Export');
exportToJSON(data, 'Export');
```

---

## 🔔 #15: Toast Notifications

```javascript
import { showSuccess, showError, showWarning, showInfo } from './modules/toast.js';

showSuccess('Success message');
showError('Error message');
showWarning('Warning message');
showInfo('Info message');
```

---

## 💬 #16: Tooltips

**HTML (Automatic):**
```html
<button data-tooltip="Helpful message" data-tooltip-position="top">
    Button
</button>
```

**JavaScript (Programmatic):**
```javascript
import { showTooltip } from './modules/tooltip.js';

showTooltip(element, 'Message', 'top');
```

**Positions:** `'top'`, `'bottom'`, `'left'`, `'right'`

---

## 📋 #18: Empty States

```javascript
import { renderEmptyState, EmptyStates } from './modules/emptyStates.js';

// Predefined
renderEmptyState('containerId', EmptyStates.noFile(() => {
    // Upload handler
}));

// Custom
renderEmptyState('containerId', {
    icon: 'ph-chart-line',
    title: 'No Data',
    message: 'Upload a file to begin',
    actions: [{
        label: 'Upload',
        icon: 'ph-upload',
        primary: true,
        handler: () => upload()
    }],
    hint: '💡 Tip: Drag and drop supported'
});
```

**Predefined States:**
- `noFile(handler)`, `noData()`, `noResults(handler)`
- `noReconciliation()`, `processing()`, `error(handler)`
- `emptyTable()`, `noHistory()`

---

## 🎨 CSS Classes

### Form Validation
```html
<div class="form-group">
    <label class="form-label form-label-required">Label</label>
    <input type="text" name="field">
</div>
```

### Tooltips
```html
<i class="ph ph-info tooltip-trigger" 
   data-tooltip="Message"
   tabindex="0"></i>
```

### Empty States
```html
<div class="empty-state">
    <i class="ph ph-file-dashed empty-state-icon"></i>
    <div class="empty-state-text">Title</div>
    <div class="empty-state-subtext">Message</div>
</div>
```

---

## 🔧 Helper Functions

```javascript
// Add helper text to input
addHelperText('fieldName', 'Helper text');

// Add character counter
addCharacterCounter('fieldName', 200);

// Validate field dependencies
validateFieldDependency('field1', 'field2', 
    (val1, val2) => val1 < val2,
    'Field2 must be greater'
);

// Show contextual help
showContextualHelp('containerId', 'Message', 'info'); // or 'tip', 'warning'

// Clear empty state
clearEmptyState('containerId');
```

---

## ♿ Accessibility

All components include:
- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management
- Semantic HTML

---

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

## 🚀 Quick Start

```javascript
// In your module
import { showSuccess } from './modules/toast.js';
import { renderEmptyState, EmptyStates } from './modules/emptyStates.js';
import { initializeInputValidation, ValidationRules } from './modules/inputValidation.js';

// Show empty state
renderEmptyState('table', EmptyStates.noFile(() => upload()));

// Setup validation
initializeInputValidation('form', {
    email: {
        required: { rule: ValidationRules.required, message: 'Required' },
        email: { rule: ValidationRules.email, message: 'Invalid' }
    }
});

// Show success
showSuccess('Data loaded!');
```

---

## 📚 Full Documentation

See `docs/ENHANCEMENTS_USAGE_GUIDE.md` for complete examples and API reference.

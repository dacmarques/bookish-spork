# Enhancements Usage Guide

This guide demonstrates how to use the newly implemented enhancements from `enhaciments3.md`.

## ✅ Implemented Enhancements

### #1: Dark Mode Toggle
**Status:** ✅ Already Implemented  
**Location:** `src/modules/theme.js`

**Usage:**
```javascript
import { toggleDarkMode, initializeDarkMode } from './modules/theme.js';

// Initialize on app start (already done in main.js)
initializeDarkMode();

// Toggle programmatically
toggleDarkMode();
```

**HTML:**
```html
<button id="themeToggle" aria-label="Toggle dark mode">
    <i class="ph ph-moon text-lg"></i>
</button>
```

---

### #3: Input Validation
**Status:** ✅ Enhanced  
**Location:** `src/modules/inputValidation.js`

**Usage:**
```javascript
import { 
    initializeInputValidation, 
    ValidationRules,
    addHelperText,
    addCharacterCounter,
    validateFieldDependency
} from './modules/inputValidation.js';

// Define validation rules
const rules = {
    email: {
        required: { rule: ValidationRules.required, message: 'E-Mail ist erforderlich' },
        email: { rule: ValidationRules.email, message: 'Ungültige E-Mail-Adresse' }
    },
    password: {
        required: { rule: ValidationRules.required, message: 'Passwort ist erforderlich' },
        minLength: { rule: ValidationRules.minLength(8), message: 'Mindestens 8 Zeichen' }
    },
    age: {
        required: { rule: ValidationRules.required, message: 'Alter ist erforderlich' },
        number: { rule: ValidationRules.number, message: 'Muss eine Zahl sein' },
        min: { rule: ValidationRules.min(18), message: 'Mindestalter: 18' }
    }
};

// Initialize validation
initializeInputValidation('myForm', rules);

// Add helper text
addHelperText('email', 'Wir werden Ihre E-Mail niemals weitergeben');

// Add character counter
addCharacterCounter('description', 500);

// Validate field dependencies
validateFieldDependency(
    'startDate', 
    'endDate',
    (start, end) => new Date(start) < new Date(end),
    'Enddatum muss nach Startdatum liegen'
);
```

**HTML:**
```html
<form id="myForm">
    <div class="form-group">
        <label class="form-label form-label-required" for="email">E-Mail</label>
        <input type="email" name="email" id="email" required>
    </div>
    
    <div class="form-group">
        <label class="form-label form-label-required" for="password">Passwort</label>
        <input type="password" name="password" id="password" required>
    </div>
    
    <button type="submit" class="btn btn-primary">Absenden</button>
</form>
```

---

### #5: Data Export
**Status:** ✅ Already Implemented  
**Location:** `src/modules/shared/export-utils.js`

**Usage:**
```javascript
import { exportToExcel, exportToCSV, exportToJSON } from './modules/shared/export-utils.js';

// Export to Excel
const data = [
    { Name: 'John', Age: 30, City: 'Berlin' },
    { Name: 'Jane', Age: 25, City: 'Munich' }
];

exportToExcel(data, 'Users_Export', 'Users');

// Export to CSV
exportToCSV(data, 'Users_Export');

// Export to JSON
exportToJSON(data, 'Users_Export');

// With transformation
const transformFn = (item) => ({
    'Full Name': item.Name,
    'Years': item.Age,
    'Location': item.City
});

exportToExcel(data, 'Transformed_Export', 'Sheet1', transformFn);
```

---

### #15: Toast Notification System
**Status:** ✅ Already Implemented  
**Location:** `src/modules/toast.js`

**Usage:**
```javascript
import { showToast, showSuccess, showError, showWarning, showInfo } from './modules/toast.js';

// Basic toast
showToast('Operation completed', 'success', 3000);

// Convenience methods
showSuccess('File uploaded successfully');
showError('Failed to process file');
showWarning('This action cannot be undone');
showInfo('New features available');

// Custom duration
showToast('Processing...', 'info', 5000);
```

---

### #16: Tooltip Component
**Status:** ✅ Newly Implemented  
**Location:** `src/modules/tooltip.js`

**Usage:**

**Automatic (HTML attributes):**
```html
<!-- Simple tooltip -->
<button data-tooltip="Click to save your changes">
    Save
</button>

<!-- Tooltip with position -->
<i class="ph ph-info" 
   data-tooltip="This field is required for validation"
   data-tooltip-position="right"
   tabindex="0"></i>

<!-- Tooltip on form label -->
<label>
    Email Address
    <i class="ph ph-question tooltip-trigger" 
       data-tooltip="We'll never share your email"
       data-tooltip-position="top"
       tabindex="0"></i>
</label>
```

**Programmatic:**
```javascript
import { showTooltip, hideTooltip, createInfoIcon } from './modules/tooltip.js';

// Show tooltip programmatically
const element = document.getElementById('myButton');
showTooltip(element, 'This is a helpful message', 'top');

// Hide tooltip
hideTooltip();

// Create info icon with tooltip
const iconHTML = createInfoIcon('This provides additional context');
document.getElementById('container').innerHTML += iconHTML;
```

**Positions:** `'top'`, `'bottom'`, `'left'`, `'right'`

---

### #18: Contextual Help & Empty States
**Status:** ✅ Newly Implemented  
**Location:** `src/modules/emptyStates.js`

**Usage:**

**Empty States:**
```javascript
import { renderEmptyState, EmptyStates, showContextualHelp } from './modules/emptyStates.js';

// Predefined empty states
renderEmptyState('tableContainer', EmptyStates.noFile(() => {
    document.getElementById('fileInput').click();
}));

renderEmptyState('searchResults', EmptyStates.noResults(() => {
    clearSearch();
}));

renderEmptyState('reconciliationView', EmptyStates.noReconciliation());

// Custom empty state
renderEmptyState('myContainer', {
    icon: 'ph-chart-line',
    title: 'Keine Statistiken verfügbar',
    message: 'Laden Sie Daten hoch, um Statistiken anzuzeigen.',
    actions: [
        {
            label: 'Daten hochladen',
            icon: 'ph-upload',
            primary: true,
            handler: () => uploadData()
        },
        {
            label: 'Beispieldaten laden',
            icon: 'ph-file-text',
            primary: false,
            handler: () => loadSampleData()
        }
    ],
    hint: '💡 Tipp: Sie können auch Daten per Drag & Drop hochladen'
});
```

**Contextual Help:**
```javascript
// Show contextual help message
showContextualHelp('formContainer', 
    'Alle Felder mit * sind Pflichtfelder', 
    'info'
);

showContextualHelp('uploadSection',
    'Nur .xlsx und .xls Dateien werden unterstützt',
    'tip'
);

showContextualHelp('dangerZone',
    'Diese Aktion kann nicht rückgängig gemacht werden',
    'warning'
);
```

**Available Empty States:**
- `EmptyStates.noFile(uploadHandler)` - No file uploaded
- `EmptyStates.noData()` - No data found
- `EmptyStates.noResults(clearHandler)` - No search results
- `EmptyStates.noReconciliation()` - No reconciliation data
- `EmptyStates.processing()` - Processing/loading
- `EmptyStates.error(retryHandler)` - Error state
- `EmptyStates.emptyTable()` - Empty table
- `EmptyStates.noHistory()` - No history

---

## Complete Integration Example

```javascript
// In your tool's initialization
import { initializeInputValidation, ValidationRules } from './modules/inputValidation.js';
import { renderEmptyState, EmptyStates, showContextualHelp } from './modules/emptyStates.js';
import { showToast, showSuccess, showError } from './modules/toast.js';
import { exportToExcel } from './modules/shared/export-utils.js';

// 1. Show empty state initially
renderEmptyState('dataTable', EmptyStates.noFile(() => {
    document.getElementById('fileInput').click();
}));

// 2. Add contextual help
showContextualHelp('uploadSection', 
    'Ziehen Sie eine Excel-Datei hierher oder klicken Sie auf "Datei auswählen"',
    'tip'
);

// 3. Setup form validation
const validationRules = {
    targetValue: {
        required: { rule: ValidationRules.required, message: 'Zielwert ist erforderlich' },
        number: { rule: ValidationRules.number, message: 'Muss eine Zahl sein' }
    }
};

initializeInputValidation('filterForm', validationRules);

// 4. Handle file upload
async function handleFileUpload(file) {
    try {
        showToast('Datei wird verarbeitet...', 'info');
        
        const data = await processFile(file);
        
        if (data.length === 0) {
            renderEmptyState('dataTable', EmptyStates.noData());
            showError('Keine Daten in der Datei gefunden');
            return;
        }
        
        // Clear empty state and render data
        document.getElementById('dataTable').innerHTML = renderTable(data);
        showSuccess(`${data.length} Zeilen erfolgreich geladen`);
        
    } catch (error) {
        renderEmptyState('dataTable', EmptyStates.error(() => {
            handleFileUpload(file);
        }));
        showError('Fehler beim Verarbeiten der Datei');
    }
}

// 5. Export data
function handleExport() {
    const data = getCurrentData();
    
    if (data.length === 0) {
        showWarning('Keine Daten zum Exportieren vorhanden');
        return;
    }
    
    exportToExcel(data, 'Export', 'Data');
}
```

---

## HTML Examples

### Form with Validation and Tooltips
```html
<form id="dataForm" class="space-y-4">
    <div class="form-group">
        <label class="form-label form-label-required" for="orderNumber">
            Auftragsnummer
            <i class="ph ph-info tooltip-trigger" 
               data-tooltip="Format: 12345 (5 Ziffern)"
               data-tooltip-position="right"
               tabindex="0"></i>
        </label>
        <input type="text" 
               name="orderNumber" 
               id="orderNumber" 
               placeholder="z.B. 12345"
               required>
    </div>
    
    <div class="form-group">
        <label class="form-label" for="description">
            Beschreibung
        </label>
        <textarea name="description" 
                  id="description" 
                  rows="4"
                  maxlength="500"></textarea>
    </div>
    
    <div class="flex gap-3">
        <button type="submit" class="btn btn-primary">
            <i class="ph ph-check"></i>
            Speichern
        </button>
        <button type="button" class="btn btn-secondary" data-tooltip="Formular zurücksetzen">
            <i class="ph ph-x"></i>
            Abbrechen
        </button>
    </div>
</form>
```

### Empty State Container
```html
<div id="resultsContainer" class="section-card">
    <div class="section-header">
        <h3>Suchergebnisse</h3>
    </div>
    <div id="resultsTable">
        <!-- Empty state will be rendered here -->
    </div>
</div>
```

### Buttons with Tooltips
```html
<div class="btn-group">
    <button class="btn btn-primary" 
            data-tooltip="Daten als Excel exportieren"
            data-tooltip-position="top">
        <i class="ph ph-file-xls"></i>
        Excel
    </button>
    
    <button class="btn btn-secondary" 
            data-tooltip="Daten als CSV exportieren"
            data-tooltip-position="top">
        <i class="ph ph-file-csv"></i>
        CSV
    </button>
    
    <button class="btn btn-secondary" 
            data-tooltip="Daten als JSON exportieren"
            data-tooltip-position="top">
        <i class="ph ph-file-code"></i>
        JSON
    </button>
</div>
```

---

## Accessibility Features

All enhancements include accessibility features:

1. **Tooltips:**
   - Keyboard accessible (focus triggers)
   - ARIA attributes (`role="tooltip"`, `aria-hidden`)
   - Screen reader friendly

2. **Validation:**
   - `aria-invalid` attributes
   - `aria-describedby` for helper text
   - Error announcements with `role="alert"`

3. **Empty States:**
   - Semantic HTML
   - Clear action buttons
   - Icon labels

4. **Toasts:**
   - `aria-live` regions
   - Dismissible with keyboard
   - Appropriate timing

---

## Testing Checklist

- [ ] Dark mode toggle works and persists
- [ ] Form validation shows errors on blur
- [ ] Form validation prevents invalid submission
- [ ] Tooltips appear on hover and focus
- [ ] Tooltips position correctly at viewport edges
- [ ] Empty states render with correct icons and messages
- [ ] Toast notifications auto-dismiss
- [ ] Toast notifications are dismissible
- [ ] Data exports download correctly
- [ ] Character counters update in real-time
- [ ] Field dependencies validate correctly
- [ ] All features work with keyboard navigation
- [ ] Screen reader announces validation errors

---

## Browser Compatibility

All enhancements are compatible with:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

No external dependencies required (except XLSX.js for Excel export, which is already included).

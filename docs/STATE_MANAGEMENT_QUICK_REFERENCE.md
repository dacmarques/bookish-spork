# State Management Quick Reference

Quick reference for using the state management features (#19, #20, #13, #27).

## Undo/Redo (#19)

### Basic Usage

```javascript
import { undo, redo, canUndo, canRedo, clearHistory } from './modules/state.js';

// Check if undo is available
if (canUndo()) {
    undo(); // Undo last action
}

// Check if redo is available
if (canRedo()) {
    redo(); // Redo last undone action
}

// Clear history (e.g., on file upload)
clearHistory();
```

### Track Actions in History

```javascript
import { updateState, ActionTypes } from './modules/state.js';

// Update state with history tracking
updateState(
    'tool1.filter',           // Path to state property
    'new value',              // New value
    true,                     // Track in history
    ActionTypes.FILTER_CHANGE // Action type
);
```

### Available Action Types

```javascript
ActionTypes.ROW_ADD
ActionTypes.ROW_DELETE
ActionTypes.ROW_EDIT
ActionTypes.ROW_REORDER
ActionTypes.BATCH_DELETE
ActionTypes.DATA_IMPORT
ActionTypes.FILTER_CHANGE
ActionTypes.SORT_CHANGE
```

### Keyboard Shortcuts

- **Ctrl+Z** (Cmd+Z on Mac): Undo
- **Ctrl+Y** (Cmd+Shift+Z on Mac): Redo

---

## Session Export/Import (#20)

### Export Session

```javascript
import { exportSession } from './modules/state.js';

// Get session data as JSON string
const sessionData = exportSession();

// Create download
const blob = new Blob([sessionData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'session.json';
a.click();
```

### Import Session

```javascript
import { importSession } from './modules/state.js';

// Import from JSON string
const success = importSession(jsonString);

if (success) {
    console.log('Session restored');
} else {
    console.error('Failed to restore session');
}
```

### Auto-Save

```javascript
import { saveToSessionStorage, restoreFromSessionStorage } from './modules/state.js';

// Save current state (called automatically every 30s)
saveToSessionStorage();

// Restore from sessionStorage
const result = restoreFromSessionStorage();
if (result.restored) {
    console.log('Session restored from', new Date(result.timestamp));
}
```

---

## Settings/Preferences (#13)

### Update Settings

```javascript
import { updateSetting, state } from './modules/state.js';

// Update a setting
updateSetting('dateFormat', 'YYYY-MM-DD');
updateSetting('currencySymbol', '$');
updateSetting('autoSave', true);
updateSetting('autoSaveInterval', 60000); // 60 seconds

// Update nested setting
updateSetting('columnVisibility.tool1.targetValue', false);
```

### Access Settings

```javascript
import { state } from './modules/state.js';

// Read settings
const dateFormat = state.settings.dateFormat;
const currencySymbol = state.settings.currencySymbol;
const autoSave = state.settings.autoSave;
```

### Reset Settings

```javascript
import { resetSettings } from './modules/state.js';

// Reset all settings to defaults
resetSettings();
```

### Available Settings

```javascript
{
    dateFormat: 'DD.MM.YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY',
    currencySymbol: string,
    decimalSeparator: ',' | '.',
    thousandsSeparator: '.' | ',' | ' ' | '',
    autoSave: boolean,
    autoSaveInterval: number, // milliseconds
    showDebugInfo: boolean,
    columnVisibility: {
        tool1: { [columnName]: boolean },
        tool2: { [columnName]: boolean },
        tool3: { [columnName]: boolean }
    },
    theme: 'light' | 'dark' | 'auto'
}
```

---

## Batch Operations (#27)

### Select Rows

```javascript
import { 
    selectRow, 
    deselectRow, 
    toggleRowSelection,
    isRowSelected 
} from './modules/state.js';

// Select a row
selectRow(rowId);

// Deselect a row
deselectRow(rowId);

// Toggle selection
toggleRowSelection(rowId);

// Check if row is selected
if (isRowSelected(rowId)) {
    console.log('Row is selected');
}
```

### Select All / Clear Selection

```javascript
import { selectAllRows, clearSelection } from './modules/state.js';

// Select all rows
const allRowIds = [0, 1, 2, 3, 4];
selectAllRows(allRowIds);

// Clear all selections
clearSelection();

// Clear selections for specific tool
clearSelection('tool1');
```

### Get Selected Rows

```javascript
import { getSelectedRows, getSelectionCount } from './modules/state.js';

// Get array of selected row IDs
const selectedRows = getSelectedRows();
console.log('Selected:', selectedRows); // [0, 2, 4]

// Get count of selected rows
const count = getSelectionCount();
console.log('Count:', count); // 3
```

### Enable Batch Operations on Table

```javascript
import { enableBatchOperations } from './modules/batchOperations.js';

function renderTable() {
    const table = document.getElementById('my-table');
    
    // ... render table rows ...
    
    // Add batch operation checkboxes
    enableBatchOperations(table);
}
```

### Listen for Batch Events

```javascript
// Batch delete event
window.addEventListener('batchDelete', (e) => {
    const { tool, rowIds } = e.detail;
    
    // Delete the selected rows
    rowIds.forEach(id => {
        // Delete row logic
    });
});

// Batch export event
window.addEventListener('batchExport', (e) => {
    const { tool, rowIds } = e.detail;
    
    // Export the selected rows
    const selectedData = rowIds.map(id => data[id]);
    // Export logic
});

// Selection changed event
window.addEventListener('selectionChanged', (e) => {
    const { selectedCount, tool, selectAll } = e.detail;
    console.log(`${selectedCount} rows selected in ${tool}`);
});
```

---

## Event System

### Listen for State Changes

```javascript
window.addEventListener('stateChanged', (e) => {
    const { path, value, actionType, isUndo, isRedo } = e.detail;
    
    console.log(`State changed: ${path} = ${value}`);
    
    if (isUndo) {
        console.log('Change was from undo');
    }
    
    if (isRedo) {
        console.log('Change was from redo');
    }
});
```

### Listen for History Changes

```javascript
window.addEventListener('historyChanged', (e) => {
    const { canUndo, canRedo, historySize } = e.detail;
    
    // Update UI buttons
    undoButton.disabled = !canUndo;
    redoButton.disabled = !canRedo;
    
    console.log(`History size: ${historySize}`);
});
```

### Listen for Session Events

```javascript
// Session saved
window.addEventListener('sessionSaved', (e) => {
    const { timestamp } = e.detail;
    console.log('Session saved at', timestamp);
});

// Session imported
window.addEventListener('sessionImported', (e) => {
    const { timestamp } = e.detail;
    console.log('Session imported from', timestamp);
});

// Session restored (from sessionStorage)
window.addEventListener('sessionRestored', () => {
    console.log('Session restored');
    // Re-render UI
});
```

### Listen for Setting Changes

```javascript
window.addEventListener('settingChanged', (e) => {
    const { key, value } = e.detail;
    
    console.log(`Setting changed: ${key} = ${value}`);
    
    // Apply setting changes
    if (key === 'theme') {
        applyTheme(value);
    }
});

window.addEventListener('settingsSaved', (e) => {
    const { settings } = e.detail;
    console.log('All settings saved', settings);
});
```

---

## UI Components

### Open Settings Panel

```javascript
// Via button click
<button data-action="open-settings">Settings</button>

// Programmatically
document.querySelector('[data-action="open-settings"]').click();
```

### Undo/Redo Toolbar

```javascript
import { createUndoRedoToolbar } from './modules/undoRedo.js';

// Create toolbar
const toolbar = createUndoRedoToolbar();

// Add to page
document.querySelector('.header-actions').appendChild(toolbar);
```

### Session Toolbar

```javascript
import { createSessionToolbar } from './modules/sessionManager.js';

// Create toolbar
const toolbar = createSessionToolbar();

// Add to page
document.querySelector('.header-actions').appendChild(toolbar);
```

### Batch Toolbar

```javascript
import { createBatchToolbar } from './modules/batchOperations.js';

// Create toolbar
const toolbar = createBatchToolbar();

// Add to page
document.body.appendChild(toolbar);
```

---

## Common Patterns

### Track Row Deletion with Undo

```javascript
import { updateState, ActionTypes } from './modules/state.js';

function deleteRow(rowId) {
    const oldData = [...state.tool3.data];
    const newData = oldData.filter((_, i) => i !== rowId);
    
    // Update with history tracking
    updateState('tool3.data', newData, true, ActionTypes.ROW_DELETE);
    
    // Re-render
    renderTable();
}
```

### Save Settings on Change

```javascript
import { updateSetting } from './modules/state.js';

function handleThemeChange(theme) {
    // Update setting (automatically saves to localStorage)
    updateSetting('theme', theme);
    
    // Apply theme
    applyTheme(theme);
}
```

### Batch Delete with Confirmation

```javascript
import { getSelectedRows, clearSelection } from './modules/state.js';

function handleBatchDelete() {
    const selectedRows = getSelectedRows();
    
    if (selectedRows.length === 0) {
        alert('No rows selected');
        return;
    }
    
    if (!confirm(`Delete ${selectedRows.length} rows?`)) {
        return;
    }
    
    // Delete rows
    selectedRows.forEach(id => deleteRow(id));
    
    // Clear selection
    clearSelection();
}
```

### Auto-Save with Indicator

```javascript
import { saveToSessionStorage } from './modules/state.js';

// Listen for auto-save
window.addEventListener('sessionSaved', () => {
    // Show indicator
    const indicator = document.getElementById('save-indicator');
    indicator.textContent = 'Saved';
    indicator.classList.add('active');
    
    // Hide after 2 seconds
    setTimeout(() => {
        indicator.classList.remove('active');
    }, 2000);
});
```

---

## Accessibility

All features are fully accessible:

- **Keyboard Navigation**: Tab through all controls
- **Keyboard Shortcuts**: Ctrl+Z, Ctrl+Y, Escape
- **ARIA Labels**: All buttons have descriptive labels
- **Focus Management**: Settings panel traps focus
- **Screen Reader Support**: Status announcements
- **Touch Targets**: Minimum 44x44px

---

## Performance Tips

1. **History Size**: Limited to 50 actions automatically
2. **Auto-Save Interval**: Adjust based on data size (default 30s)
3. **Batch Operations**: Use event delegation for checkboxes
4. **Settings**: Only save when changed, not on every render
5. **Session Export**: Large datasets may take time to serialize

---

## Troubleshooting

### Undo/Redo Not Working

- Check if history tracking is enabled: `updateState(path, value, true, actionType)`
- Verify action type is provided
- Check browser console for errors

### Settings Not Persisting

- Check localStorage is enabled in browser
- Verify settings are saved: `saveSettings()`
- Check browser console for quota errors

### Session Restore Not Showing

- Check sessionStorage has data
- Verify page was reloaded (not hard refresh)
- Check browser console for import errors

### Batch Selection Not Working

- Verify `enableBatchOperations()` was called
- Check table has proper structure (thead, tbody)
- Verify row IDs are unique

---

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- LocalStorage (for settings)
- SessionStorage (for auto-save)
- File API (for export/import)

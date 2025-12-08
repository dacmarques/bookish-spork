# Validation & Error Handling - Quick Reference

## 🚀 Quick Start

### 1. Initialize (Once on App Load)

```javascript
import { initializeAuditTrail } from './shared/auditTrail.js';
import { initializeHistory } from './shared/history.js';
import { createHistoryPanel } from './shared/historyPanel.js';

// In your main.js
initializeAuditTrail();
initializeHistory();
createHistoryPanel('history-panel-container');
```

### 2. Validate File Upload

```javascript
import { validateAndProcess } from './shared/validationIntegration.js';

const results = await validateAndProcess(data, 'tool1', 'protokoll');
if (!results.valid) {
  console.error('Validation failed');
  return;
}
// Use results.data
```

### 3. Track User Actions

```javascript
import { logEdit, logDelete, logImport } from './shared/auditTrail.js';

logImport(fileName, rowCount, 'Tool 1');
logEdit(rowId, 'Betrag', oldValue, newValue);
logDelete(rowId, rowData);
```

### 4. Enable Undo/Redo

```javascript
import { recordEdit, recordDelete } from './shared/history.js';

recordEdit(rowId, field, oldValue, newValue, restoreFunc);
recordDelete(rowId, rowData, restoreFunc);

// Keyboard shortcuts work automatically:
// Ctrl+Z = Undo
// Ctrl+Y = Redo
```

---

## 📚 Module Reference

### validator.js
- `validateFileStructure(data, rules)` - Check columns and structure
- `validateDataset(data, rules)` - Validate all cells
- `validateCellValue(value, type, column)` - Validate single cell
- `validateDate(value, column)` - Parse and validate dates
- `validateNumber(value, column)` - Parse and validate numbers

### dataQuality.js
- `analyzeDataQuality(data, options)` - Full quality analysis
- `findDuplicates(data, keyColumn)` - Find duplicate rows
- `findMissingFields(data)` - Find missing required fields
- `findUnusualValues(data, amountColumn)` - Find outliers
- `calculateCompleteness(data)` - Get completeness percentage
- `generateQualityReportSummary(report)` - Format report

### auditTrail.js
- `initializeAuditTrail(options)` - Setup audit system
- `logAction(action, details)` - Generic action log
- `logImport(fileName, rows, tool)` - Log file import
- `logEdit(rowId, field, old, new)` - Log cell edit
- `logDelete(rowId, data)` - Log row deletion
- `logExport(format, rows)` - Log data export
- `getRecentEntries(limit)` - Get recent actions
- `searchAuditLog(query)` - Search audit trail

### history.js
- `initializeHistory(options)` - Setup undo/redo
- `recordAction(type, data, inverse)` - Record action
- `recordEdit(id, field, old, new, restore)` - Record edit
- `recordDelete(id, data, restore)` - Record delete
- `recordAdd(id, data, delete)` - Record add
- `undo()` - Undo last action
- `redo()` - Redo last undone action
- `getHistoryState()` - Get undo/redo availability

### validationUI.js
- `showQualityReport(report, containerId)` - Show quality report
- `highlightCellErrors(tableId, errors)` - Highlight errors in table
- `showValidationTooltip(element, error)` - Show tooltip
- `attachValidationTooltips(tableId)` - Add hover tooltips
- `showValidationMessage(id, msg, type)` - Show inline message

### historyPanel.js
- `createHistoryPanel(containerId)` - Create history UI
- `updateHistoryPanel(containerId)` - Refresh display
- `toggleHistoryPanel(containerId)` - Show/hide panel

### validationIntegration.js
- `validateAndProcess(data, tool, type)` - All-in-one validation
- `showValidationResults(results, tool)` - Show results to user
- `highlightValidationErrors(tableId, results)` - Highlight in table
- `ensureQualityReportContainer(tool)` - Create container
- `preValidateFile(file, extensions)` - Quick file check

---

## 🎨 CSS Classes

### Error Highlighting
```css
.cell-error          /* Red highlighted cell with error */
.cell-warning        /* Yellow highlighted cell with warning */
```

### Tooltips
```css
.validation-tooltip         /* Base tooltip */
.validation-tooltip.error   /* Error tooltip */
.validation-tooltip.warning /* Warning tooltip */
```

### Quality Report
```css
.quality-report-card    /* Report container */
.quality-score          /* Score display */
.score-circle           /* Circular progress */
.quality-issues         /* Issue badges */
.issues-section         /* Error/warning lists */
```

### History Panel
```css
.history-panel          /* Panel container */
.history-header         /* Collapsible header */
.history-tabs           /* Tab navigation */
.history-item           /* Individual entry */
.history-controls       /* Undo/redo buttons */
```

---

## 🔧 Configuration

### Audit Trail Options
```javascript
initializeAuditTrail({
  maxEntries: 1000  // Keep last N entries
});
```

### History Options
```javascript
initializeHistory({
  maxHistorySize: 50  // Undo stack size
});
```

### Validation Rules
```javascript
// Defined in validator.js
ValidationRules.TOOL1.PROTOKOLL = {
  requiredColumns: ['Auftrags-Nr.', 'Datum', 'Betrag'],
  columnTypes: {
    'Auftrags-Nr.': 'string',
    'Datum': 'date',
    'Betrag': 'number'
  }
};
```

---

## 📝 Event Listeners

### History Events
```javascript
window.addEventListener('historyUpdated', (e) => {
  console.log('History changed:', e.detail);
});

window.addEventListener('auditTrailUpdated', (e) => {
  console.log('New audit entry:', e.detail.entry);
});

window.addEventListener('redoAction', (e) => {
  // Handle redo action
  const action = e.detail;
});
```

### Quality Report Events
```javascript
window.addEventListener('qualityReportProceed', () => {
  // User clicked "Proceed" button
});

window.addEventListener('qualityReportIgnoreWarnings', () => {
  // User clicked "Ignore Warnings"
});

window.addEventListener('qualityReportFixErrors', (e) => {
  // User clicked "Fix Errors"
  const report = e.detail;
});
```

---

## ⚡ Performance Tips

1. **Batch Operations**: Use `recordBatch()` for multiple edits
2. **Debounce Validation**: Don't validate on every keystroke
3. **Limit History Size**: Keep maxHistorySize reasonable (50-100)
4. **Clear Old Audit Logs**: Periodically clear audit trail
5. **Lazy Load**: Only show quality report when needed

---

## 🐛 Troubleshooting

### Undo/Redo Not Working
- Check that `initializeHistory()` was called
- Ensure inverse functions are correct
- Verify keyboard event listeners aren't blocked

### Cell Errors Not Highlighting
- Table cells need `data-row` and `data-column` attributes
- Call `highlightCellErrors()` after table render
- Check that validation returned `cellErrors` Map

### Quality Report Not Showing
- Ensure container exists with correct ID
- Call `ensureQualityReportContainer()` first
- Check that report has issues to display

### Audit Trail Not Persisting
- Check localStorage is enabled
- Verify no quota exceeded errors
- Test in non-incognito mode

---

## 📦 Required Dependencies

- **XLSX.js** - For Excel file reading (if not already included)
- No other external dependencies needed

---

## 🎯 Common Patterns

### Pattern 1: File Upload + Validation
```javascript
async function handleUpload(file) {
  const data = await readExcel(file);
  const results = await validateAndProcess(data, 'tool1', 'protokoll');
  if (!results.valid) return;
  renderTable(results.data);
  highlightValidationErrors('table-id', results);
}
```

### Pattern 2: Edit with History
```javascript
function editCell(row, col, value) {
  const old = state.data[row][col];
  state.data[row][col] = value;
  logEdit(row, col, old, value);
  recordEdit(row, col, old, value, restore);
  render();
}
```

### Pattern 3: Show Quality Report
```javascript
function checkQuality(data) {
  const report = analyzeDataQuality(data);
  const summary = generateQualityReportSummary(report);
  if (summary.errorCount > 0 || summary.warningCount > 0) {
    showQualityReport(report, 'tool1-quality-report');
  }
}
```

---

## 📖 Full Example

See `/src/modules/shared/integrationExample.js` for complete working examples of:
- ✅ Full initialization
- ✅ File upload with validation
- ✅ Edit with undo/redo
- ✅ Delete with history
- ✅ Batch operations
- ✅ Export with logging
- ✅ Event handling

---

## 🔗 Related Documentation

- `/docs/implemented/13_validation-error-handling.md` - Full implementation guide
- `/src/modules/shared/integrationExample.js` - Working examples
- `/src/styles/components.css` - Complete styles

---

**Last Updated:** December 8, 2025  
**Version:** 1.0.0

# Advanced Table Features - Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Tool 2 - Smart Extractor                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Main Components                           │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   handlers   │  │   renderer   │  │   analyzer   │      │
│  │     .js      │  │     .js      │  │     .js      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘      │
│         │                  │                                 │
│         │                  │                                 │
│         ▼                  ▼                                 │
│  ┌─────────────────────────────────────────────────┐        │
│  │      tableEnhancements.js (NEW)                 │        │
│  │  ┌───────────────────────────────────────────┐ │        │
│  │  │  Column Visibility Management             │ │        │
│  │  │  - hiddenColumns Set                      │ │        │
│  │  │  - applyColumnVisibility()                │ │        │
│  │  └───────────────────────────────────────────┘ │        │
│  │  ┌───────────────────────────────────────────┐ │        │
│  │  │  Advanced Filtering                       │ │        │
│  │  │  - columnFilters Object                   │ │        │
│  │  │  - applyAdvancedFilters()                 │ │        │
│  │  └───────────────────────────────────────────┘ │        │
│  │  ┌───────────────────────────────────────────┐ │        │
│  │  │  Inline Editing                           │ │        │
│  │  │  - editingCell State                      │ │        │
│  │  │  - unsavedChanges Map                     │ │        │
│  │  │  - startCellEdit() / saveCellEdit()      │ │        │
│  │  └───────────────────────────────────────────┘ │        │
│  │  ┌───────────────────────────────────────────┐ │        │
│  │  │  Row Selection                            │ │        │
│  │  │  - selectedRows Set                       │ │        │
│  │  │  - addRowCheckbox()                       │ │        │
│  │  └───────────────────────────────────────────┘ │        │
│  │  ┌───────────────────────────────────────────┐ │        │
│  │  │  Bulk Actions                             │ │        │
│  │  │  - bulkDeleteRows()                       │ │        │
│  │  │  - bulkExportRows()                       │ │        │
│  │  │  - bulkCopyRows()                         │ │        │
│  │  └───────────────────────────────────────────┘ │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      State Management                        │
├─────────────────────────────────────────────────────────────┤
│  state.tool2.extractedData  ← Main data array               │
│  state.tool2.filter         ← Basic search filter           │
│  state.tool2.customFilter   ← Advanced filter function      │
│  state.tool2.sort           ← Sort configuration            │
│                                                              │
│  tableState (module-level)  ← Enhancement-specific state    │
│    - hiddenColumns                                           │
│    - selectedRows                                            │
│    - editingCell                                             │
│    - unsavedChanges                                          │
│    - columnFilters                                           │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization Flow

```
User loads Tool 2
       │
       ▼
setupTool2Handlers()
       │
       ├─→ initTableEnhancements()
       │        │
       │        ├─→ setupColumnVisibilityMenu()
       │        ├─→ setupAdvancedFiltering()
       │        ├─→ setupInlineEditing()
       │        ├─→ setupRowSelection()
       │        └─→ setupBulkActions()
       │
       └─→ window.applyTableEnhancements = applyEnhancements
```

### 2. Render Flow

```
renderTable() called
       │
       ├─→ Filter data
       │    ├─→ Basic search (state.tool2.filter)
       │    └─→ Custom filters (state.tool2.customFilter)
       │
       ├─→ Sort data (state.tool2.sort)
       │
       ├─→ Render rows
       │    ├─→ Virtual scrolling (if > 100 rows)
       │    └─→ Standard rendering
       │
       └─→ applyEnhancements()
            ├─→ applyColumnVisibility()
            └─→ addRowCheckbox() for each row
```

### 3. Filter Flow

```
User enters filter
       │
       ├─→ Basic Search (filter-input-extractor)
       │    └─→ state.tool2.filter = value
       │
       └─→ Advanced Filters (filter panel)
            └─→ tableState.columnFilters[key] = value
                     │
                     ▼
            applyAdvancedFilters()
                     │
                     ├─→ Create state.tool2.customFilter function
                     │
                     └─→ renderTable()
                              │
                              └─→ Filters applied during data iteration
```

### 4. Edit Flow

```
User double-clicks cell
       │
       ▼
startCellEdit(cell)
       │
       ├─→ Store original value
       ├─→ Replace cell content with input
       └─→ tableState.editingCell = { cell, input, originalValue }
              │
              ▼
User presses Enter or clicks outside
       │
       ▼
saveCellEdit()
       │
       ├─→ Compare new vs original value
       ├─→ If changed:
       │    ├─→ Add to tableState.unsavedChanges
       │    ├─→ Apply yellow highlight
       │    └─→ updateEditControls()
       │
       └─→ tableState.editingCell = null
              │
              ▼
User clicks "Save Changes"
       │
       ▼
saveAllChanges()
       │
       ├─→ Update state.tool2.extractedData
       ├─→ Clear tableState.unsavedChanges
       ├─→ renderTable()
       └─→ updateUI()
```

### 5. Selection Flow

```
User clicks checkbox
       │
       ├─→ Individual checkbox
       │    └─→ tableState.selectedRows.add/delete(rowIndex)
       │
       └─→ Select All checkbox
            └─→ Toggle all row checkboxes
                     │
                     ▼
            updateBulkActionControls()
                     │
                     ├─→ Show/hide bulk actions bar
                     └─→ Update selected count
                              │
                              ▼
User clicks bulk action
       │
       ├─→ Delete: bulkDeleteRows()
       │    └─→ Remove from state.tool2.extractedData
       │
       ├─→ Export: bulkExportRows()
       │    └─→ Call exportToExcel() with selected data
       │
       └─→ Copy: bulkCopyRows()
            └─→ Copy TSV to clipboard
```

## Component Interactions

```
┌──────────────────────────────────────────────────────────┐
│                    User Interface                         │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Columns    │  │  Filters    │  │  Edit       │     │
│  │  Button     │  │  Button     │  │  Controls   │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                 │                 │            │
│         ▼                 ▼                 ▼            │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Table Container                     │    │
│  │  ┌────────────────────────────────────────────┐ │    │
│  │  │  ☑ │ File │ Auftrag │ Anlage │ ... │ Sum  │ │    │
│  │  ├────┼──────┼─────────┼────────┼─────┼──────┤ │    │
│  │  │ ☑  │ ... │  ...    │  ...   │ ... │ ...  │ │    │
│  │  │ ☑  │ ... │  ...    │  ...   │ ... │ ...  │ │    │
│  │  └────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Bulk Actions (when rows selected)       │    │
│  │  [2 selected] [Delete] [Export] [Copy]          │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

## State Synchronization

```
┌─────────────────────────────────────────────────────────┐
│                   State Layers                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Global State (state.js)                                │
│  ┌────────────────────────────────────────────────┐    │
│  │  state.tool2.extractedData  [Array]            │    │
│  │  state.tool2.filter         [String]           │    │
│  │  state.tool2.customFilter   [Function]         │    │
│  │  state.tool2.sort           [Object]           │    │
│  │  state.tool2.totalSum       [Number]           │    │
│  │  state.tool2.validRecords   [Number]           │    │
│  └────────────────────────────────────────────────┘    │
│                       ▲                                  │
│                       │ Updates                          │
│                       │                                  │
│  Enhancement State (tableEnhancements.js)               │
│  ┌────────────────────────────────────────────────┐    │
│  │  tableState.hiddenColumns    [Set]             │    │
│  │  tableState.selectedRows     [Set]             │    │
│  │  tableState.editingCell      [Object|null]     │    │
│  │  tableState.unsavedChanges   [Map]             │    │
│  │  tableState.columnFilters    [Object]          │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Event Handling

```
┌─────────────────────────────────────────────────────────┐
│                   Event Delegation                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Document Level                                          │
│  ├─→ click (outside menus) → Close dropdowns            │
│  └─→ keydown (Escape/Enter) → Edit controls             │
│                                                          │
│  Table Body (#table-body)                               │
│  └─→ dblclick → startCellEdit()                         │
│                                                          │
│  Column Menu (#column-visibility-menu)                  │
│  └─→ change (.column-toggle) → applyColumnVisibility()  │
│                                                          │
│  Filter Panel (#advanced-filter-panel)                  │
│  └─→ input (.filter-input) → applyAdvancedFilters()     │
│                                                          │
│  Individual Checkboxes                                   │
│  ├─→ change (#select-all-rows) → Toggle all             │
│  └─→ change (.row-select-checkbox) → Update selection   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimizations

1. **Event Delegation**
   - Single listener on table body for all cell edits
   - Reduces memory footprint for large tables

2. **Efficient DOM Updates**
   - Only update changed cells during edit
   - Batch DOM operations in applyColumnVisibility()

3. **State Management**
   - Use Set for O(1) lookups (hiddenColumns, selectedRows)
   - Use Map for efficient change tracking (unsavedChanges)

4. **Virtual Scrolling Compatible**
   - Enhancements work with existing virtual scroll
   - Checkboxes added post-render via applyEnhancements()

5. **CSS Containment**
   - Existing containment rules maintained
   - Minimal reflow on visibility changes

## Integration Points

### With Existing Features

| Existing Feature | Integration Method | Notes |
|------------------|-------------------|-------|
| Virtual Scrolling | Post-render hook | applyEnhancements() called after render |
| Basic Search | Combined filter | Both filters must pass |
| Sorting | Independent | Works on filtered data |
| Export | Reused functions | Bulk export uses same exportToExcel() |
| Copy | Reused logic | Bulk copy uses same TSV format |

### Extension Points

Future features can hook into:

1. **Custom Filter Chain**
   - Add more filter functions to chain
   - Example: `state.tool2.customFilter2`

2. **Enhancement Lifecycle**
   - `beforeRender()` - Pre-render hook
   - `afterRender()` - Post-render hook (current: applyEnhancements)

3. **State Persistence**
   - Save tableState to localStorage
   - Restore on page load

4. **Plugin Architecture**
   - Register enhancement modules
   - Enable/disable features dynamically

## Error Handling

```
Try-Catch Boundaries:
├─→ saveCellEdit() - Handles parse errors for Summe field
├─→ bulkExportRows() - Handles export failures
├─→ bulkCopyRows() - Handles clipboard API failures
└─→ applyAdvancedFilters() - Handles invalid date formats

Validation:
├─→ Check tableState.selectedRows.size before bulk actions
├─→ Verify cell exists before editing
└─→ Confirm destructive operations (delete)
```

## Testing Strategy

### Unit Tests (Recommended)

```javascript
// Column Visibility
test('hideColumn should add to hiddenColumns Set')
test('applyColumnVisibility should hide correct columns')

// Filtering
test('applyAdvancedFilters should filter by date range')
test('applyAdvancedFilters should filter by amount range')

// Editing
test('saveCellEdit should add to unsavedChanges')
test('saveAllChanges should update extractedData')

// Selection
test('selectAll should add all rows to selectedRows')
test('bulkDelete should remove correct rows')
```

### Integration Tests

```javascript
test('Column visibility persists through filtering')
test('Inline edits survive sorting')
test('Bulk actions work with filtered data')
test('Multiple features work together')
```

### Manual Testing Checklist

- [ ] Column visibility toggles correctly
- [ ] Filters combine properly
- [ ] Inline editing saves/discards
- [ ] Row selection updates count
- [ ] Bulk delete confirms and removes
- [ ] Bulk export creates valid file
- [ ] Bulk copy produces valid TSV
- [ ] Keyboard shortcuts work
- [ ] Screen reader announces changes
- [ ] No console errors

---

**Architecture Version:** 1.0  
**Last Updated:** December 8, 2024

# Advanced Table Features - User Guide

## Quick Reference

This guide covers the advanced table features available in Tool 2 (Smart Extractor).

---

## 🎯 Column Visibility

**Access:** Click the **"Columns"** button in the controls bar

### What it does:
- Show or hide specific columns in the table
- Focus on the data that matters to you
- Reduce clutter for better readability

### How to use:
1. Click the "Columns" button
2. Check/uncheck columns to show/hide them
3. Changes apply immediately

**Note:** The "File" column is always visible and cannot be hidden.

---

## 🔍 Advanced Filters

**Access:** Click the **"Filters"** button in the controls bar

### Available Filters:

#### Text Filters
- **Auftrag Nr.** - Search by order number
- **Anlage** - Search by facility name

#### Date Range Filter
- **From Date** - Start date (DD.MM.YYYY)
- **To Date** - End date (DD.MM.YYYY)

#### Amount Range Filter
- **Min Amount** - Minimum sum in EUR
- **Max Amount** - Maximum sum in EUR

### How to use:
1. Click the "Filters" button
2. Enter your filter criteria
3. Filters apply automatically as you type
4. Click "Clear All" to reset all filters

### Tips:
- Filters work together (AND logic)
- Combine with the search box for even more precise results
- Active filter count shows how many filters are applied

---

## ✏️ Inline Editing

**Access:** Double-click any cell (except the File column)

### What it does:
- Edit data directly in the table
- Make quick corrections without re-uploading files
- Batch edit multiple cells before saving

### How to use:
1. **Double-click** a cell to start editing
2. Type your changes
3. Press **Enter** or click outside to save the edit
4. Press **Escape** to cancel

### Saving Changes:
- Edited cells show a **yellow background** (unsaved indicator)
- The controls bar shows how many changes are pending
- Click **"Save Changes"** to commit all edits
- Click **"Discard"** to revert all changes

### Important:
- Changes are not saved until you click "Save Changes"
- Closing the page without saving will lose your edits
- The "Summe" field automatically parses currency values

---

## ☑️ Row Selection

**Access:** Checkboxes in the leftmost column

### What it does:
- Select multiple rows for bulk operations
- Perform actions on specific records only

### How to use:
- Click individual checkboxes to select rows
- Click the **header checkbox** to select/deselect all rows
- Selected rows show a **blue background**
- Selection count appears in the bulk actions bar

---

## 📦 Bulk Actions

**Access:** Appears automatically when rows are selected

### Available Actions:

#### 🗑️ Delete
- Remove multiple rows at once
- Confirmation dialog prevents accidents
- Updates totals automatically

**Steps:**
1. Select rows using checkboxes
2. Click "Delete" button
3. Confirm deletion
4. Rows are removed permanently

#### 📥 Export
- Export only selected rows to Excel
- Same format as full export
- Useful for sharing specific records

**Steps:**
1. Select rows to export
2. Click "Export" button
3. Excel file downloads automatically

#### 📋 Copy
- Copy selected rows to clipboard
- TSV format (paste into Excel/Google Sheets)
- Includes headers

**Steps:**
1. Select rows to copy
2. Click "Copy" button
3. Paste into your spreadsheet application

---

## 💡 Pro Tips

### Workflow Examples

#### Example 1: Focus on High-Value Orders
```
1. Click "Filters"
2. Set Min Amount to 5000
3. Hide unnecessary columns (Columns button)
4. Review and edit high-value orders
5. Export selected rows
```

#### Example 2: Correct Multiple Entries
```
1. Use search to find related records
2. Double-click cells to edit
3. Make all necessary changes
4. Review yellow-highlighted cells
5. Click "Save Changes"
```

#### Example 3: Clean Up Data
```
1. Apply filters to find problematic records
2. Select rows with checkboxes
3. Either edit inline or delete
4. Export cleaned data
```

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save cell edit | **Enter** |
| Cancel cell edit | **Escape** |
| Select checkbox | **Space** (when focused) |

### Best Practices

✅ **Do:**
- Use filters to narrow down data before editing
- Save changes frequently
- Review unsaved changes before saving
- Use bulk copy for quick data sharing

❌ **Don't:**
- Edit too many cells without saving (risk of losing work)
- Delete rows without confirmation review
- Forget to save changes before closing the page

---

## 🔧 Troubleshooting

### Filters not working?
- Check if you have data in the table
- Try clearing all filters and reapplying
- Ensure date format is DD.MM.YYYY

### Can't edit a cell?
- Make sure you're double-clicking (not single-click)
- File column cannot be edited
- Check if another cell is being edited

### Selected rows disappeared?
- Selections clear when filters change
- Re-select rows after filtering

### Changes not saving?
- Click "Save Changes" button (not just Enter)
- Check for error messages in toast notifications

---

## 📊 Feature Compatibility

| Feature | Works With |
|---------|------------|
| Column Visibility | ✅ Filters, Sorting, Search |
| Advanced Filters | ✅ Search, Sorting, Virtual Scroll |
| Inline Editing | ✅ All features |
| Row Selection | ✅ Filters, Sorting (clears on filter change) |
| Bulk Actions | ✅ Selected rows only |

---

## 🎓 Video Tutorials

*(Coming soon - placeholder for future video guides)*

1. Getting Started with Advanced Filters
2. Mastering Inline Editing
3. Bulk Operations Workflow
4. Power User Tips & Tricks

---

## 📞 Need Help?

If you encounter issues or have suggestions:
- Check the troubleshooting section above
- Review the implementation documentation
- Report bugs via the issue tracker

---

**Last Updated:** December 8, 2024  
**Version:** 1.0

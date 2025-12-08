# Excel Tools Suite - Quick Start Guide

## Tool 1: Value Counter

**Purpose:** Count occurrences of target values in Excel files and reconcile with billing data.

**How to Use:**
1. Upload a Protokoll file (drag & drop or click)
2. Upload an Abrechnung file (optional, for reconciliation)
3. Configure target values (e.g., "Montage", "Demontage")
4. View extracted metadata and value counts
5. Export results or copy table to clipboard

**Key Features:**
- Automatic header extraction (Datum, Auftrag Nr., Anlage, Einsatzort)
- Configurable target value counting
- Reconciliation view comparing Protokoll vs Abrechnung
- Export to CSV or merged Excel

---

## Tool 2: Smart Extractor

**Purpose:** Extract structured data from multiple Excel files automatically.

**How to Use:**
1. Drag & drop multiple Excel files (.xlsx)
2. Data is automatically extracted based on labels:
   - Datum (Date)
   - Auftrags-Nr. (Order Number)
   - Anlage (Plant/Facility)
   - Einsatzort (Location)
   - Fachmonteurstunde (Specialist Hours)
   - Auftragssumme (Order Total)
   - Bemerkung (Remarks)
3. Filter results using the search box
4. Sort by clicking column headers
5. Export to Excel or copy table

**Key Features:**
- Multi-file batch processing
- Flexible data extraction (adapts to different Excel layouts)
- Currency parsing (handles German and US formats)
- Excel date parsing
- Validation highlighting (missing/invalid data shown in color)
- Total sum calculation

**Data Extraction Logic:**
- Searches for labels in any cell
- Extracts values from adjacent cells (right, left, or below)
- Handles various Excel template layouts

---

## Tool 3: Row Manager

**Purpose:** Reorder Excel rows via drag-and-drop with advanced selection.

**How to Use:**
1. Upload an Excel file
2. Select rows:
   - **Click** - Select single row
   - **Ctrl/Cmd + Click** - Add/remove from selection
   - **Shift + Click** - Select range
   - **Checkbox** - Toggle row selection
   - **Select All** - Toggle all rows
3. Drag selected rows to reorder
4. Copy data:
   - **Copy Row** - Copy single row (TSV format)
   - **Bulk Copy** - Copy 22 rows starting from selected

**Key Features:**
- Multi-select with keyboard modifiers
- Bulk drag-and-drop (move multiple rows at once)
- Visual feedback during drag operations
- Copy to clipboard in Excel-compatible format
- Sticky action column for easy access

**Selection Shortcuts:**
- Single click: Select one row (clears others)
- Ctrl/Cmd + Click: Add to selection
- Shift + Click: Select range
- Checkbox: Toggle without clearing others

---

## General Features

### Navigation
- **Tabs:** Click sidebar buttons or use Ctrl/Cmd + 1/2/3
- **Help:** Click ? icon or press Ctrl/Cmd + H
- **Settings:** Click gear icon

### Theme
- Toggle dark/light mode in settings
- Preference is saved automatically

### Upload History
- View recent uploads in the sidebar
- Click to see file details
- Automatically tracks all uploads

### Keyboard Shortcuts
- `Ctrl/Cmd + 1` - Switch to Tool 1
- `Ctrl/Cmd + 2` - Switch to Tool 2
- `Ctrl/Cmd + 3` - Switch to Tool 3
- `Ctrl/Cmd + H` - Toggle help panel

---

## File Format Requirements

### Tool 1 (Value Counter)
- **Protokoll:** Excel file with target values in column A
- **Abrechnung:** Excel file with billing data

### Tool 2 (Smart Extractor)
- Excel files (.xlsx, .xls) with labeled data
- Labels should include: Datum, Auftrags-Nr., Anlage, etc.
- Flexible layout - labels can be anywhere

### Tool 3 (Row Manager)
- Any Excel file (.xlsx, .xls)
- First row is treated as headers
- All subsequent rows are data

---

## Tips & Tricks

### Tool 2 - Smart Extractor
- **Orange rows** indicate remarks/notes are present
- **Red cells** indicate critical missing data (e.g., Auftrag-Nr.)
- **Yellow cells** indicate warnings (e.g., invalid date format)
- Use the filter to quickly find specific orders or locations

### Tool 3 - Row Manager
- Drag multiple rows at once by selecting them first
- Use Shift+Click to quickly select large ranges
- The "Bulk Copy" button copies 22 rows - perfect for pasting into Excel templates

### Performance
- Tool 2 can handle dozens of files at once
- Tool 3 works smoothly with hundreds of rows
- Large files (>1000 rows) may take a few seconds to process

---

## Troubleshooting

### "No data found" error
- Check that your Excel file has the expected labels
- Verify the file is not empty
- Try opening the file in Excel to confirm structure

### Data not extracting correctly
- Tool 2 searches for labels like "Datum", "Auftrags-Nr."
- If your file uses different labels, data may not be found
- Check the original monolithic version for custom label mapping

### Drag-and-drop not working
- Ensure you're dragging from the row itself, not action buttons
- Selected rows will move together
- Cannot drop on a selected row

---

## Browser Compatibility

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari 14+
- ❌ Internet Explorer (not supported)

---

## Need Help?

1. Click the **?** icon in the header for in-app help
2. Check the detailed documentation in `README-MODULAR.md`
3. Review implementation notes in `docs/implemented/`

---

**Version:** Modular 1.0  
**Last Updated:** 2025-12-08

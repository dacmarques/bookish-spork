
### 1. Layout & Visual Hierarchy

1.1 Add Header & Basic Layout  
- Add an app header with title and optional status text.  
- Introduce top-level layout structure (`header` + main container with sections).  
- Ensure header is responsive and visually distinct.

1.2 Section Containers & Spacing  
- Wrap Import, Extracted Data, and Row Manager in card-like containers.  
- Apply consistent padding, margins, and headings.  
- Use subtle background/borders to separate sections.

1.3 Collapsible Sections (Progressive Disclosure)  
- Make at least one section (e.g., Debug Info or Row Manager) collapsible.  
- Implement basic toggle interaction with smooth transition.

### 2. Accessibility & Semantics

2.1 Semantic HTML Structure  
- Replace generic `div`s with `header`, `main`, `section`, `aside`, etc. where appropriate.  
- Ensure heading levels (H1–H3) follow a logical hierarchy.

2.2 Focus States & Keyboard Navigation (Phase 1)  
- Implement visible focus styles (2–3px outline using design system colors) for buttons, inputs, and key controls.  
- Verify tab order across main interactive elements.  

2.3 ARIA & Live Regions  
- Add `aria-live="polite"` to dynamic regions (e.g., status messages, extracted data summary).  
- Add `aria-label` or `aria-describedby` to unlabeled controls (drag handles, icons).  

***

### 3. Feedback & Messaging

3.1 Centralized Status/Toast Component  
- Implement a reusable status/toast component (success/error/info) at top or bottom of viewport.  
- Wire it to existing success/error states (e.g., file processed, parsing failed).

3.2 Drag & Drop Visual Feedback  
- Add “drag over” styling for dropzones (border, background, icon change).  
- Ensure feedback works for both drag-over and drag-leave events.

3.3 Disabled & Hover States for Buttons  
- Implement disabled, hover, active, and focus styles for all button variants.  
- Wire disabled state to conditions (e.g., “Process” disabled before file upload).

***

### 4. Data Table UX

4.1 Table Styling & Row Hover  
- Normalize table styles (spacing, borders, typography).  
- Add row hover background and consistent header styling.

4.2 Sticky Table Header  
- Make table header sticky within its scroll container on desktop.  
- Verify behavior for tall data sets.

4.3 Column Alignment & Basic Sorting  
- Right-align numeric columns; left-align text columns.  
- Implement header-click sorting for 1–2 key columns with ▲/▼ indicators.

4.4 Empty State Content  
- Replace bare “Keine Daten vorhanden” with styled empty state (icon/SVG + guidance text).  
- Add brief instructions on how to upload and what to expect.

***

### 5. File Upload & Debugging

5.1 File Upload Feedback  
- Show basic file metadata after selection (name, size, row count if available).  
- Display validation messages (valid/invalid file type).

5.2 “Clear Upload” Action  
- Add a clear/reset button to remove uploaded file(s) and restore initial UI state.  

5.3 Debug Info Section Improvements  
- Wrap debug info in a collapsible panel with monospace font.  
- Add a “Copy debug output” button using `navigator.clipboard.writeText` with success feedback.

***

### 6. Summary & Analytics Lite

6.1 Summary Card for Totals  
- Create a summary card component (icon, large number, label).  
- Surface total sum and 1–2 additional metrics (e.g., row count).

6.2 Processing Indicator  
- Add a simple loading indicator (spinner or progress bar) during file parsing.  
- Tie into existing async processing logic.

***

### 7. Interaction & Micro-Animations

7.1 Button & Toast Micro-interactions  
- Add subtle transitions (150–250ms) for button hover/active states.  
- Animate toast appearance/disappearance (slide/fade).

7.2 Drag Handle UX Polish  
- Add `cursor: grab/grabbing` styles and a small hover effect for drag handles.  
- Optionally show a subtle “ghost row” visual while dragging (visual only, no logic change).

***

### 8. Responsiveness & Touch

8.1 Base Responsive Layout  
- Ensure sections stack cleanly on ~1024px and below.  
- Make table container horizontally scrollable on smaller widths.

8.2 Touch Target Adjustments  
- Increase hit area for drag handles and primary buttons to at least 44×44px on touch viewports.  

***

### 9. Code Quality & Documentation

9.1 Design System Documentation in CSS  
- Add a commented block at top of CSS describing color, spacing, and typography tokens.  

9.2 JS Function Comments  
- Add JSDoc-style comments to core functions (file parsing, table rendering, row management).  

***

### 10. Advanced / Later-Phase Tasks (Split Further When Ready)

Treat each bullet below as something you’ll split again before implementation:

- Advanced filtering & search (global search + simple column filters).  
- Multi-file (Protokoll/Abrechnung) dual-dropzone UI skeleton (no reconciliation logic yet).  
- Basic “Reconciliation View” layout shell (static sample data).  
- Dark mode theme toggle using existing CSS variables.  
- Simple “Load Sample Data” button feeding a small hardcoded dataset into the existing pipeline.

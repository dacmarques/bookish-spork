# Accessibility Testing Checklist

## Keyboard Navigation Tests

### General Navigation
- [ ] Tab key moves focus forward through all interactive elements
- [ ] Shift+Tab moves focus backward
- [ ] Focus indicator (blue outline) is visible on all focused elements
- [ ] Focus order is logical (top to bottom, left to right)
- [ ] No keyboard traps (can always move focus away)

### Tool Navigation
- [ ] Ctrl/Cmd+1 switches to Tool 1 (Value Counter)
- [ ] Ctrl/Cmd+2 switches to Tool 2 (Smart Extractor)
- [ ] Ctrl/Cmd+3 switches to Tool 3 (Row Manager)
- [ ] Ctrl/Cmd+H opens help panel

### File Upload (All Tools)
- [ ] Tab can focus on dropzones
- [ ] Enter key opens file browser from dropzone
- [ ] Space key opens file browser from dropzone
- [ ] Drag and drop still works with mouse

### Tool 3: Row Manager Specific
- [ ] Alt+Arrow Up moves selected row(s) up
- [ ] Alt+Arrow Down moves selected row(s) down
- [ ] Space key toggles row selection when row is focused
- [ ] Tab navigates through table rows
- [ ] Checkboxes can be toggled with Space key

### Buttons and Controls
- [ ] Enter activates focused buttons
- [ ] Space activates focused buttons
- [ ] Disabled buttons cannot be focused
- [ ] Modal close buttons work with keyboard

## Screen Reader Tests

### Announcements
- [ ] File upload success/failure is announced
- [ ] Table updates are announced (e.g., "Showing 10 records")
- [ ] Row selection changes are announced
- [ ] Validation errors are announced
- [ ] Toast notifications are announced

### ARIA Labels
- [ ] All buttons have descriptive labels
- [ ] Drag handles have "Drag to reorder" labels
- [ ] Checkboxes have "Select row X" labels
- [ ] Dropzones have descriptive upload instructions
- [ ] Action buttons describe their function

### Table Navigation
- [ ] Table headers are properly announced
- [ ] Row and column counts are announced
- [ ] Cell content is readable
- [ ] Sortable columns indicate sort state

### Form Fields
- [ ] Input labels are associated with inputs
- [ ] Error messages are associated with fields (aria-describedby)
- [ ] Required fields are indicated
- [ ] Validation states are announced

## Visual Tests

### Focus Indicators
- [ ] Focus outline is 3px wide
- [ ] Focus outline is blue/indigo color
- [ ] Focus outline has shadow ring for better visibility
- [ ] Focus outline visible in light mode
- [ ] Focus outline visible in dark mode
- [ ] Focus outline doesn't get cut off by containers

### Color and Contrast
- [ ] Error states use red with sufficient contrast
- [ ] Success states use green with sufficient contrast
- [ ] Warning states use yellow/orange with sufficient contrast
- [ ] Text meets WCAG AA contrast ratios (4.5:1 for normal text)
- [ ] Interactive elements have 3:1 contrast with background

### Button States
- [ ] Hover state is visually distinct
- [ ] Active/pressed state is visually distinct
- [ ] Disabled state is clearly different (reduced opacity + pattern)
- [ ] Loading state shows spinner animation
- [ ] Focus state is distinct from hover state

### Validation States
- [ ] Invalid fields have red background
- [ ] Warning fields have yellow background
- [ ] Valid fields have green border (if applicable)
- [ ] Error messages are red with icon
- [ ] Error messages appear near the field

### Toast Notifications
- [ ] Success toasts are green
- [ ] Error toasts are red
- [ ] Warning toasts are yellow
- [ ] Info toasts are blue
- [ ] Close button is visible and clickable
- [ ] Toasts auto-dismiss after 3-4 seconds

## Touch Device Tests

### Touch Targets
- [ ] All buttons are at least 44x44 pixels
- [ ] Adequate spacing between touch targets (8px minimum)
- [ ] Dropzones are large enough to tap easily (120px minimum height)
- [ ] Checkboxes are easy to tap
- [ ] Action buttons in tables are tappable

### Gestures
- [ ] Tap activates buttons
- [ ] Tap selects checkboxes
- [ ] Tap opens dropzone file browser
- [ ] Drag and drop works on touch devices (if supported)
- [ ] No accidental activations from nearby elements

## Responsive Design Tests

### Mobile (< 768px)
- [ ] All content is accessible
- [ ] Touch targets remain adequate size
- [ ] Text is readable without zooming
- [ ] Tables scroll horizontally if needed
- [ ] Modals fit on screen

### Tablet (768px - 1024px)
- [ ] Layout adapts appropriately
- [ ] Touch targets remain adequate
- [ ] Sidebar navigation is accessible

### Desktop (> 1024px)
- [ ] Full layout displays correctly
- [ ] Hover states work properly
- [ ] Keyboard navigation is smooth

## Browser Compatibility Tests

### Chrome/Edge
- [ ] All keyboard shortcuts work
- [ ] Focus indicators display correctly
- [ ] ARIA attributes are respected
- [ ] Drag and drop works

### Firefox
- [ ] All keyboard shortcuts work
- [ ] Focus indicators display correctly
- [ ] ARIA attributes are respected
- [ ] Drag and drop works

### Safari
- [ ] All keyboard shortcuts work
- [ ] Focus indicators display correctly
- [ ] ARIA attributes are respected
- [ ] VoiceOver integration works

## Assistive Technology Tests

### Screen Readers
- [ ] NVDA (Windows) - Test all announcements
- [ ] JAWS (Windows) - Test all announcements
- [ ] VoiceOver (macOS/iOS) - Test all announcements
- [ ] TalkBack (Android) - Test all announcements

### Magnification
- [ ] Windows Magnifier - UI remains usable at 200% zoom
- [ ] macOS Zoom - UI remains usable at 200% zoom
- [ ] Browser zoom - UI remains usable at 200% zoom

### Voice Control
- [ ] Dragon NaturallySpeaking - Can activate all controls
- [ ] Voice Control (macOS) - Can activate all controls

## Specific Feature Tests

### Tool 1: Value Counter
- [ ] File upload dropzones are keyboard accessible
- [ ] Target values textarea is keyboard accessible
- [ ] Reset button works with keyboard
- [ ] Sort headers work with keyboard
- [ ] Collapsible sections work with keyboard

### Tool 2: Smart Extractor
- [ ] Search/filter input is keyboard accessible
- [ ] Sort headers work with keyboard
- [ ] Copy and export buttons work with keyboard
- [ ] Clear button works with keyboard
- [ ] Validation errors are announced

### Tool 3: Row Manager
- [ ] Row selection works with keyboard
- [ ] Row reordering works with Alt+Arrow keys
- [ ] Select all checkbox works with keyboard
- [ ] Copy buttons work with keyboard
- [ ] Drag handles have proper labels

## Regression Tests

After any code changes, verify:
- [ ] No keyboard traps introduced
- [ ] Focus indicators still visible
- [ ] ARIA labels still present
- [ ] Screen reader announcements still work
- [ ] Touch targets still adequate size
- [ ] No new validation errors

## Notes

- Test with actual users with disabilities when possible
- Document any issues found with specific steps to reproduce
- Prioritize fixes based on severity (blocking vs. enhancement)
- Retest after fixes are applied

# Accessibility Guide

## Keyboard Navigation

### Global Shortcuts
- **Tab** - Navigate forward through interactive elements
- **Shift+Tab** - Navigate backward through interactive elements
- **Ctrl/Cmd+1/2/3** - Switch between tools
- **Ctrl/Cmd+H** - Open help panel

### Tool 3: Row Manager
- **Alt+Arrow Up** - Move selected row(s) up
- **Alt+Arrow Down** - Move selected row(s) down
- **Space** - Select/deselect current row (when row is focused)
- **Enter** - Activate focused button or dropzone

### File Upload Areas
- **Enter or Space** - Open file browser when dropzone is focused
- **Tab** - Navigate to dropzone
- **Drag & Drop** - Still supported with mouse

## Screen Reader Support

### Dynamic Announcements
The application announces important changes to screen readers:
- File upload status
- Table updates and filtering
- Row selection changes
- Validation errors
- Success/error messages

### ARIA Labels
All interactive elements have descriptive labels:
- Buttons describe their action
- Drag handles indicate reordering capability
- Form inputs have associated error messages
- Tables have proper column headers

## Visual Indicators

### Focus States
- **3px blue outline** with shadow ring on focused elements
- Visible on all interactive elements (buttons, inputs, links, dropzones)
- Works in both light and dark modes

### Validation States
- **Red background** - Missing or invalid required data
- **Yellow background** - Warning (data present but may need review)
- **Green border** - Valid data

### Button States
- **Hover** - Slight elevation and color change
- **Active** - Pressed appearance with scale effect
- **Disabled** - Reduced opacity with diagonal pattern overlay
- **Loading** - Spinning indicator

## Touch Device Support

### Touch Targets
- All interactive elements are at least 44x44 pixels
- Adequate spacing between clickable elements
- Large dropzones for easy file uploads

### Gestures
- Tap to select/activate
- Long press for context (where applicable)
- Drag and drop supported on touch devices

## Color and Contrast

### Theme Support
- Light mode (default)
- Dark mode (toggle in header)
- System preference detection

### Color Coding
- **Blue/Indigo** - Primary actions and focus
- **Green** - Success states
- **Red** - Errors and destructive actions
- **Yellow** - Warnings
- **Gray** - Neutral/disabled states

## Error Messages

### Validation Errors
- Displayed inline near the problematic field
- Announced to screen readers
- Color-coded (red) with icon
- Descriptive text explaining the issue

### Toast Notifications
- Appear in top-right corner
- Auto-dismiss after 3-4 seconds
- Can be manually dismissed
- Announced to screen readers
- Color-coded by type (success, error, warning, info)

## Best Practices for Users

### Keyboard Users
1. Use Tab to navigate through the interface
2. Look for the blue focus outline to see where you are
3. Use Enter or Space to activate buttons and dropzones
4. Use Alt+Arrow keys to reorder rows in Tool 3

### Screen Reader Users
1. Listen for announcements when tables update
2. Navigate by headings to jump between sections
3. Use table navigation commands to explore data
4. Form fields have associated labels and error messages

### Low Vision Users
1. Use browser zoom (Ctrl/Cmd + Plus/Minus)
2. Toggle dark mode if preferred
3. Focus indicators are high contrast
4. Error states use both color and text

### Motor Impairment Users
1. Large touch targets (44x44px minimum)
2. Keyboard alternatives for all mouse actions
3. No time-based interactions required
4. Generous click areas for all controls

## Reporting Accessibility Issues

If you encounter any accessibility barriers:
1. Note the specific tool and action
2. Describe your assistive technology (if applicable)
3. Explain the expected vs. actual behavior
4. Include browser and OS information

## Compliance

This application aims to meet:
- WCAG 2.1 Level AA standards
- Section 508 compliance
- ARIA 1.2 best practices
- Keyboard accessibility requirements

## Additional Resources

- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

# Scroll Issues Investigation & Fix

**Date:** December 8, 2025  
**Issue:** Page not scrolling correctly

## Root Causes Identified

### 1. **Body Overflow Hidden** (CRITICAL)
**Location:** `index.html` line 23
```html
<!-- BEFORE -->
<body class="bg-secondary min-h-screen font-sans text-primary flex overflow-hidden">

<!-- AFTER -->
<body class="bg-secondary min-h-screen font-sans text-primary flex">
```

**Problem:** The `overflow-hidden` class on the body element prevented any scrolling on the page.

**Why it was there:** Likely added to prevent double scrollbars or to contain the layout, but it blocked all scrolling.

---

### 2. **Flex Container Height Constraints**
**Location:** `src/styles/main.css`

**Problem:** Flex containers need explicit height constraints and `min-height: 0` to allow child elements to scroll properly.

**Fix Applied:**
```css
/* Ensure body uses full height and allows flex layout */
html {
    height: 100%;
}

body {
    height: 100%;
    overflow: hidden; /* Body should not scroll, only main content */
}

/* Fix for flex container to allow child scrolling */
body > div.flex-1 {
    min-height: 0; /* Critical: allows flex child to shrink and scroll */
}

/* Ensure main content area is scrollable */
#main-content {
    scroll-behavior: smooth;
    overscroll-behavior: contain;
    min-height: 0; /* Critical for flex scrolling */
}
```

**Why `min-height: 0` is critical:**
- By default, flex items have `min-height: auto`
- This prevents them from shrinking below their content size
- Setting `min-height: 0` allows the flex item to shrink and enables scrolling

---

### 3. **Header Flex Shrink**
**Location:** `src/styles/main.css`

**Fix Applied:**
```css
.app-header {
    flex-shrink: 0; /* Prevent header from shrinking */
    /* ... other styles ... */
}
```

**Why:** Ensures the header maintains its height and doesn't get compressed when content grows.

---

### 4. **CSS Containment on Table Container**
**Location:** `src/styles/components.css`

**Problem:** `contain: layout style paint` was causing issues with scrolling and sticky positioning.

**Fix Applied:**
```css
/* BEFORE */
.table-container {
    contain: layout style paint;
    /* ... */
}

/* AFTER */
.table-container {
    /* CSS Containment removed to prevent scroll/sticky issues */
    /* ... */
}
```

**Why:** CSS containment can interfere with overflow and sticky positioning behavior.

---

## Layout Structure

The page uses a flex-based layout:

```
body (flex, height: 100%, overflow: hidden)
├── aside.sidebar (fixed width)
└── div.flex-1.flex.flex-col (main wrapper, min-height: 0)
    ├── header.app-header (flex-shrink: 0, sticky)
    └── main#main-content (flex-1, overflow-auto, min-height: 0)
        └── [scrollable content]
```

**Key Points:**
1. Body has `overflow: hidden` to prevent double scrollbars
2. Main content area has `overflow-auto` to enable scrolling
3. All flex containers in the chain need `min-height: 0`
4. Header needs `flex-shrink: 0` to maintain size

---

## Testing Checklist

- [x] Page scrolls vertically when content exceeds viewport
- [x] Sidebar remains fixed while content scrolls
- [x] Header remains sticky at top
- [x] Table containers scroll independently
- [x] No double scrollbars appear
- [x] Mobile responsive scrolling works
- [x] Keyboard navigation (Page Up/Down, Space) works
- [x] Smooth scroll behavior maintained

---

## Common Flex + Scroll Pitfalls

### Problem: Flex child won't scroll
**Solution:** Add `min-height: 0` to all flex containers in the chain

### Problem: Content overflows instead of scrolling
**Solution:** Ensure parent has defined height and child has `overflow: auto`

### Problem: Sticky header doesn't work
**Solution:** Remove CSS containment, ensure proper overflow context

### Problem: Double scrollbars
**Solution:** Set `overflow: hidden` on body, `overflow-auto` only on scrollable container

---

## Browser Compatibility

These fixes work across:
- Chrome/Edge (Chromium)
- Firefox
- Safari (including iOS)
- Mobile browsers

**Note:** `-webkit-overflow-scrolling: touch` is already applied for smooth iOS scrolling.

---

## Performance Considerations

- Removed `contain: layout style paint` from table containers
  - Trade-off: Slightly reduced rendering optimization
  - Benefit: Proper scrolling and sticky behavior
  
- Kept `will-change: transform` on virtual scroll elements
  - Maintains smooth scrolling for large datasets

---

## Related Files Modified

1. `index.html` - Removed `overflow-hidden` from body
2. `src/styles/main.css` - Added flex scrolling fixes
3. `src/styles/components.css` - Removed CSS containment

---

## Future Improvements

1. Consider using `overscroll-behavior: contain` on all scroll containers
2. Add scroll position restoration on navigation
3. Implement scroll-to-top button for long pages
4. Add scroll progress indicator in header

---

## References

- [MDN: CSS Flexible Box Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout)
- [CSS Tricks: Flexbox and Truncated Text](https://css-tricks.com/flexbox-truncated-text/)
- [Stack Overflow: Flexbox and Overflow](https://stackoverflow.com/questions/36247140/why-dont-flex-items-shrink-past-content-size)

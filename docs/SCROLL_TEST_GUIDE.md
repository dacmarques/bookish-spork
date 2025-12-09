# Scroll Testing Guide

## Quick Visual Tests

### 1. Basic Page Scroll
1. Open the application in a browser
2. Resize window to be shorter than content
3. **Expected:** Vertical scrollbar appears on main content area
4. **Expected:** Page scrolls smoothly when using mouse wheel or scrollbar
5. **Expected:** Sidebar remains fixed during scroll

### 2. Keyboard Navigation
1. Click anywhere in the main content
2. Press `Space` or `Page Down`
3. **Expected:** Page scrolls down
4. Press `Page Up`
5. **Expected:** Page scrolls up
6. Press `Home`
7. **Expected:** Scrolls to top
8. Press `End`
9. **Expected:** Scrolls to bottom

### 3. Header Behavior
1. Scroll down the page
2. **Expected:** Header remains visible at top (sticky)
3. **Expected:** Header doesn't scroll with content

### 4. Table Scrolling
1. Navigate to a tool with tables (Tool 2 or Tool 3)
2. Load data to populate table
3. **Expected:** Table has its own scrollbar if content exceeds container
4. **Expected:** Table scrolls independently from page
5. **Expected:** Table headers remain sticky when scrolling table

### 5. Mobile Responsive
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Select mobile device (e.g., iPhone 12)
4. **Expected:** Page scrolls smoothly on mobile
5. **Expected:** Touch scrolling works (if testing on actual device)
6. **Expected:** No horizontal scrollbar on page (only on tables if needed)

### 6. Section Groups
1. Scroll through different section groups
2. **Expected:** Each section is fully visible when scrolled to
3. **Expected:** No content is cut off or hidden
4. **Expected:** Collapsible sections work without scroll issues

### 7. Modal/Overlay Behavior
1. Open a modal (Help or Settings)
2. **Expected:** Background content doesn't scroll
3. **Expected:** Modal content scrolls if it exceeds viewport
4. Close modal
5. **Expected:** Page scroll position is maintained

### 8. Browser Compatibility
Test in multiple browsers:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile browsers

## Common Issues to Watch For

### ❌ Double Scrollbars
- If you see two vertical scrollbars (one on body, one on main), there's an issue
- Should only see one scrollbar on the main content area

### ❌ Content Cut Off
- If content is hidden or cut off at the bottom, flex height constraints may be wrong
- Check that all content is accessible by scrolling

### ❌ Sticky Header Not Working
- If header scrolls away with content, sticky positioning is broken
- Check for CSS containment or overflow issues

### ❌ Jerky Scrolling
- If scrolling is not smooth, check for:
  - Missing `scroll-behavior: smooth`
  - Heavy JavaScript during scroll events
  - Missing `-webkit-overflow-scrolling: touch` on iOS

### ❌ Can't Scroll at All
- If page doesn't scroll, check:
  - `overflow: hidden` on wrong elements
  - Missing `overflow: auto` on main content
  - Flex container height issues

## Developer Tools Inspection

### Check Computed Styles
1. Open DevTools (F12)
2. Select `<body>` element
3. Check computed styles:
   - `height: 100%` ✓
   - `overflow: hidden` ✓
   
4. Select `<main id="main-content">` element
5. Check computed styles:
   - `overflow-y: auto` ✓
   - `flex: 1` ✓
   - `min-height: 0` ✓

### Check Scroll Container
```javascript
// Run in console to identify scroll container
function findScrollParent(element) {
    let parent = element.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const overflow = style.overflow + style.overflowY;
        if (/(auto|scroll)/.test(overflow) && parent.scrollHeight > parent.clientHeight) {
            console.log('Scroll parent:', parent);
            return parent;
        }
        parent = parent.parentElement;
    }
    return null;
}

// Test it
findScrollParent(document.querySelector('#main-content'));
// Should return: <main id="main-content">
```

### Measure Scroll Performance
```javascript
// Run in console to test scroll performance
let lastScrollTime = Date.now();
document.querySelector('#main-content').addEventListener('scroll', () => {
    const now = Date.now();
    const delta = now - lastScrollTime;
    console.log(`Scroll event fired after ${delta}ms`);
    lastScrollTime = now;
});
// Scroll and watch console - should see smooth, frequent updates
```

## Automated Testing (Future)

Consider adding these automated tests:

```javascript
// Example Playwright test
test('page should scroll', async ({ page }) => {
    await page.goto('/');
    
    // Get initial scroll position
    const initialScroll = await page.evaluate(() => 
        document.querySelector('#main-content').scrollTop
    );
    
    // Scroll down
    await page.evaluate(() => 
        document.querySelector('#main-content').scrollBy(0, 500)
    );
    
    // Check scroll position changed
    const newScroll = await page.evaluate(() => 
        document.querySelector('#main-content').scrollTop
    );
    
    expect(newScroll).toBeGreaterThan(initialScroll);
});
```

## Sign-Off Checklist

Before considering scroll issues resolved:

- [ ] Page scrolls smoothly in all major browsers
- [ ] Keyboard navigation works (Space, Page Up/Down, Home, End)
- [ ] Mobile scrolling works on actual devices
- [ ] No double scrollbars appear
- [ ] Header remains sticky during scroll
- [ ] Tables scroll independently
- [ ] No content is cut off or inaccessible
- [ ] Scroll position is maintained during navigation
- [ ] Performance is acceptable (no lag or jank)
- [ ] Accessibility tools can navigate content

## Rollback Plan

If issues persist, revert these changes:

1. `index.html` - Add back `overflow-hidden` to body
2. `src/styles/main.css` - Remove flex scrolling fixes
3. `src/styles/components.css` - Add back CSS containment

Then investigate alternative solutions:
- Use `position: fixed` layout instead of flex
- Implement custom scroll container
- Use JavaScript-based scroll management

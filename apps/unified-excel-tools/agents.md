# Local Web Application Architecture Guide

## Overview

This guide covers refactoring a monolithic 4k-line HTML file into a modular, maintainable local web application using XAMPP portable on Windows.

---

## Setup: XAMPP Portable

### Installation

1. **Download XAMPP Portable** from [apachefriends.org](https://www.apachefriends.org)
2. **Extract** to a folder (e.g., `C:\xampp-portable` or `D:\dev\xampp`)
3. **No installation required** – it's truly portable and can run from USB

### Starting the Server

1. Run `xampp-control.exe` from the extracted folder
2. Click **"Start"** next to Apache
3. (MySQL is optional – skip if your app is client-side only)
4. Access your app at `http://localhost/`

### Stopping the Server

- Click **"Stop"** next to Apache in the control panel
- Close the window when done

---

## Project Structure

Organize your refactored application like this:

```
htdocs/
├── index.html                 # Main entry point (minimal shell)
├── src/
│   ├── main.js               # Bootstrap & initialization
│   ├── modules/
│   │   ├── state.js          # State management / data
│   │   ├── handlers.js       # Event listeners & user interactions
│   │   ├── renderer.js       # DOM rendering & UI updates
│   │   ├── storage.js        # localStorage / sessionStorage
│   │   ├── utils.js          # Helper functions
│   │   └── api.js            # Data fetching / local API calls
│   └── styles/
│       ├── main.css          # Global styles
│       ├── components.css    # Component-specific styles
│       └── layout.css        # Layout & grid
└── assets/
    ├── data.json             # Local data files
    └── config.json           # Configuration
```

---

## Refactoring Strategy

### Phase 1: Extract State Management

**File: `src/modules/state.js`**

```javascript
// Centralized application state
export const state = {
  items: [],
  settings: {},
  ui: {
    isLoading: false,
    selectedId: null,
  },
};

export function updateState(key, value) {
  state[key] = value;
  // Notify listeners
  window.dispatchEvent(new CustomEvent('stateChanged', { detail: state }));
}

export function getState(key) {
  return state[key];
}
```

### Phase 2: Extract Event Handlers

**File: `src/modules/handlers.js`**

```javascript
import { state, updateState } from './state.js';
import { render } from './renderer.js';

export function initializeHandlers() {
  document.addEventListener('click', handleClick);
  document.addEventListener('input', handleInput);
  document.addEventListener('submit', handleSubmit);
}

function handleClick(event) {
  const { target } = event;
  if (target.matches('[data-action="add"]')) {
    handleAddItem();
  }
  if (target.matches('[data-action="delete"]')) {
    handleDeleteItem(target.dataset.id);
  }
}

function handleInput(event) {
  const { target } = event;
  if (target.matches('[data-field]')) {
    updateState(target.dataset.field, target.value);
  }
}

function handleSubmit(event) {
  event.preventDefault();
  // Handle form submission
}

function handleAddItem() {
  state.items.push({ id: Date.now(), text: '', created: new Date() });
  render();
}

function handleDeleteItem(id) {
  state.items = state.items.filter(item => item.id !== parseInt(id));
  render();
}
```

### Phase 3: Extract Rendering Logic

**File: `src/modules/renderer.js`**

```javascript
import { state } from './state.js';

export function render() {
  const container = document.getElementById('app');
  container.innerHTML = renderItems();
}

function renderItems() {
  return state.items.map(item => `
    <div class="item" data-id="${item.id}">
      <span>${item.text}</span>
      <button data-action="delete" data-id="${item.id}">Delete</button>
    </div>
  `).join('');
}

export function renderUI(section) {
  switch (section) {
    case 'items':
      render();
      break;
    case 'settings':
      renderSettings();
      break;
  }
}

function renderSettings() {
  // Render settings UI
}
```

### Phase 4: Extract Utilities

**File: `src/modules/utils.js`**

```javascript
// Date formatting
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}

// Validation
export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// LocalStorage helpers
export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadFromStorage(key) {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

// Debounce
export function debounce(fn, delay = 300) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
```

### Phase 5: Main Bootstrap File

**File: `src/main.js`**

```javascript
import { state, updateState } from './modules/state.js';
import { initializeHandlers } from './modules/handlers.js';
import { render } from './modules/renderer.js';
import { loadFromStorage, saveToStorage } from './modules/utils.js';

export function initializeApp() {
  console.log('🚀 Application starting...');
  
  // Load persisted state
  const savedState = loadFromStorage('appState');
  if (savedState) {
    Object.assign(state, savedState);
  }
  
  // Initialize event listeners
  initializeHandlers();
  
  // Initial render
  render();
  
  // Save state on changes
  window.addEventListener('stateChanged', () => {
    saveToStorage('appState', state);
  });
  
  console.log('✅ Application ready');
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
```

### Phase 6: Minimal HTML Shell

**File: `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local App</title>
  <link rel="stylesheet" href="src/styles/main.css">
  <link rel="stylesheet" href="src/styles/components.css">
</head>
<body>
  <div id="app" class="container">
    <!-- App content renders here -->
  </div>

  <script type="module" src="src/main.js"></script>
</body>
</html>
```

---

## Key Benefits

| Aspect | Before (Monolith) | After (Modular) |
|--------|-------------------|-----------------|
| **File Size** | 4000+ lines | 500-800 lines each |
| **Maintainability** | Hard to locate bugs | Clear module responsibility |
| **Reusability** | Copy-paste code | Import & compose |
| **Testing** | Difficult | Easy to test modules |
| **Onboarding** | Steep learning curve | Clear structure |
| **Scalability** | Degrades rapidly | Grows cleanly |

---

## Development Workflow

### 1. Start XAMPP
```bash
# Run xampp-control.exe and click "Start" on Apache
# App runs at http://localhost/
```

### 2. Edit Files
- Edit `.js`, `.css`, or `.html` files in your editor
- Save the file
- Refresh browser (`F5` or `Ctrl+R`)

### 3. Debug
- Open **DevTools** (`F12`)
- Check Console for errors
- Use `console.log()` in your modules
- Inspect Elements to verify DOM structure

### 4. Save State
- State persists to `localStorage` automatically
- Survives page refresh
- Clear with `localStorage.clear()` in console if needed

---

## Advanced: Adding a Build Step (Optional)

If your app grows further, consider a build tool to bundle multiple files into one:

### Using esbuild

1. **Install** (requires Node.js):
   ```bash
   npm install --save-dev esbuild
   ```

2. **Create build script** in `package.json`:
   ```json
   {
     "scripts": {
       "build": "esbuild src/main.js --bundle --outfile=dist/app.js --format=esm"
     }
   }
   ```

3. **Run before deploying**:
   ```bash
   npm run build
   ```

4. **Load bundled file** in HTML:
   ```html
   <script type="module" src="dist/app.js"></script>
   ```

---

## Best Practices

### ✅ Do

- **One module = one responsibility** (single-concern principle)
- **Export functions and constants** clearly
- **Use descriptive names** (`renderItemList` not `render2`)
- **Keep modules under 300 lines** each
- **Use comments** for complex logic
- **Test modules independently** in DevTools console

### ❌ Don't

- **Mix concerns** (don't put rendering logic in state management)
- **Create circular imports** (A imports B, B imports A)
- **Use global variables** (use state management instead)
- **Ignore error handling** (use try-catch where needed)
- **Make modules too specific** (keep them reusable)

---

## Troubleshooting

### Issue: "Module not found" error
**Solution:** Check file path in import statement. Use `./` for relative paths.

### Issue: CORS error
**Solution:** Ensure XAMPP Apache is running. Files must be in `htdocs/`.

### Issue: State not persisting
**Solution:** Verify `localStorage` is enabled. Check browser DevTools Storage tab.

### Issue: Event listeners not working
**Solution:** Ensure `initializeHandlers()` is called after DOM is loaded.

### Issue: CSS not updating
**Solution:** Hard refresh browser (`Ctrl+Shift+R` or clear cache in DevTools).

---

## Example: Converting a Simple Feature

### Before (4k-line monolith)
```html
<script>
  // 1500 lines of mixed concerns
  let todoItems = [];
  
  function addTodo() {
    const input = document.getElementById('todoInput');
    todoItems.push(input.value);
    input.value = '';
    renderTodos();
  }
  
  function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = todoItems.map((item, i) => `
      <li><span>${item}</span><button onclick="deleteTodo(${i})">Delete</button></li>
    `).join('');
  }
  
  function deleteTodo(index) {
    todoItems.splice(index, 1);
    renderTodos();
  }
  
  // ... thousands more lines
</script>
```

### After (Modular)

**`src/modules/todos.js`**
```javascript
export const todos = { items: [] };

export function addTodo(text) {
  todos.items.push({ id: Date.now(), text, done: false });
}

export function deleteTodo(id) {
  todos.items = todos.items.filter(t => t.id !== id);
}

export function toggleTodo(id) {
  const todo = todos.items.find(t => t.id === id);
  if (todo) todo.done = !todo.done;
}
```

**`src/modules/todoRenderer.js`**
```javascript
import { todos } from './todos.js';

export function renderTodos() {
  return todos.items.map(item => `
    <li class="${item.done ? 'done' : ''}">
      <span>${item.text}</span>
      <button data-action="delete" data-id="${item.id}">Delete</button>
    </li>
  `).join('');
}
```

**`src/modules/todoHandlers.js`**
```javascript
import { addTodo, deleteTodo } from './todos.js';
import { renderTodos } from './todoRenderer.js';

export function initTodoHandlers() {
  document.getElementById('addBtn').addEventListener('click', () => {
    const input = document.getElementById('todoInput');
    addTodo(input.value);
    input.value = '';
    render();
  });
}

function render() {
  document.getElementById('todoList').innerHTML = renderTodos();
}
```

---

## Next Steps

1. **Identify major features** in your monolith (state, rendering, events)
2. **Create module files** for each feature
3. **Extract code** from monolith into modules
4. **Test each module** independently
5. **Remove original code** from monolith
6. **Keep `index.html` minimal** – only imports and DOM shell
7. **Run on XAMPP** – no build step needed

---

## Resources

- **XAMPP Download:** https://www.apachefriends.org
- **ES Modules (MDN):** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
- **Web Components:** https://developer.mozilla.org/en-US/docs/Web/Web_Components
- **esbuild:** https://esbuild.github.io

---

**Happy refactoring! 🚀**

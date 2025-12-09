# Excel Tools Suite - Modular Architecture

## Overview

This is a refactored version of the monolithic Excel Tools application, now organized into a clean, modular architecture following modern JavaScript best practices.

## Project Structure

```
├── index-modular.html          # Minimal HTML shell (entry point)
├── src/
│   ├── main.js                 # Application bootstrap
│   ├── modules/
│   │   ├── state.js            # Centralized state management
│   │   ├── handlers.js         # Event handlers
│   │   ├── utils.js            # Utility functions
│   │   ├── toast.js            # Toast notification system
│   │   ├── navigation.js       # Tab navigation
│   │   ├── theme.js            # Dark mode management
│   │   ├── sections.js         # Collapsible sections
│   │   ├── modals.js           # Modal dialogs
│   │   ├── ui.js               # UI initialization
│   │   ├── scroll.js           # Scroll indicators
│   │   ├── activity.js         # Activity tracking
│   │   ├── header.js           # Global header
│   │   ├── uploadHistory.js    # Upload history management
│   │   ├── tool1/              # Tool 1: Value Counter
│   │   │   ├── fileProcessor.js
│   │   │   ├── metadata.js
│   │   │   ├── analyzer.js
│   │   │   └── renderer.js
│   │   ├── tool2/              # Tool 2: Smart Extractor
│   │   │   └── handlers.js
│   │   └── tool3/              # Tool 3: Row Manager
│   │       └── handlers.js
│   └── styles/
│       ├── main.css            # Global styles & variables
│       └── components.css      # Component-specific styles
```

## Key Features

### Modular Architecture
- **Single Responsibility**: Each module handles one specific concern
- **ES6 Modules**: Native JavaScript modules with import/export
- **No Build Step Required**: Runs directly in modern browsers
- **Easy Testing**: Modules can be tested independently

### Enhanced Data Persistence ✨ NEW
- **Quota Management**: Automatic cleanup when storage is full
- **IndexedDB Support**: Store large files (50MB+) without localStorage limits
- **Work Sessions**: Save and restore complete work sessions
- **Auto-Save**: Background saves every 5 minutes
- **Storage Monitor**: Visual usage tracking and management tools
- See `docs/STORAGE_ENHANCEMENTS.md` for full details

### State Management
- Centralized application state in `state.js`
- Event-driven updates with `stateChanged` events
- Persistent state with robust storage management
- Map and Set serialization support

### Clean Separation of Concerns
- **State**: Data management (`state.js`)
- **Handlers**: User interactions (`handlers.js`)
- **Rendering**: UI updates (tool-specific renderers)
- **Utilities**: Reusable helpers (`utils.js`)
- **Storage**: Enhanced persistence layer (`storage.js`, `indexedDB.js`)

## Running the Application

### Option 1: XAMPP Portable (Recommended)

1. Download and extract XAMPP Portable
2. Copy project files to `htdocs/` folder
3. Run `xampp-control.exe` and start Apache
4. Open `http://localhost/index-modular.html`

### Option 2: Any Local Server

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

Then open `http://localhost:8000/index-modular.html`

## Development Workflow

### 1. Edit Files
- Modify JavaScript modules in `src/modules/`
- Update styles in `src/styles/`
- No compilation needed!

### 2. Refresh Browser
- Save your changes
- Press `F5` or `Ctrl+R` to reload
- Changes appear immediately

### 3. Debug
- Open DevTools (`F12`)
- Check Console for errors
- Use browser debugger with source maps

## Module Documentation

### Core Modules

#### `state.js`
Manages application state with persistence.

```javascript
import { state, updateState, getState } from './modules/state.js';

// Update state
updateState('tool1.currentTargets', ['Montage', 'Demontage']);

// Get state
const targets = getState('tool1.currentTargets');
```

#### `handlers.js`
Centralizes all event listeners.

```javascript
import { initializeHandlers } from './modules/handlers.js';

// Initialize all handlers
initializeHandlers();
```

#### `utils.js`
Provides reusable utility functions.

```javascript
import { debounce, formatFileSize, saveToStorage } from './modules/utils.js';

// Debounce function
const debouncedSearch = debounce(searchFunction, 300);

// Format file size
const size = formatFileSize(1024000); // "1 MB"
```

#### `toast.js`
Shows user notifications.

```javascript
import { showSuccess, showError, showWarning } from './modules/toast.js';

showSuccess('File uploaded successfully!');
showError('Failed to process file');
```

### Tool-Specific Modules

#### Tool 1: Value Counter
- `fileProcessor.js`: Handles Excel file reading
- `metadata.js`: Displays file information
- `analyzer.js`: Extracts header data
- `renderer.js`: Renders results table

#### Tool 2: Smart Extractor
- `fileProcessor.js`: Multi-file upload and Excel reading
- `analyzer.js`: Flexible data extraction and parsing
- `renderer.js`: Table rendering with sort/filter/export
- `handlers.js`: Event coordination

#### Tool 3: Row Manager
- `fileProcessor.js`: Excel file reading
- `renderer.js`: Table rendering with drag-drop UI
- `selection.js`: Multi-select and range selection
- `dragDrop.js`: Drag-and-drop row reordering
- `handlers.js`: Event coordination

## Benefits Over Monolithic Version

| Aspect | Monolithic (5846 lines) | Modular |
|--------|-------------------------|---------|
| **File Size** | 1 huge file | 20+ focused files (200-300 lines each) |
| **Maintainability** | Hard to navigate | Clear module responsibility |
| **Reusability** | Copy-paste code | Import & compose |
| **Testing** | Difficult | Easy to test modules |
| **Onboarding** | Steep learning curve | Clear structure |
| **Scalability** | Degrades rapidly | Grows cleanly |
| **Debugging** | Find needle in haystack | Isolated concerns |

## Adding New Features

### Example: Adding a New Tool

1. Create tool folder: `src/modules/tool4/`
2. Add handlers: `src/modules/tool4/handlers.js`
3. Register in `handlers.js`:
   ```javascript
   import { setupTool4Handlers } from './tool4/handlers.js';
   setupTool4Handlers();
   ```
4. Add UI in `index-modular.html`
5. Add navigation button

### Example: Adding a New Utility

1. Add function to `utils.js`:
   ```javascript
   export function myNewUtility(param) {
       // Implementation
   }
   ```
2. Import where needed:
   ```javascript
   import { myNewUtility } from './modules/utils.js';
   ```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (14+)
- IE11: ❌ Not supported (requires ES6 modules)

## Performance Optimizations

- **Lazy Loading**: Modules load on-demand
- **Event Delegation**: Efficient event handling
- **Debouncing/Throttling**: Optimized scroll and input handlers
- **RequestAnimationFrame**: Smooth UI updates
- **DocumentFragment**: Batch DOM updates

## Keyboard Shortcuts

- `Ctrl/Cmd + 1/2/3`: Switch between tools
- `Ctrl/Cmd + H`: Toggle help panel

## Next Steps

1. ✅ Core architecture refactored
2. ✅ Tool 1 (Value Counter) fully implemented
3. ✅ Tool 2 (Smart Extractor) fully implemented
4. ✅ Tool 3 (Row Manager) fully implemented
5. 📝 Add comprehensive tests
6. 📝 Add more documentation
7. 📝 Performance optimization

## Migration from Monolithic Version

The original `index.html` (5846 lines) remains unchanged. The new modular version is in `index-modular.html`. Both versions can coexist during migration.

To migrate:
1. Test modular version thoroughly
2. Verify all features work
3. Rename `index.html` to `index-legacy.html`
4. Rename `index-modular.html` to `index.html`

## Contributing

When adding new features:
1. Keep modules under 300 lines
2. Follow single responsibility principle
3. Export functions explicitly
4. Add JSDoc comments
5. Test independently

## License

Same as original project.

## Support

For issues or questions, refer to the original documentation or create an issue.

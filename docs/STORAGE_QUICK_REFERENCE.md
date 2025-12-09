# Storage Enhancements - Quick Reference

## 🚀 Quick Start

### Basic Usage

```javascript
// Import storage manager
import { localStorageManager } from './modules/storage.js';

// Save with auto-cleanup
localStorageManager.setItem('myData', data, { autoCleanup: true });

// Get with default
const data = localStorageManager.getItem('myData', {});

// Check storage usage
const stats = localStorageManager.getStatistics();
console.log(`${stats.usage.percentage.toFixed(1)}% full`);
```

### Save/Restore Work Sessions

```javascript
import { saveWorkSession, restoreWorkSession, showSessionManager } from './modules/workSessionManager.js';

// Save current work
await saveWorkSession('My Session');

// Restore previous work
await restoreWorkSession('session_1234567890');

// Show session manager UI
await showSessionManager();
```

### Monitor Storage

```javascript
import { renderStorageInfo } from './modules/storageMonitor.js';

// Render storage panel
await renderStorageInfo('storageInfo');
```

---

## 📊 Key Features

### 1. Quota Management
- ✅ Real-time monitoring
- ✅ Auto-cleanup when full
- ✅ Warnings at 80%
- ✅ Graceful error handling

### 2. IndexedDB Support
- ✅ Store files up to 50MB+
- ✅ Auto-cleanup (7 days)
- ✅ Work session storage
- ✅ No localStorage limits

### 3. Work Sessions
- ✅ Save complete state
- ✅ Auto-save every 5 minutes
- ✅ Export to .json files
- ✅ Named sessions

### 4. Storage Monitor
- ✅ Visual progress bars
- ✅ Detailed statistics
- ✅ File browser
- ✅ One-click cleanup

---

## 🔧 Common Tasks

### Check Storage Usage
```javascript
const stats = localStorageManager.getStatistics();
console.log('Items:', stats.totalItems);
console.log('Used:', stats.usage.usedMB + 'MB');
console.log('Percentage:', stats.usage.percentage.toFixed(1) + '%');
```

### Clear Old Data
```javascript
import { clearOldStorageData } from './modules/storageMonitor.js';
await clearOldStorageData();
```

### Save Current Work
```javascript
import { saveWorkSession } from './modules/workSessionManager.js';
await saveWorkSession('Before big changes');
```

### List All Sessions
```javascript
import { listWorkSessions } from './modules/workSessionManager.js';
const sessions = await listWorkSessions();
sessions.forEach(s => console.log(s.name, '-', s.timestamp));
```

### Export Session to File
```javascript
import { exportSessionToFile } from './modules/workSessionManager.js';
await exportSessionToFile('session_id_here');
```

### Import Session from File
```javascript
import { importSessionFromFile } from './modules/workSessionManager.js';
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    await importSessionFromFile(file);
});
```

---

## ⚠️ Important Notes

### localStorage Limits
- **Max Size:** 5-10MB (browser dependent)
- **Quota Warning:** Triggered at 80%
- **Auto-Cleanup:** Removes oldest 20% when full

### IndexedDB Limits
- **Max Size:** 50MB-2GB (browser dependent)
- **Auto-Cleanup:** Files >7 days, sessions >30 days
- **Unavailable in:** Private/incognito mode (some browsers)

### Auto-Save
- **Frequency:** Every 5 minutes (configurable)
- **Trigger:** Only when data exists
- **Storage:** IndexedDB (not localStorage)

---

## 🎯 Best Practices

### 1. Always Use Auto-Cleanup
```javascript
// Good ✅
localStorageManager.setItem('key', data, { autoCleanup: true });

// Risky ❌
localStorage.setItem('key', JSON.stringify(data));
```

### 2. Check Results
```javascript
const result = localStorageManager.setItem('key', data);
if (!result.success) {
    console.error('Storage failed:', result.error);
}
```

### 3. Use IndexedDB for Large Data
```javascript
// For Excel files, large datasets
import { idbManager } from './modules/indexedDB.js';
await idbManager.saveFile('protokoll_123', largeData, 'protokoll');
```

### 4. Save Sessions Before Major Changes
```javascript
// Before reconciliation, imports, etc.
await saveWorkSession('Before reconciliation');
// ... do risky operation ...
```

### 5. Monitor Storage Regularly
```javascript
// Add to settings page
<div id="storageInfo"></div>

// Render on settings load
await renderStorageInfo('storageInfo');
```

---

## 🐛 Troubleshooting

### Storage Full Error
```javascript
// Check what's using space
const items = localStorageManager.getAllItems();
items.sort((a, b) => b.size - a.size);
console.log('Largest items:', items.slice(0, 5));

// Manual cleanup
localStorageManager.cleanup('size'); // Remove largest
```

### Session Not Restoring
```javascript
// Check if session exists
const sessions = await listWorkSessions();
console.log('Available sessions:', sessions);

// Check for errors
try {
    await restoreWorkSession('session_id');
} catch (e) {
    console.error('Restore failed:', e);
}
```

### IndexedDB Not Working
```javascript
// Check if available
if (!window.indexedDB) {
    console.error('IndexedDB not supported');
}

// Check initialization
try {
    await idbManager.init();
    console.log('IndexedDB initialized');
} catch (e) {
    console.error('IndexedDB init failed:', e);
}
```

---

## 🔔 Events to Listen For

### Storage Warnings
```javascript
window.addEventListener('storageWarning', (e) => {
    alert(`Storage ${e.detail.usage.toFixed(0)}% full! Please clear old data.`);
});
```

### Storage Full
```javascript
window.addEventListener('storageQuotaExceeded', (e) => {
    alert('Storage full! Cleaning up old data...');
    clearOldStorageData();
});
```

### Session Saved
```javascript
window.addEventListener('workSessionSaved', (e) => {
    console.log('Session saved:', e.detail.id);
});
```

---

## 📦 File Structure

```
src/modules/
├── storage.js              # Enhanced storage manager
├── indexedDB.js            # IndexedDB for large data
├── storageMonitor.js       # UI for monitoring
└── workSessionManager.js   # Session save/restore
```

---

## ⚡ Performance Tips

1. **Batch Updates:** Save once after multiple changes, not after each change
2. **Use IndexedDB:** For files >1MB, use IndexedDB instead of localStorage
3. **Cleanup Regularly:** Run cleanup weekly in production
4. **Monitor Usage:** Add storage panel to settings for visibility
5. **Limit History:** Keep audit trail, upload history under limits

---

## 🎓 Learn More

- Full documentation: `docs/STORAGE_ENHANCEMENTS.md`
- Architecture guide: `agents.md`
- Code examples: Check the module source files

---

**Need Help?**
- Check console for detailed error messages
- Use `localStorageManager.getStatistics()` to debug
- Call `showStorageDetails()` to see all stored items

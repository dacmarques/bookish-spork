/**
 * Audit Trail Module
 * Logs all user actions (imports, modifications, exports) with timestamps
 */

export class AuditEntry {
  constructor(action, details, userId = 'user') {
    this.id = generateAuditId();
    this.timestamp = new Date();
    this.action = action; // 'import', 'edit', 'delete', 'export', 'validation'
    this.details = details;
    this.userId = userId;
  }

  toString() {
    const time = this.timestamp.toLocaleString('de-DE');
    return `[${time}] ${this.action}: ${this.details}`;
  }
}

// Audit trail storage
let auditLog = [];
let maxEntries = 1000; // Keep last 1000 entries

/**
 * Initialize audit trail
 */
export function initializeAuditTrail(options = {}) {
  if (options.maxEntries) {
    maxEntries = options.maxEntries;
  }

  // Try to load from localStorage
  try {
    const stored = localStorage.getItem('auditTrail');
    if (stored) {
      const parsed = JSON.parse(stored);
      auditLog = parsed.map(entry => Object.assign(new AuditEntry(), entry));
    }
  } catch (e) {
    console.warn('Could not load audit trail from localStorage:', e);
  }

  // Listen for page unload to save
  window.addEventListener('beforeunload', () => {
    saveAuditTrail();
  });
}

/**
 * Log an action to the audit trail
 */
export function logAction(action, details) {
  const entry = new AuditEntry(action, details);
  auditLog.unshift(entry); // Add to beginning
  
  // Trim if exceeds max
  if (auditLog.length > maxEntries) {
    auditLog = auditLog.slice(0, maxEntries);
  }

  // Save to localStorage
  saveAuditTrail();
  
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent('auditTrailUpdated', { 
    detail: { entry, log: auditLog } 
  }));

  return entry;
}

/**
 * Log file import
 */
export function logImport(fileName, rowCount, tool = 'unknown') {
  return logAction('import', `Datei "${fileName}" importiert (${rowCount} Zeilen) - ${tool}`);
}

/**
 * Log data modification
 */
export function logEdit(rowId, field, oldValue, newValue) {
  const detail = `Zeile ${rowId}: "${field}" geändert von "${oldValue}" zu "${newValue}"`;
  return logAction('edit', detail);
}

/**
 * Log row deletion
 */
export function logDelete(rowId, rowData) {
  const summary = Object.entries(rowData)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return logAction('delete', `Zeile ${rowId} gelöscht (${summary}...)`);
}

/**
 * Log row addition
 */
export function logAdd(rowData) {
  const summary = Object.entries(rowData)
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  return logAction('add', `Neue Zeile hinzugefügt (${summary}...)`);
}

/**
 * Log data export
 */
export function logExport(format, rowCount) {
  return logAction('export', `Daten exportiert (${format}, ${rowCount} Zeilen)`);
}

/**
 * Log validation events
 */
export function logValidation(fileName, errorCount, warningCount) {
  return logAction('validation', `"${fileName}" validiert: ${errorCount} Fehler, ${warningCount} Warnungen`);
}

/**
 * Log batch operations
 */
export function logBatchOperation(operation, count) {
  return logAction('batch', `${operation} auf ${count} Zeilen angewendet`);
}

/**
 * Log file upload attempt
 */
export function logUploadAttempt(fileName, success, error = null) {
  const status = success ? 'erfolgreich' : 'fehlgeschlagen';
  const detail = error ? `: ${error}` : '';
  return logAction('upload', `Upload "${fileName}" ${status}${detail}`);
}

/**
 * Get recent audit entries
 */
export function getRecentEntries(limit = 50) {
  return auditLog.slice(0, limit);
}

/**
 * Get entries by action type
 */
export function getEntriesByAction(action, limit = 50) {
  return auditLog
    .filter(entry => entry.action === action)
    .slice(0, limit);
}

/**
 * Get entries within date range
 */
export function getEntriesByDateRange(startDate, endDate) {
  return auditLog.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startDate && entryDate <= endDate;
  });
}

/**
 * Search audit log
 */
export function searchAuditLog(query) {
  const lowerQuery = query.toLowerCase();
  return auditLog.filter(entry => {
    return entry.details.toLowerCase().includes(lowerQuery) ||
           entry.action.toLowerCase().includes(lowerQuery);
  });
}

/**
 * Clear audit trail
 */
export function clearAuditTrail() {
  const count = auditLog.length;
  auditLog = [];
  saveAuditTrail();
  logAction('system', `Audit-Trail gelöscht (${count} Einträge entfernt)`);
}

/**
 * Export audit trail as text
 */
export function exportAuditTrail(format = 'text') {
  if (format === 'json') {
    return JSON.stringify(auditLog, null, 2);
  }
  
  // Text format
  let text = '=== AUDIT TRAIL ===\n\n';
  auditLog.forEach((entry, i) => {
    text += `${i + 1}. ${entry.toString()}\n`;
  });
  return text;
}

/**
 * Get statistics about audit trail
 */
export function getAuditStatistics() {
  const stats = {
    totalEntries: auditLog.length,
    byAction: {},
    dateRange: {
      oldest: null,
      newest: null
    }
  };

  if (auditLog.length > 0) {
    // Count by action type
    auditLog.forEach(entry => {
      stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;
    });

    // Get date range
    const timestamps = auditLog.map(e => new Date(e.timestamp));
    stats.dateRange.oldest = new Date(Math.min(...timestamps));
    stats.dateRange.newest = new Date(Math.max(...timestamps));
  }

  return stats;
}

/**
 * Save audit trail to localStorage
 */
function saveAuditTrail() {
  try {
    localStorage.setItem('auditTrail', JSON.stringify(auditLog));
  } catch (e) {
    console.warn('Could not save audit trail to localStorage:', e);
  }
}

/**
 * Generate unique audit ID
 */
function generateAuditId() {
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get formatted recent activity summary
 */
export function getRecentActivitySummary(limit = 10) {
  const recent = getRecentEntries(limit);
  
  return recent.map(entry => ({
    id: entry.id,
    timestamp: entry.timestamp.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    action: formatActionName(entry.action),
    details: entry.details,
    icon: getActionIcon(entry.action)
  }));
}

/**
 * Format action name for display
 */
function formatActionName(action) {
  const names = {
    'import': 'Import',
    'export': 'Export',
    'edit': 'Bearbeitung',
    'delete': 'Löschung',
    'add': 'Hinzufügen',
    'validation': 'Validierung',
    'batch': 'Stapelverarbeitung',
    'upload': 'Upload',
    'system': 'System'
  };
  return names[action] || action;
}

/**
 * Get icon for action type
 */
function getActionIcon(action) {
  const icons = {
    'import': '📥',
    'export': '📤',
    'edit': '✏️',
    'delete': '🗑️',
    'add': '➕',
    'validation': '✅',
    'batch': '📋',
    'upload': '⬆️',
    'system': '⚙️'
  };
  return icons[action] || '•';
}

/**
 * Check if audit trail is enabled
 */
export function isAuditTrailEnabled() {
  return auditLog !== null;
}

/**
 * Get today's activity count
 */
export function getTodayActivityCount() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return auditLog.filter(entry => {
    const entryDate = new Date(entry.timestamp);
    entryDate.setHours(0, 0, 0, 0);
    return entryDate.getTime() === today.getTime();
  }).length;
}

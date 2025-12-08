/**
 * History Panel UI Component
 * Displays recent actions with timestamps and undo/redo controls
 */

import { getRecentActivitySummary } from './auditTrail.js';
import { getHistoryState, getUndoHistory, getRedoHistory, undo, redo, getKeyboardShortcuts } from './history.js';

/**
 * Create and render history panel
 */
export function createHistoryPanel(containerId = 'history-panel-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  const html = renderHistoryPanel();
  container.innerHTML = html;

  // Attach event listeners
  attachHistoryPanelListeners(containerId);

  // Update content
  updateHistoryPanel(containerId);

  // Listen for updates
  window.addEventListener('historyUpdated', () => {
    updateHistoryPanel(containerId);
  });

  window.addEventListener('auditTrailUpdated', () => {
    updateHistoryPanel(containerId);
  });
}

/**
 * Render history panel HTML structure
 */
function renderHistoryPanel() {
  const shortcuts = getKeyboardShortcuts();

  return `
    <div class="history-panel">
      <div class="history-header">
        <h3 class="history-title">
          <span class="history-icon">📜</span>
          Verlauf
        </h3>
        <button class="btn-icon toggle-history" aria-label="Ein-/Ausklappen" aria-expanded="true">
          <span class="toggle-icon">▼</span>
        </button>
      </div>

      <div class="history-content">
        <!-- Undo/Redo Controls -->
        <div class="history-controls">
          <button class="btn btn-sm undo-btn" disabled>
            <span class="btn-icon">↶</span>
            Rückgängig
            <span class="btn-shortcut">${shortcuts.undo}</span>
          </button>
          <button class="btn btn-sm redo-btn" disabled>
            <span class="btn-icon">↷</span>
            Wiederholen
            <span class="btn-shortcut">${shortcuts.redo}</span>
          </button>
        </div>

        <!-- Tabs for Undo/Redo/Activity -->
        <div class="history-tabs">
          <button class="history-tab active" data-tab="undo">
            <span>Rückgängig</span>
            <span class="tab-badge undo-count">0</span>
          </button>
          <button class="history-tab" data-tab="redo">
            <span>Wiederholen</span>
            <span class="tab-badge redo-count">0</span>
          </button>
          <button class="history-tab" data-tab="activity">
            <span>Aktivität</span>
            <span class="tab-badge activity-count">0</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="history-tab-content">
          <div class="tab-panel active" data-panel="undo">
            <div class="history-list undo-list">
              <div class="history-empty">Keine Aktionen zum Rückgängigmachen</div>
            </div>
          </div>

          <div class="tab-panel" data-panel="redo">
            <div class="history-list redo-list">
              <div class="history-empty">Keine Aktionen zum Wiederholen</div>
            </div>
          </div>

          <div class="tab-panel" data-panel="activity">
            <div class="history-list activity-list">
              <div class="history-empty">Keine Aktivität aufgezeichnet</div>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="history-footer">
          <button class="btn btn-sm btn-secondary clear-history-btn">
            🗑️ Verlauf löschen
          </button>
          <button class="btn btn-sm btn-secondary export-history-btn">
            📥 Export
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Update history panel content
 */
export function updateHistoryPanel(containerId = 'history-panel-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Update undo/redo button states
  const historyState = getHistoryState();
  const undoBtn = container.querySelector('.undo-btn');
  const redoBtn = container.querySelector('.redo-btn');

  if (undoBtn) {
    undoBtn.disabled = !historyState.canUndo;
  }
  if (redoBtn) {
    redoBtn.disabled = !historyState.canRedo;
  }

  // Update badges
  container.querySelector('.undo-count').textContent = historyState.undoCount;
  container.querySelector('.redo-count').textContent = historyState.redoCount;

  // Update lists
  updateUndoList(container);
  updateRedoList(container);
  updateActivityList(container);

  // Update activity count badge
  const activityCount = getRecentActivitySummary(50).length;
  container.querySelector('.activity-count').textContent = activityCount;
}

/**
 * Update undo history list
 */
function updateUndoList(container) {
  const list = container.querySelector('.undo-list');
  if (!list) return;

  const undoHistory = getUndoHistory(20);

  if (undoHistory.length === 0) {
    list.innerHTML = '<div class="history-empty">Keine Aktionen zum Rückgängigmachen</div>';
    return;
  }

  list.innerHTML = undoHistory.map(action => `
    <div class="history-item" data-action-id="${action.id}">
      <div class="history-item-icon">${getActionIcon(action.type)}</div>
      <div class="history-item-content">
        <div class="history-item-description">${action.description}</div>
        <div class="history-item-time">${formatTimestamp(action.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Update redo history list
 */
function updateRedoList(container) {
  const list = container.querySelector('.redo-list');
  if (!list) return;

  const redoHistory = getRedoHistory(20);

  if (redoHistory.length === 0) {
    list.innerHTML = '<div class="history-empty">Keine Aktionen zum Wiederholen</div>';
    return;
  }

  list.innerHTML = redoHistory.map(action => `
    <div class="history-item" data-action-id="${action.id}">
      <div class="history-item-icon">${getActionIcon(action.type)}</div>
      <div class="history-item-content">
        <div class="history-item-description">${action.description}</div>
        <div class="history-item-time">${formatTimestamp(action.timestamp)}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Update activity list
 */
function updateActivityList(container) {
  const list = container.querySelector('.activity-list');
  if (!list) return;

  const activities = getRecentActivitySummary(20);

  if (activities.length === 0) {
    list.innerHTML = '<div class="history-empty">Keine Aktivität aufgezeichnet</div>';
    return;
  }

  list.innerHTML = activities.map(activity => `
    <div class="history-item activity-item">
      <div class="history-item-icon">${activity.icon}</div>
      <div class="history-item-content">
        <div class="history-item-type">${activity.action}</div>
        <div class="history-item-description">${activity.details}</div>
        <div class="history-item-time">${activity.timestamp}</div>
      </div>
    </div>
  `).join('');
}

/**
 * Attach event listeners to history panel
 */
function attachHistoryPanelListeners(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Toggle collapse/expand
  const toggleBtn = container.querySelector('.toggle-history');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const content = container.querySelector('.history-content');
      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      
      content.style.display = isExpanded ? 'none' : 'block';
      toggleBtn.setAttribute('aria-expanded', !isExpanded);
      toggleBtn.querySelector('.toggle-icon').textContent = isExpanded ? '▶' : '▼';
    });
  }

  // Undo/Redo buttons
  const undoBtn = container.querySelector('.undo-btn');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      undo();
    });
  }

  const redoBtn = container.querySelector('.redo-btn');
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      redo();
    });
  }

  // Tab switching
  container.querySelectorAll('.history-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchHistoryTab(container, tabName);
    });
  });

  // Clear history
  const clearBtn = container.querySelector('.clear-history-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Möchten Sie den gesamten Verlauf wirklich löschen?')) {
        window.dispatchEvent(new CustomEvent('clearHistory'));
        updateHistoryPanel(containerId);
      }
    });
  }

  // Export history
  const exportBtn = container.querySelector('.export-history-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('exportHistory'));
    });
  }
}

/**
 * Switch between history tabs
 */
function switchHistoryTab(container, tabName) {
  // Update tab buttons
  container.querySelectorAll('.history-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });

  // Update panels
  container.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.getAttribute('data-panel') === tabName);
  });
}

/**
 * Helper: Get icon for action type
 */
function getActionIcon(type) {
  const icons = {
    'edit': '✏️',
    'delete': '🗑️',
    'add': '➕',
    'reorder': '↕️',
    'batch': '📋'
  };
  return icons[type] || '•';
}

/**
 * Helper: Format timestamp
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return 'Gerade eben';
  if (diffMins < 60) return `Vor ${diffMins} Min.`;
  if (diffHours < 24) return `Vor ${diffHours} Std.`;
  
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Show/hide history panel
 */
export function toggleHistoryPanel(containerId = 'history-panel-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const isVisible = container.style.display !== 'none';
  container.style.display = isVisible ? 'none' : 'block';
}

/**
 * Highlight recent action in history
 */
export function highlightRecentAction(containerId = 'history-panel-container') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const firstItem = container.querySelector('.history-item');
  if (firstItem) {
    firstItem.classList.add('highlight');
    setTimeout(() => {
      firstItem.classList.remove('highlight');
    }, 2000);
  }
}

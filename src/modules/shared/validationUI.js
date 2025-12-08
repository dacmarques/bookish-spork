/**
 * Validation UI Components
 * Renders error highlights, tooltips, quality reports, and recovery suggestions
 */

import { formatValidationSummary } from './validator.js';
import { generateQualityReportSummary, exportQualityReport } from './dataQuality.js';

/**
 * Create and show data quality report panel
 */
export function showQualityReport(report, containerId = 'quality-report-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container #${containerId} not found`);
    return;
  }

  const summary = generateQualityReportSummary(report);
  const html = renderQualityReport(summary, report);
  
  container.innerHTML = html;
  container.style.display = 'block';

  // Add event listeners
  attachQualityReportListeners(containerId, report);
}

/**
 * Render quality report HTML
 */
function renderQualityReport(summary, report) {
  const scoreColor = getScoreColor(summary.qualityScore);
  const gradeEmoji = getGradeEmoji(summary.grade);

  return `
    <div class="quality-report-card">
      <div class="quality-report-header">
        <h3>📊 Datenqualitätsbericht</h3>
        <button class="btn-icon close-report" aria-label="Schließen">✕</button>
      </div>

      <div class="quality-score">
        <div class="score-circle" style="--score: ${summary.qualityScore}; --color: ${scoreColor}">
          <span class="score-value">${summary.qualityScore}</span>
          <span class="score-label">/ 100</span>
        </div>
        <div class="score-info">
          <div class="quality-grade">${gradeEmoji} ${summary.grade}</div>
          <div class="quality-stats">
            <div class="stat">
              <span class="stat-label">Vollständigkeit:</span>
              <span class="stat-value">${summary.completenessPercentage}%</span>
            </div>
            <div class="stat">
              <span class="stat-label">Zeilen:</span>
              <span class="stat-value">${report.totalRows}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="quality-issues">
        ${renderIssuesSummary(summary)}
      </div>

      ${summary.errorCount > 0 ? renderErrors(report.issues) : ''}
      ${summary.warningCount > 0 ? renderWarnings(report.issues) : ''}

      <div class="quality-actions">
        ${summary.canProceed ? 
          '<button class="btn btn-success proceed-btn">✅ Fortfahren</button>' : 
          '<button class="btn btn-primary fix-errors-btn">🔧 Fehler beheben</button>'
        }
        <button class="btn btn-secondary export-report-btn">📥 Bericht exportieren</button>
        ${summary.warningCount > 0 && summary.canProceed ? 
          '<button class="btn btn-secondary ignore-warnings-btn">⚠️ Warnungen ignorieren</button>' : 
          ''
        }
      </div>
    </div>
  `;
}

/**
 * Render issues summary
 */
function renderIssuesSummary(summary) {
  const items = [];

  if (summary.errorCount > 0) {
    items.push(`
      <div class="issue-summary error">
        <span class="issue-icon">❌</span>
        <span class="issue-text">${summary.errorCount} Fehler</span>
      </div>
    `);
  }

  if (summary.warningCount > 0) {
    items.push(`
      <div class="issue-summary warning">
        <span class="issue-icon">⚠️</span>
        <span class="issue-text">${summary.warningCount} Warnungen</span>
      </div>
    `);
  }

  if (summary.errorCount === 0 && summary.warningCount === 0) {
    items.push(`
      <div class="issue-summary success">
        <span class="issue-icon">✅</span>
        <span class="issue-text">Keine Probleme gefunden</span>
      </div>
    `);
  }

  return items.join('');
}

/**
 * Render errors list
 */
function renderErrors(issues) {
  const errors = issues.filter(i => i.type === 'error');
  if (errors.length === 0) return '';

  return `
    <div class="issues-section errors-section">
      <h4 class="issues-title">❌ Fehler (müssen behoben werden)</h4>
      <ul class="issues-list">
        ${errors.map(error => `
          <li class="issue-item error-item">
            <div class="issue-content">
              <div class="issue-message">${error.message}</div>
              ${error.location ? `
                <div class="issue-location">
                  📍 Zeile ${error.location.row + 1}, Spalte "${error.location.column}"
                </div>
              ` : ''}
              ${error.suggestion ? `
                <div class="issue-suggestion">
                  💡 <strong>Vorschlag:</strong> ${error.suggestion}
                </div>
              ` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Render warnings list
 */
function renderWarnings(issues) {
  const warnings = issues.filter(i => i.type === 'warning');
  if (warnings.length === 0) return '';

  return `
    <div class="issues-section warnings-section">
      <h4 class="issues-title">⚠️ Warnungen (Überprüfung empfohlen)</h4>
      <ul class="issues-list">
        ${warnings.map(warning => `
          <li class="issue-item warning-item">
            <div class="issue-content">
              <div class="issue-message">${warning.message}</div>
              ${warning.location ? `
                <div class="issue-location">
                  📍 Zeile ${warning.location.row + 1}, Spalte "${warning.location.column}"
                </div>
              ` : ''}
              ${warning.suggestion ? `
                <div class="issue-suggestion">
                  💡 ${warning.suggestion}
                </div>
              ` : ''}
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Add error highlighting to table cells
 */
export function highlightCellErrors(tableId, cellErrors) {
  const table = document.getElementById(tableId);
  if (!table) return;

  // Remove existing highlights
  table.querySelectorAll('.cell-error, .cell-warning').forEach(cell => {
    cell.classList.remove('cell-error', 'cell-warning');
    cell.removeAttribute('data-error-tooltip');
  });

  // Add new highlights
  cellErrors.forEach((error, key) => {
    const [row, column] = key.split('-');
    const cell = table.querySelector(`[data-row="${row}"][data-column="${column}"]`);
    
    if (cell) {
      const errorClass = error.type === 'error' ? 'cell-error' : 'cell-warning';
      cell.classList.add(errorClass);
      cell.setAttribute('data-error-tooltip', error.message);
      
      if (error.suggestion) {
        cell.setAttribute('data-suggestion', error.suggestion);
      }
    }
  });
}

/**
 * Create and show validation tooltip
 */
export function showValidationTooltip(element, error) {
  // Remove existing tooltips
  hideValidationTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = `validation-tooltip ${error.type}`;
  tooltip.innerHTML = `
    <div class="tooltip-header">
      <span class="tooltip-icon">${error.type === 'error' ? '❌' : '⚠️'}</span>
      <span class="tooltip-title">${error.type === 'error' ? 'Fehler' : 'Warnung'}</span>
    </div>
    <div class="tooltip-message">${error.message}</div>
    ${error.suggestion ? `
      <div class="tooltip-suggestion">
        💡 ${error.suggestion}
      </div>
    ` : ''}
  `;

  document.body.appendChild(tooltip);

  // Position tooltip
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  let top = rect.bottom + 8;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);

  // Adjust if tooltip goes off screen
  if (top + tooltipRect.height > window.innerHeight) {
    top = rect.top - tooltipRect.height - 8;
  }
  if (left < 8) left = 8;
  if (left + tooltipRect.width > window.innerWidth - 8) {
    left = window.innerWidth - tooltipRect.width - 8;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
  tooltip.style.opacity = '1';

  // Store reference for removal
  element._validationTooltip = tooltip;
}

/**
 * Hide validation tooltip
 */
export function hideValidationTooltip() {
  document.querySelectorAll('.validation-tooltip').forEach(tooltip => {
    tooltip.remove();
  });
}

/**
 * Add validation tooltip listeners to cells
 */
export function attachValidationTooltips(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.addEventListener('mouseenter', (e) => {
    const cell = e.target.closest('[data-error-tooltip]');
    if (cell) {
      const message = cell.getAttribute('data-error-tooltip');
      const suggestion = cell.getAttribute('data-suggestion');
      const type = cell.classList.contains('cell-error') ? 'error' : 'warning';
      
      showValidationTooltip(cell, { message, suggestion, type });
    }
  }, true);

  table.addEventListener('mouseleave', (e) => {
    const cell = e.target.closest('[data-error-tooltip]');
    if (cell) {
      hideValidationTooltip();
    }
  }, true);
}

/**
 * Attach quality report event listeners
 */
function attachQualityReportListeners(containerId, report) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Close button
  const closeBtn = container.querySelector('.close-report');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      container.style.display = 'none';
    });
  }

  // Export report button
  const exportBtn = container.querySelector('.export-report-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const text = exportQualityReport(report);
      downloadTextFile(text, 'datenqualitaetsbericht.txt');
    });
  }

  // Proceed button
  const proceedBtn = container.querySelector('.proceed-btn');
  if (proceedBtn) {
    proceedBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('qualityReportProceed'));
      container.style.display = 'none';
    });
  }

  // Ignore warnings button
  const ignoreBtn = container.querySelector('.ignore-warnings-btn');
  if (ignoreBtn) {
    ignoreBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('qualityReportIgnoreWarnings'));
      container.style.display = 'none';
    });
  }

  // Fix errors button
  const fixBtn = container.querySelector('.fix-errors-btn');
  if (fixBtn) {
    fixBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('qualityReportFixErrors', { detail: report }));
    });
  }
}

/**
 * Helper: Get color for score
 */
function getScoreColor(score) {
  if (score >= 90) return 'var(--color-success, #10b981)';
  if (score >= 75) return 'var(--color-info, #3b82f6)';
  if (score >= 60) return 'var(--color-warning, #f59e0b)';
  return 'var(--color-error, #ef4444)';
}

/**
 * Helper: Get emoji for grade
 */
function getGradeEmoji(grade) {
  const emojis = {
    'Ausgezeichnet': '🌟',
    'Gut': '✅',
    'Befriedigend': '👍',
    'Ausreichend': '⚠️',
    'Mangelhaft': '❌'
  };
  return emojis[grade] || '•';
}

/**
 * Helper: Download text file
 */
function downloadTextFile(text, filename) {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Show inline validation message
 */
export function showValidationMessage(containerId, message, type = 'error') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `validation-message ${type}`;
  messageDiv.innerHTML = `
    <span class="message-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
    <span class="message-text">${message}</span>
    <button class="message-close" aria-label="Schließen">✕</button>
  `;

  container.appendChild(messageDiv);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    messageDiv.classList.add('fade-out');
    setTimeout(() => messageDiv.remove(), 300);
  }, 10000);

  // Close button
  messageDiv.querySelector('.message-close').addEventListener('click', () => {
    messageDiv.classList.add('fade-out');
    setTimeout(() => messageDiv.remove(), 300);
  });
}

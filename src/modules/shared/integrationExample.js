/**
 * Example Integration Guide
 * Demonstrates how to integrate validation, audit trail, and history into a tool
 */

// ============================================
// STEP 1: Import Required Modules
// ============================================

import { validateAndProcess, ensureQualityReportContainer, highlightValidationErrors } from '../shared/validationIntegration.js';
import { initializeAuditTrail, logImport, logEdit, logDelete, logExport } from '../shared/auditTrail.js';
import { initializeHistory, recordEdit, recordDelete, recordAdd } from '../shared/history.js';
import { createHistoryPanel } from '../shared/historyPanel.js';
import { showToast } from '../toast.js';

// ============================================
// STEP 2: Initialize Systems on App Load
// ============================================

export function initializeValidationSystem() {
  console.log('🔧 Initializing validation system...');
  
  // Initialize audit trail with custom settings
  initializeAuditTrail({
    maxEntries: 1000 // Keep last 1000 actions
  });
  
  // Initialize history/undo system
  initializeHistory({
    maxHistorySize: 50 // Keep last 50 actions for undo
  });
  
  // Create history panel UI
  // Note: Requires a container with id="history-panel-container" in HTML
  createHistoryPanel('history-panel-container');
  
  // Ensure quality report containers exist for each tool
  ensureQualityReportContainer('tool1');
  ensureQualityReportContainer('tool2');
  ensureQualityReportContainer('tool3');
  
  console.log('✅ Validation system ready');
}

// ============================================
// STEP 3: File Upload with Validation
// ============================================

export async function handleFileUploadWithValidation(file, toolName, fileType) {
  console.log(`📤 Uploading ${file.name} for ${toolName}/${fileType}`);
  
  try {
    // Step 1: Read the Excel file
    const rawData = await readExcelFile(file);
    
    // Step 2: Validate the data
    const validationResults = await validateAndProcess(rawData, toolName, fileType);
    
    // Step 3: Check if validation passed
    if (!validationResults.valid) {
      showToast('❌ Validation failed. Please fix errors before proceeding.', 'error');
      return { success: false, data: null };
    }
    
    // Step 4: If there are warnings but no errors, user can proceed
    if (validationResults.warnings.length > 0) {
      showToast(`⚠️ ${validationResults.warnings.length} warnings found. Review recommended.`, 'warning');
    }
    
    // Step 5: Log successful import
    logImport(file.name, validationResults.data.length, toolName);
    
    // Step 6: Highlight any cell-level errors in the UI
    // (This happens after table is rendered)
    setTimeout(() => {
      highlightValidationErrors(`${toolName}-table`, validationResults);
    }, 100);
    
    return {
      success: true,
      data: validationResults.data,
      validation: validationResults
    };
    
  } catch (error) {
    console.error('Upload error:', error);
    showToast(`❌ Upload failed: ${error.message}`, 'error');
    return { success: false, data: null };
  }
}

// Helper function to read Excel file
async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================
// STEP 4: Data Modification with History
// ============================================

export function updateCellWithHistory(tableId, rowId, columnName, newValue, state) {
  const oldValue = state.data[rowId][columnName];
  
  // Don't record if value didn't change
  if (oldValue === newValue) return;
  
  // Update the data
  state.data[rowId][columnName] = newValue;
  
  // Log to audit trail
  logEdit(rowId, columnName, oldValue, newValue);
  
  // Record for undo/redo
  recordEdit(rowId, columnName, oldValue, newValue, (id, col, val) => {
    // This function will be called on undo
    state.data[id][col] = val;
    rerenderTable(tableId, state);
  });
  
  // Re-render the table
  rerenderTable(tableId, state);
  
  // Show success feedback
  showToast('✏️ Cell updated', 'success', 2000);
}

export function deleteRowWithHistory(tableId, rowId, state) {
  const rowData = state.data[rowId];
  
  // Remove from state
  state.data.splice(rowId, 1);
  
  // Log to audit trail
  logDelete(rowId, rowData);
  
  // Record for undo/redo
  recordDelete(rowId, rowData, (id, data) => {
    // This function will be called on undo
    state.data.splice(id, 0, data);
    rerenderTable(tableId, state);
  });
  
  // Re-render the table
  rerenderTable(tableId, state);
  
  // Show success feedback
  showToast('🗑️ Row deleted', 'success', 2000);
}

export function addRowWithHistory(tableId, newRowData, state) {
  const rowId = state.data.length;
  
  // Add to state
  state.data.push(newRowData);
  
  // Log to audit trail
  logAdd(newRowData);
  
  // Record for undo/redo
  recordAdd(rowId, newRowData, (id) => {
    // This function will be called on undo
    state.data.splice(id, 1);
    rerenderTable(tableId, state);
  });
  
  // Re-render the table
  rerenderTable(tableId, state);
  
  // Show success feedback
  showToast('➕ Row added', 'success', 2000);
}

// Helper function to re-render table
function rerenderTable(tableId, state) {
  // This would call your existing render function
  // Example:
  // renderTable(tableId, state.data);
  console.log(`Re-rendering table ${tableId}`);
}

// ============================================
// STEP 5: Export with Audit Logging
// ============================================

export function exportDataWithLogging(data, format, fileName) {
  try {
    // Perform the export (using your existing export logic)
    performExport(data, format, fileName);
    
    // Log the export
    logExport(format.toUpperCase(), data.length);
    
    // Show success message
    showToast(`📥 Exported ${data.length} rows as ${format}`, 'success');
    
    return true;
  } catch (error) {
    console.error('Export error:', error);
    showToast(`❌ Export failed: ${error.message}`, 'error');
    return false;
  }
}

// Dummy export function
function performExport(data, format, fileName) {
  // Your existing export logic here
  console.log(`Exporting ${data.length} rows as ${format} to ${fileName}`);
}

// ============================================
// STEP 6: Listen for History Events
// ============================================

export function setupHistoryEventListeners() {
  // Listen for redo action (needed to replay the action)
  window.addEventListener('redoAction', (event) => {
    const action = event.detail;
    
    console.log('Redoing action:', action.type);
    
    // Replay the action based on type
    switch (action.type) {
      case 'edit':
        // Re-apply the edit
        const { rowId, field, newValue } = action.data;
        // Update your state and re-render
        break;
      
      case 'delete':
        // Re-delete the row
        break;
      
      case 'add':
        // Re-add the row
        break;
    }
  });
  
  // Listen for quality report events
  window.addEventListener('qualityReportProceed', () => {
    console.log('User chose to proceed despite warnings');
    // Continue with data processing
  });
  
  window.addEventListener('qualityReportIgnoreWarnings', () => {
    console.log('User chose to ignore warnings');
    // Continue with data processing
  });
  
  window.addEventListener('qualityReportFixErrors', (event) => {
    const report = event.detail;
    console.log('User wants to fix errors:', report);
    // Show error correction UI
  });
  
  // Listen for clear history
  window.addEventListener('clearHistory', () => {
    console.log('Clearing history');
    // Optional: perform any cleanup
  });
  
  // Listen for export history
  window.addEventListener('exportHistory', () => {
    console.log('Exporting history');
    import('../shared/history.js').then(({ exportHistory }) => {
      const historyText = exportHistory();
      downloadTextFile(historyText, 'history.txt');
    });
  });
}

// Helper to download text file
function downloadTextFile(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// STEP 7: HTML Structure Required
// ============================================

/**
 * Add these elements to your HTML:
 * 
 * 1. Quality Report Container (one per tool):
 *    <div id="tool1-quality-report" class="quality-report-container"></div>
 * 
 * 2. History Panel Container (once in main layout):
 *    <div id="history-panel-container"></div>
 * 
 * 3. Table with data attributes for validation highlighting:
 *    <table id="tool1-table">
 *      <tr>
 *        <td data-row="0" data-column="Betrag">100.00</td>
 *      </tr>
 *    </table>
 */

// ============================================
// STEP 8: Full Integration Example
// ============================================

export async function fullIntegrationExample() {
  // Initialize everything once on app startup
  initializeValidationSystem();
  setupHistoryEventListeners();
  
  // Example: User uploads a file
  const fileInput = document.getElementById('file-input');
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const result = await handleFileUploadWithValidation(file, 'tool1', 'protokoll');
    
    if (result.success) {
      console.log('✅ File uploaded and validated successfully');
      console.log('Data:', result.data);
      
      // Render the data in your table
      // renderTable('tool1-table', result.data);
    }
  });
  
  // Example: User edits a cell
  // (This would be triggered by your inline edit handler)
  const exampleEdit = () => {
    const state = { data: [{ Betrag: '100.00', 'Auftrags-Nr.': '12345' }] };
    updateCellWithHistory('tool1-table', 0, 'Betrag', '150.00', state);
  };
  
  // Example: User deletes a row
  // (This would be triggered by your delete button)
  const exampleDelete = () => {
    const state = { data: [{ Betrag: '100.00', 'Auftrags-Nr.': '12345' }] };
    deleteRowWithHistory('tool1-table', 0, state);
  };
  
  // Example: User exports data
  const exampleExport = () => {
    const data = [{ Betrag: '100.00', 'Auftrags-Nr.': '12345' }];
    exportDataWithLogging(data, 'xlsx', 'export.xlsx');
  };
  
  // Keyboard shortcuts are automatically handled by history module
  // Ctrl+Z = Undo
  // Ctrl+Y = Redo
}

// ============================================
// BONUS: Batch Operations with History
// ============================================

export function batchDeleteWithHistory(tableId, rowIds, state) {
  const operations = [];
  const inverseOperations = [];
  
  // Collect all operations
  rowIds.forEach(rowId => {
    const rowData = state.data[rowId];
    
    operations.push(() => {
      state.data.splice(rowId, 1);
    });
    
    inverseOperations.push(() => {
      state.data.splice(rowId, 0, rowData);
    });
  });
  
  // Execute all operations
  operations.forEach(op => op());
  
  // Log batch operation
  import('../shared/auditTrail.js').then(({ logBatchOperation }) => {
    logBatchOperation('Batch Delete', rowIds.length);
  });
  
  // Record for undo/redo
  import('../shared/history.js').then(({ recordBatch }) => {
    recordBatch(operations, inverseOperations);
  });
  
  // Re-render
  rerenderTable(tableId, state);
  
  showToast(`🗑️ Deleted ${rowIds.length} rows`, 'success');
}

export default {
  initializeValidationSystem,
  handleFileUploadWithValidation,
  updateCellWithHistory,
  deleteRowWithHistory,
  addRowWithHistory,
  exportDataWithLogging,
  setupHistoryEventListeners,
  fullIntegrationExample,
  batchDeleteWithHistory
};

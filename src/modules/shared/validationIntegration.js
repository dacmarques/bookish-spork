/**
 * Validation Integration Helper
 * Provides integration functions for connecting validation to file processors
 */

import { validateFileStructure, validateDataset, ValidationRules } from './validator.js';
import { analyzeDataQuality, generateQualityReportSummary } from './dataQuality.js';
import { showQualityReport, highlightCellErrors, attachValidationTooltips, showValidationMessage } from './validationUI.js';
import { logValidation, logUploadAttempt } from './auditTrail.js';
import { showToast } from '../toast.js';

/**
 * Validate and process file data
 * Returns validation results and processed data
 */
export async function validateAndProcess(data, toolName, fileType = null) {
  const results = {
    valid: false,
    data: null,
    validation: null,
    qualityReport: null,
    errors: [],
    warnings: []
  };

  try {
    // Determine validation rules
    const rules = getValidationRules(toolName, fileType);
    
    if (!rules) {
      console.warn(`No validation rules found for ${toolName}/${fileType}`);
      results.valid = true;
      results.data = data;
      return results;
    }

    // Step 1: Validate file structure
    const structureValidation = validateFileStructure(data, rules);
    results.validation = structureValidation;

    if (!structureValidation.valid) {
      results.errors = structureValidation.errors;
      results.warnings = structureValidation.warnings || [];
      
      // Show error messages
      structureValidation.errors.forEach(error => {
        showToast(`❌ ${error.message}`, 'error');
      });
      
      return results;
    }

    // Step 2: Validate dataset (cell-level validation)
    const datasetValidation = validateDataset(data, rules);
    results.validation = {
      ...structureValidation,
      ...datasetValidation
    };

    // Step 3: Run data quality analysis
    const qualityReport = analyzeDataQuality(data, {
      keyColumn: getKeyColumn(toolName, fileType),
      amountColumn: getAmountColumn(toolName, fileType)
    });
    results.qualityReport = qualityReport;

    // Step 4: Determine if we can proceed
    const qualitySummary = generateQualityReportSummary(qualityReport);
    results.valid = qualitySummary.canProceed;
    results.errors = qualityReport.issues.filter(i => i.type === 'error');
    results.warnings = qualityReport.issues.filter(i => i.type === 'warning');

    // Log validation
    const fileName = `${toolName}${fileType ? `_${fileType}` : ''}`;
    logValidation(fileName, results.errors.length, results.warnings.length);

    // If there are issues, show quality report
    if (results.errors.length > 0 || results.warnings.length > 0) {
      showValidationResults(results, toolName);
    }

    // Data is valid, return it
    if (results.valid || results.errors.length === 0) {
      results.data = data;
    }

    return results;

  } catch (error) {
    console.error('Validation error:', error);
    results.errors.push({
      type: 'error',
      message: `Validierungsfehler: ${error.message}`
    });
    showToast(`❌ Validierungsfehler: ${error.message}`, 'error');
    return results;
  }
}

/**
 * Show validation results to user
 */
export function showValidationResults(results, toolName) {
  const { qualityReport, errors, warnings } = results;

  // Show quality report if available
  if (qualityReport) {
    showQualityReport(qualityReport, `${toolName}-quality-report`);
  }

  // Show summary toast
  const summary = `${errors.length} Fehler, ${warnings.length} Warnungen`;
  
  if (errors.length > 0) {
    showToast(`⚠️ Validierung fehlgeschlagen: ${summary}`, 'error', 5000);
  } else if (warnings.length > 0) {
    showToast(`⚠️ Warnungen gefunden: ${summary}`, 'warning', 5000);
  } else {
    showToast(`✅ Validierung erfolgreich`, 'success', 3000);
  }
}

/**
 * Highlight validation errors in table
 */
export function highlightValidationErrors(tableId, validationResults) {
  if (!validationResults || !validationResults.validation) return;

  const { cellErrors } = validationResults.validation;
  if (cellErrors && cellErrors.size > 0) {
    highlightCellErrors(tableId, cellErrors);
    attachValidationTooltips(tableId);
  }
}

/**
 * Get validation rules for tool/file type
 */
function getValidationRules(toolName, fileType) {
  switch (toolName.toLowerCase()) {
    case 'tool1':
      if (fileType === 'protokoll') {
        return ValidationRules.TOOL1.PROTOKOLL;
      } else if (fileType === 'abrechnung') {
        return ValidationRules.TOOL1.ABRECHNUNG;
      }
      return null;
    
    case 'tool2':
      return ValidationRules.TOOL2;
    
    case 'tool3':
      return ValidationRules.TOOL3;
    
    default:
      return null;
  }
}

/**
 * Get key column for data quality analysis
 */
function getKeyColumn(toolName, fileType) {
  switch (toolName.toLowerCase()) {
    case 'tool1':
      return 'Auftrags-Nr.';
    case 'tool2':
      return 'Name';
    case 'tool3':
      return 'ID';
    default:
      return null;
  }
}

/**
 * Get amount column for data quality analysis
 */
function getAmountColumn(toolName, fileType) {
  switch (toolName.toLowerCase()) {
    case 'tool1':
      return 'Betrag';
    case 'tool2':
      return 'Value';
    case 'tool3':
      return null;
    default:
      return null;
  }
}

/**
 * Wrapper for file upload with validation
 */
export async function processFileWithValidation(file, toolName, fileType, processFunc) {
  try {
    // Log upload attempt
    logUploadAttempt(file.name, false); // Start as failed, update later

    // Read file first (this part depends on the tool's existing logic)
    // For now, we'll assume the tool has already parsed the data
    // The integration will be in the individual file processors

    return true;
  } catch (error) {
    logUploadAttempt(file.name, false, error.message);
    showToast(`❌ Upload fehlgeschlagen: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Create quality report container if it doesn't exist
 */
export function ensureQualityReportContainer(toolName) {
  const containerId = `${toolName}-quality-report`;
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.className = 'quality-report-container';
    
    // Try to insert after the file upload section
    const uploadSection = document.querySelector(`#${toolName} .upload-section, #${toolName} .file-upload`);
    if (uploadSection && uploadSection.parentNode) {
      uploadSection.parentNode.insertBefore(container, uploadSection.nextSibling);
    } else {
      // Fallback: append to tool section
      const toolSection = document.getElementById(toolName);
      if (toolSection) {
        toolSection.insertBefore(container, toolSection.firstChild.nextSibling);
      }
    }
  }
  
  return container;
}

/**
 * Show file validation feedback immediately
 */
export function showFileValidationFeedback(file, isValid, message = null) {
  const statusIcon = isValid ? '✓' : '✗';
  const statusClass = isValid ? 'success' : 'error';
  const statusText = message || (isValid ? 'Valid file format' : 'Invalid file format');
  
  showToast(`${statusIcon} ${file.name}: ${statusText}`, statusClass, 3000);
}

/**
 * Pre-validate file before processing
 */
export function preValidateFile(file, expectedExtensions = ['.xlsx', '.xls']) {
  const errors = [];

  // Check file exists
  if (!file) {
    errors.push('Keine Datei ausgewählt');
    return { valid: false, errors };
  }

  // Check file extension
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!expectedExtensions.includes(extension)) {
    errors.push(`Ungültiges Dateiformat. Erwartet: ${expectedExtensions.join(', ')}`);
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push(`Datei zu groß (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum: 50 MB`);
  }

  // Check file size (min 1KB)
  if (file.size < 1024) {
    errors.push('Datei ist zu klein oder leer');
  }

  return {
    valid: errors.length === 0,
    errors,
    file
  };
}

/**
 * Clear validation state for tool
 */
export function clearValidationState(toolName) {
  // Remove quality report
  const container = document.getElementById(`${toolName}-quality-report`);
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }

  // Remove cell highlights
  const tables = document.querySelectorAll(`#${toolName} table`);
  tables.forEach(table => {
    table.querySelectorAll('.cell-error, .cell-warning').forEach(cell => {
      cell.classList.remove('cell-error', 'cell-warning');
      cell.removeAttribute('data-error-tooltip');
      cell.removeAttribute('data-suggestion');
    });
  });
}

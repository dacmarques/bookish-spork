/**
 * Data Quality Analysis Module
 * Detects duplicates, missing fields, unusual amounts, and generates quality reports
 */

import { ValidationError } from './validator.js';

/**
 * Analyzes data quality and returns comprehensive report
 */
export function analyzeDataQuality(data, options = {}) {
  const report = {
    totalRows: data.length,
    completenessPercentage: 0,
    issues: [],
    duplicates: [],
    missingFields: [],
    unusualValues: [],
    statistics: {},
    timestamp: new Date()
  };

  if (!data || data.length === 0) {
    return report;
  }

  // Run all quality checks
  report.duplicates = findDuplicates(data, options.keyColumn);
  report.missingFields = findMissingFields(data);
  report.unusualValues = findUnusualValues(data, options.amountColumn);
  report.completenessPercentage = calculateCompleteness(data);
  report.statistics = generateStatistics(data, options.amountColumn);
  
  // Combine all issues
  report.issues = [
    ...report.duplicates,
    ...report.missingFields,
    ...report.unusualValues
  ];

  return report;
}

/**
 * Find duplicate entries based on key column
 */
export function findDuplicates(data, keyColumn = 'Auftrags-Nr.') {
  const duplicates = [];
  const seen = new Map();

  data.forEach((row, index) => {
    const key = row[keyColumn];
    
    if (!key) return; // Skip rows without key
    
    if (seen.has(key)) {
      const firstOccurrence = seen.get(key);
      duplicates.push(new ValidationError(
        'warning',
        `Doppelte ${keyColumn}: "${key}" (Zeilen ${firstOccurrence + 1} und ${index + 1})`,
        { row: index, column: keyColumn },
        'Überprüfen Sie, ob es sich um einen Fehler handelt oder ob beide Einträge korrekt sind'
      ));
    } else {
      seen.set(key, index);
    }
  });

  return duplicates;
}

/**
 * Find rows with missing mandatory fields
 */
export function findMissingFields(data) {
  const missing = [];
  const mandatoryFields = detectMandatoryFields(data);

  data.forEach((row, index) => {
    mandatoryFields.forEach(field => {
      const value = row[field];
      if (value === null || value === undefined || value === '') {
        missing.push(new ValidationError(
          'error',
          `Pflichtfeld fehlt: "${field}" in Zeile ${index + 1}`,
          { row: index, column: field },
          `Bitte ergänzen Sie den Wert für "${field}"`
        ));
      }
    });
  });

  return missing;
}

/**
 * Detect which fields should be mandatory (appear in most rows)
 */
function detectMandatoryFields(data) {
  if (data.length === 0) return [];
  
  const columns = Object.keys(data[0]);
  const threshold = 0.9; // 90% of rows should have this field
  
  return columns.filter(col => {
    const filledCount = data.filter(row => {
      const value = row[col];
      return value !== null && value !== undefined && value !== '';
    }).length;
    
    return (filledCount / data.length) >= threshold;
  });
}

/**
 * Find unusual or suspicious values
 */
export function findUnusualValues(data, amountColumn = 'Betrag') {
  const unusual = [];
  
  if (!data.some(row => row[amountColumn] !== undefined)) {
    return unusual; // Column doesn't exist
  }

  // Calculate statistics for numeric columns
  const amounts = data
    .map(row => parseAmount(row[amountColumn]))
    .filter(val => !isNaN(val) && val !== null);

  if (amounts.length === 0) return unusual;

  const stats = {
    mean: amounts.reduce((a, b) => a + b, 0) / amounts.length,
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    median: calculateMedian(amounts)
  };

  const stdDev = calculateStdDev(amounts, stats.mean);

  // Find outliers (values beyond 3 standard deviations)
  data.forEach((row, index) => {
    const amount = parseAmount(row[amountColumn]);
    
    if (isNaN(amount) || amount === null) return;

    // Check for zero or negative amounts
    if (amount <= 0) {
      unusual.push(new ValidationError(
        'warning',
        `Ungewöhnlicher Betrag: ${formatAmount(amount)} in Zeile ${index + 1}`,
        { row: index, column: amountColumn },
        'Negative oder Null-Beträge könnten auf einen Fehler hinweisen'
      ));
    }
    
    // Check for outliers
    const zScore = Math.abs((amount - stats.mean) / stdDev);
    if (zScore > 3) {
      unusual.push(new ValidationError(
        'warning',
        `Ungewöhnlich ${amount > stats.mean ? 'hoher' : 'niedriger'} Betrag: ${formatAmount(amount)} in Zeile ${index + 1}`,
        { row: index, column: amountColumn },
        `Durchschnitt: ${formatAmount(stats.mean)}, Median: ${formatAmount(stats.median)}`
      ));
    }

    // Check for suspiciously round numbers (might indicate estimates)
    if (amount >= 1000 && amount % 1000 === 0) {
      unusual.push(new ValidationError(
        'info',
        `Runder Betrag: ${formatAmount(amount)} in Zeile ${index + 1}`,
        { row: index, column: amountColumn },
        'Runde Beträge könnten Schätzungen sein'
      ));
    }
  });

  return unusual;
}

/**
 * Calculate data completeness percentage
 */
export function calculateCompleteness(data) {
  if (data.length === 0) return 0;
  
  const columns = Object.keys(data[0]);
  const totalCells = data.length * columns.length;
  
  let filledCells = 0;
  data.forEach(row => {
    columns.forEach(col => {
      const value = row[col];
      if (value !== null && value !== undefined && value !== '') {
        filledCells++;
      }
    });
  });
  
  return Math.round((filledCells / totalCells) * 100);
}

/**
 * Generate statistical summary
 */
export function generateStatistics(data, amountColumn = 'Betrag') {
  const stats = {
    rowCount: data.length,
    columnCount: data.length > 0 ? Object.keys(data[0]).length : 0,
    completeRows: 0,
    incompleteRows: 0
  };

  // Count complete vs incomplete rows
  data.forEach(row => {
    const values = Object.values(row);
    const hasAllValues = values.every(val => 
      val !== null && val !== undefined && val !== ''
    );
    
    if (hasAllValues) {
      stats.completeRows++;
    } else {
      stats.incompleteRows++;
    }
  });

  // Calculate amount statistics if column exists
  if (amountColumn && data.some(row => row[amountColumn] !== undefined)) {
    const amounts = data
      .map(row => parseAmount(row[amountColumn]))
      .filter(val => !isNaN(val) && val !== null);

    if (amounts.length > 0) {
      stats.amounts = {
        count: amounts.length,
        sum: amounts.reduce((a, b) => a + b, 0),
        mean: amounts.reduce((a, b) => a + b, 0) / amounts.length,
        min: Math.min(...amounts),
        max: Math.max(...amounts),
        median: calculateMedian(amounts)
      };
    }
  }

  return stats;
}

/**
 * Generate quality report summary
 */
export function generateQualityReportSummary(report) {
  const { issues, completenessPercentage, statistics } = report;
  
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const infoCount = issues.filter(i => i.type === 'info').length;

  let qualityScore = 100;
  qualityScore -= errorCount * 10; // Each error reduces score by 10
  qualityScore -= warningCount * 3; // Each warning reduces score by 3
  qualityScore = Math.max(0, qualityScore);

  let grade = 'Ausgezeichnet';
  if (qualityScore < 90) grade = 'Gut';
  if (qualityScore < 75) grade = 'Befriedigend';
  if (qualityScore < 60) grade = 'Ausreichend';
  if (qualityScore < 50) grade = 'Mangelhaft';

  return {
    qualityScore,
    grade,
    errorCount,
    warningCount,
    infoCount,
    completenessPercentage,
    totalIssues: errorCount + warningCount,
    canProceed: errorCount === 0,
    summary: generateQualitySummaryText(report, qualityScore, grade)
  };
}

/**
 * Generate human-readable quality summary
 */
function generateQualitySummaryText(report, score, grade) {
  const { issues, totalRows, completenessPercentage } = report;
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  let text = `Datenqualität: ${grade} (${score}/100)\n\n`;
  text += `${totalRows} Zeilen analysiert\n`;
  text += `${completenessPercentage}% Vollständigkeit\n\n`;

  if (errorCount > 0) {
    text += `❌ ${errorCount} Fehler gefunden - Bitte korrigieren Sie diese vor dem Fortfahren\n`;
  }
  if (warningCount > 0) {
    text += `⚠️ ${warningCount} Warnungen - Überprüfung empfohlen\n`;
  }
  if (errorCount === 0 && warningCount === 0) {
    text += `✅ Keine Probleme gefunden`;
  }

  return text;
}

/**
 * Helper: Parse amount from various formats
 */
function parseAmount(value) {
  if (typeof value === 'number') return value;
  if (!value) return null;
  
  const str = String(value).replace(/\s/g, '');
  // Try German format first (1.234,56)
  const german = str.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(german);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Helper: Format amount for display
 */
function formatAmount(value) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

/**
 * Helper: Calculate median
 */
function calculateMedian(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

/**
 * Helper: Calculate standard deviation
 */
function calculateStdDev(values, mean) {
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Check if issues can be auto-fixed
 */
export function getFixableIssues(report) {
  return report.issues.filter(issue => {
    // Only warnings about duplicates can potentially be auto-handled
    return issue.type === 'warning' && issue.message.includes('Doppelte');
  });
}

/**
 * Export quality report as text
 */
export function exportQualityReport(report) {
  const summary = generateQualityReportSummary(report);
  let text = '=== DATENQUALITÄTSBERICHT ===\n\n';
  text += summary.summary + '\n\n';
  
  if (report.issues.length > 0) {
    text += '=== PROBLEME ===\n\n';
    
    const errors = report.issues.filter(i => i.type === 'error');
    const warnings = report.issues.filter(i => i.type === 'warning');
    
    if (errors.length > 0) {
      text += 'FEHLER:\n';
      errors.forEach((issue, i) => {
        text += `${i + 1}. ${issue.message}\n`;
        if (issue.suggestion) {
          text += `   Vorschlag: ${issue.suggestion}\n`;
        }
      });
      text += '\n';
    }
    
    if (warnings.length > 0) {
      text += 'WARNUNGEN:\n';
      warnings.forEach((issue, i) => {
        text += `${i + 1}. ${issue.message}\n`;
        if (issue.suggestion) {
          text += `   Hinweis: ${issue.suggestion}\n`;
        }
      });
    }
  }
  
  return text;
}

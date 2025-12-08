/**
 * Validator Module
 * Provides comprehensive validation for file formats, data types, and cell values
 */

export const ValidationRules = {
  TOOL1: {
    PROTOKOLL: {
      requiredColumns: ['Auftrags-Nr.', 'Datum', 'Betrag', 'Beschreibung'],
      columnTypes: {
        'Auftrags-Nr.': 'string',
        'Datum': 'date',
        'Betrag': 'number',
        'Beschreibung': 'string'
      }
    },
    ABRECHNUNG: {
      requiredColumns: ['Auftrags-Nr.', 'Datum', 'Betrag'],
      columnTypes: {
        'Auftrags-Nr.': 'string',
        'Datum': 'date',
        'Betrag': 'number'
      }
    }
  },
  TOOL2: {
    requiredColumns: ['Name', 'Value', 'Type'],
    columnTypes: {
      'Name': 'string',
      'Value': 'any',
      'Type': 'string'
    }
  },
  TOOL3: {
    requiredColumns: ['ID', 'Status'],
    columnTypes: {
      'ID': 'string',
      'Status': 'string'
    }
  }
};

export class ValidationError {
  constructor(type, message, location = null, suggestion = null) {
    this.type = type; // 'error' or 'warning'
    this.message = message;
    this.location = location; // { row, column }
    this.suggestion = suggestion;
    this.timestamp = new Date();
  }
}

export class CellValidationError extends ValidationError {
  constructor(row, column, value, expectedType, message, suggestion = null) {
    super('error', message, { row, column }, suggestion);
    this.value = value;
    this.expectedType = expectedType;
  }
}

/**
 * Validates file structure before processing
 */
export function validateFileStructure(data, rules) {
  const errors = [];
  
  if (!data || !Array.isArray(data) || data.length === 0) {
    errors.push(new ValidationError(
      'error',
      'Datei ist leer oder hat ein ungültiges Format',
      null,
      'Bitte laden Sie eine gültige Excel-Datei mit Daten hoch'
    ));
    return { valid: false, errors };
  }

  // Check for required columns
  const firstRow = data[0];
  const actualColumns = Object.keys(firstRow);
  const missingColumns = rules.requiredColumns.filter(
    col => !actualColumns.includes(col)
  );

  if (missingColumns.length > 0) {
    errors.push(new ValidationError(
      'error',
      `Fehlende erforderliche Spalten: ${missingColumns.join(', ')}`,
      null,
      'Überprüfen Sie, ob Ihre Excel-Datei alle erforderlichen Spalten enthält'
    ));
  }

  // Check for unexpected columns (warning only)
  const unexpectedColumns = actualColumns.filter(
    col => !rules.requiredColumns.includes(col) && col !== ''
  );

  if (unexpectedColumns.length > 0) {
    errors.push(new ValidationError(
      'warning',
      `Unerwartete Spalten gefunden: ${unexpectedColumns.join(', ')}`,
      null,
      'Diese Spalten werden ignoriert, falls nicht benötigt'
    ));
  }

  return {
    valid: errors.filter(e => e.type === 'error').length === 0,
    errors,
    warnings: errors.filter(e => e.type === 'warning')
  };
}

/**
 * Validates individual cell values
 */
export function validateCellValue(value, expectedType, columnName) {
  const errors = [];

  // Check for missing values in critical fields
  if (value === null || value === undefined || value === '') {
    return {
      valid: false,
      errors: [new ValidationError(
        'error',
        `Fehlender Wert in Spalte "${columnName}"`,
        null,
        'Bitte ergänzen Sie den fehlenden Wert'
      )]
    };
  }

  switch (expectedType) {
    case 'date':
      return validateDate(value, columnName);
    case 'number':
      return validateNumber(value, columnName);
    case 'string':
      return validateString(value, columnName);
    default:
      return { valid: true, errors: [] };
  }
}

/**
 * Date validation with format detection
 */
export function validateDate(value, columnName) {
  const errors = [];
  
  // Try to parse as date
  let dateValue = value;
  
  if (value instanceof Date && !isNaN(value)) {
    return { valid: true, errors: [], parsedValue: value };
  }

  if (typeof value === 'string') {
    // Try common German date formats
    const formats = [
      /^(\d{2})\.(\d{2})\.(\d{4})$/, // DD.MM.YYYY
      /^(\d{1,2})\.(\d{1,2})\.(\d{2})$/, // D.M.YY
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    ];

    let parsed = null;
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[0] || format === formats[1]) {
          // DD.MM.YYYY or D.M.YY
          const day = parseInt(match[1]);
          const month = parseInt(match[2]);
          let year = parseInt(match[3]);
          if (year < 100) year += 2000;
          parsed = new Date(year, month - 1, day);
        } else {
          // YYYY-MM-DD
          parsed = new Date(match[1], parseInt(match[2]) - 1, parseInt(match[3]));
        }
        break;
      }
    }

    if (parsed && !isNaN(parsed.getTime())) {
      return { valid: true, errors: [], parsedValue: parsed };
    }
  }

  // If we got here, date is invalid
  errors.push(new ValidationError(
    'error',
    `Ungültiges Datumsformat in Spalte "${columnName}": "${value}"`,
    null,
    'Erwartetes Format: DD.MM.YYYY (z.B. 15.03.2024)'
  ));

  return { valid: false, errors };
}

/**
 * Number validation
 */
export function validateNumber(value, columnName) {
  const errors = [];
  
  let numValue = value;
  
  if (typeof value === 'number' && !isNaN(value)) {
    return { valid: true, errors: [], parsedValue: value };
  }

  if (typeof value === 'string') {
    // Try German number format (1.234,56)
    const germanFormat = value.replace(/\./g, '').replace(',', '.');
    numValue = parseFloat(germanFormat);
    
    // Also try standard format
    if (isNaN(numValue)) {
      numValue = parseFloat(value);
    }
  }

  if (isNaN(numValue)) {
    errors.push(new ValidationError(
      'error',
      `Ungültiger Zahlenwert in Spalte "${columnName}": "${value}"`,
      null,
      'Erwartetes Format: 1234,56 oder 1.234,56'
    ));
    return { valid: false, errors };
  }

  return { valid: true, errors: [], parsedValue: numValue };
}

/**
 * String validation
 */
export function validateString(value, columnName) {
  const errors = [];
  
  const strValue = String(value).trim();
  
  if (strValue.length === 0) {
    errors.push(new ValidationError(
      'warning',
      `Leerer Text in Spalte "${columnName}"`,
      null,
      'Textfeld sollte ausgefüllt werden'
    ));
    return { valid: false, errors };
  }

  // Check for suspicious patterns
  if (strValue.length > 1000) {
    errors.push(new ValidationError(
      'warning',
      `Sehr langer Text in Spalte "${columnName}" (${strValue.length} Zeichen)`,
      null,
      'Überprüfen Sie, ob der Text korrekt ist'
    ));
  }

  return { valid: true, errors: [], parsedValue: strValue };
}

/**
 * Validates entire dataset row by row
 */
export function validateDataset(data, rules) {
  const results = {
    valid: true,
    errorCount: 0,
    warningCount: 0,
    errors: [],
    cellErrors: new Map(), // Map<`${row}-${column}`, CellValidationError>
  };

  data.forEach((row, rowIndex) => {
    Object.entries(rules.columnTypes).forEach(([columnName, expectedType]) => {
      const cellValue = row[columnName];
      const validation = validateCellValue(cellValue, expectedType, columnName);
      
      if (!validation.valid) {
        validation.errors.forEach(error => {
          const cellError = new CellValidationError(
            rowIndex,
            columnName,
            cellValue,
            expectedType,
            error.message,
            error.suggestion
          );
          
          const key = `${rowIndex}-${columnName}`;
          results.cellErrors.set(key, cellError);
          results.errors.push(cellError);
          
          if (error.type === 'error') {
            results.errorCount++;
            results.valid = false;
          } else {
            results.warningCount++;
          }
        });
      }
    });
  });

  return results;
}

/**
 * Gets validation error for specific cell
 */
export function getCellError(cellErrors, row, column) {
  return cellErrors.get(`${row}-${column}`);
}

/**
 * Checks if cell has validation error
 */
export function hasCellError(cellErrors, row, column) {
  return cellErrors.has(`${row}-${column}`);
}

/**
 * Format validation results for display
 */
export function formatValidationSummary(validationResults) {
  const { errorCount, warningCount, errors } = validationResults;
  
  return {
    totalIssues: errorCount + warningCount,
    errorCount,
    warningCount,
    hasErrors: errorCount > 0,
    hasWarnings: warningCount > 0,
    summary: `${errorCount} Fehler, ${warningCount} Warnungen`,
    errors: errors.filter(e => e.type === 'error'),
    warnings: errors.filter(e => e.type === 'warning')
  };
}

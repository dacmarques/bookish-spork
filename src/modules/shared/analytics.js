/**
 * Analytics Utility Module
 * Provides statistical calculations and visualization helpers for the dashboard.
 */

export const Analytics = {
    /**
     * Calculates key metrics for the dashboard.
     * @param {Array<Object>} data - The extracted data array.
     * @param {string} dateField - Field name for date (default 'Datum').
     * @param {string} amountField - Field name for amount (default 'Summe').
     * @returns {Object} Calculated metrics (average, count, minDate, maxDate, totalAmount).
     */
    calculateDashboardMetrics(data, dateField = 'Datum', amountField = 'Summe') {
        if (!data || data.length === 0) {
            return {
                averageAmount: 0,
                transactionCount: 0,
                totalAmount: 0,
                dateRange: { start: null, end: null },
                dailyTrends: []
            };
        }

        let total = 0;
        let count = 0;
        let minDate = null;
        let maxDate = null;
        const dailyTotals = {};

        data.forEach(row => {
            // Amount processing
            let amount = 0;
            const rawAmount = row[amountField];
            if (typeof rawAmount === 'number') {
                amount = rawAmount;
            } else if (typeof rawAmount === 'string') {
                amount = parseFloat(rawAmount.replace(/[^\d.,-]/g, '').replace(',', '.')) || 0;
            }

            total += amount;
            count++;

            // Date processing
            const rawDate = row[dateField];
            if (rawDate) {
                // Try to parse date. Assuming format might vary, but JS Date constructor is decent.
                // For 'DD.MM.YYYY' which is common in DE:
                let dateObj = null;
                if (rawDate instanceof Date) {
                    dateObj = rawDate;
                } else if (typeof rawDate === 'string') {
                    // Simple check for German format DD.MM.YYYY
                    if (rawDate.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                        const [d, m, y] = rawDate.split('.');
                        dateObj = new Date(`${y}-${m}-${d}`);
                    } else {
                        dateObj = new Date(rawDate);
                    }
                }

                if (dateObj && !isNaN(dateObj.getTime())) {
                    if (!minDate || dateObj < minDate) minDate = dateObj;
                    if (!maxDate || dateObj > maxDate) maxDate = dateObj;

                    // Daily totals for sparkline
                    const dateKey = dateObj.toISOString().split('T')[0];
                    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + amount;
                }
            }
        });

        // Convert daily totals to sorted array for sparkline
        const dailyTrends = Object.keys(dailyTotals)
            .sort()
            .map(date => ({ date, value: dailyTotals[date] }));

        return {
            averageAmount: count > 0 ? total / count : 0,
            transactionCount: count,
            totalAmount: total,
            dateRange: {
                start: minDate,
                end: maxDate
            },
            dailyTrends
        };
    },

    /**
     * Generates an SVG path for a simple sparkline chart.
     * @param {Array<number>} values - Array of numerical values.
     * @param {number} width - Width of the SVG container.
     * @param {number} height - Height of the SVG container.
     * @returns {string} SVG path d attribute string.
     */
    generateSparklinePath(values, width, height) {
        if (!values || values.length < 2) return '';

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1; // Avoid division by zero

        // X step per point
        const stepX = width / (values.length - 1);

        // Map values to coordinates
        const points = values.map((val, index) => {
            const x = index * stepX;
            // Y is inverted (0 is top), so we do height - scaledValue
            // Start from bottom padding slightly? Let's use full height for now.
            const normalizedVal = (val - min) / range; // 0 to 1
            const y = height - (normalizedVal * height);
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    },

    /**
     * Assesses the health of the dataset (missing fields, completeness).
     * @param {Array<Object>} data - Extracted data.
     * @param {Array<string>} requiredFields - Fields that should be present.
     * @returns {Object} Health metrics.
     */
    assessDataHealth(data, requiredFields = ['Auftrag Nr.', 'Anlage', 'Datum', 'Summe']) {
        if (!data || data.length === 0) {
            return {
                score: 0,
                completeness: 0,
                issues: []
            };
        }

        let totalFieldsToCheck = data.length * requiredFields.length;
        let filledFields = 0;
        const missingCounts = {};

        requiredFields.forEach(field => missingCounts[field] = 0);

        data.forEach(row => {
            requiredFields.forEach(field => {
                const val = row[field];
                if (val !== undefined && val !== null && val !== '') {
                    filledFields++;
                } else {
                    missingCounts[field]++;
                }
            });
        });

        const completeness = (filledFields / totalFieldsToCheck) * 100;

        // Health Score (0-100)
        let score = Math.round(completeness);

        // Identify major issues
        const issues = [];
        for (const [field, count] of Object.entries(missingCounts)) {
            if (count > 0) {
                issues.push(`${count} missing ${field}`);
            }
        }

        return {
            score,
            completeness,
            issues
        };
    },

    /**
     * Formats a date range string.
     * @param {Date} start 
     * @param {Date} end 
     * @returns {string} Formatted range (e.g. "01.01.2023 - 31.01.2023")
     */
    formatDateRange(start, end) {
        if (!start || !end) return 'No dates found';

        const fmt = (d) => {
            return d.toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        };

        return `${fmt(start)} - ${fmt(end)}`;
    }
};

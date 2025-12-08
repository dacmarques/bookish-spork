/**
 * Sample Data Module
 * Populates tools with dummy data for testing
 */

import { updateState } from './state.js';
import { analyzeData } from './tool1/analyzer.js';
import { renderTable as renderTool1 } from './tool1/renderer.js';
import { renderTable as renderTool2, updateUI as updateTool2UI } from './tool2/renderer.js';
import { renderTable as renderTool3, updateSelectionUI } from './tool3/renderer.js';
import { showSuccess } from './toast.js';

/**
 * Load sample data into all tools
 */
export function loadSampleData() {
    console.log('🧪 Loading sample data...');

    // --- Tool 1: Value Counter ---
    const sampleProtokoll = [
        ['Nr.:', '2023-10-27', '', '', '', ''],
        ['Auftrag Nr.:', '12345678', '', '', '', ''],
        ['Kunde:', 'Musterfirma GmbH', '', '', '', ''],
        ['Ort:', 'Berlin', '', '', '', ''],
        ['Ort:', '', '', '', '', ''],
        ['Musterstraße 1', '', '', '', '', ''], // Second match for "Ort" logic
        ['Anlage:', 'Wartungsanlage 1', '', '', '', '']
    ];

    const sampleTargets = ['Montage', 'Wartung', 'Reparatur', 'Demontage'];

    // Simulate target extraction
    updateState('tool1.currentTargets', sampleTargets);
    updateState('tool1.protokollData', sampleProtokoll);

    // Trigger analyzer to extract header
    analyzeData(sampleProtokoll);

    // Simulate outcome counts
    const sampleCounts = {
        'Montage': 5,
        'Wartung': 12,
        'Reparatur': 3,
        'Demontage': 0
    };

    updateState('tool1.lastCountsMap', sampleCounts);
    updateState('tool1.lastTotalMatches', 20);
    updateState('tool1.lastRowCount', 150);
    updateState('tool1.lastUniqueTargets', 3);

    renderTool1(sampleCounts, 20, 150, 3);


    // --- Tool 2: Smart Extractor ---
    const tool2Data = [
        { fileName: 'Abrechnung_Müller.xlsx', auftragsNr: '12345678', anlage: 'Anlage A', einsatzort: 'Berlin', datum: '27.10.2023', fachmonteur: '2.5', sumRaw: 150.50, bemerkung: '' },
        { fileName: 'Abrechnung_Meier.xlsx', auftragsNr: '12345679', anlage: 'Anlage B', einsatzort: 'München', datum: '28.10.2023', fachmonteur: '4.0', sumRaw: 240.00, bemerkung: 'Material fehlt' },
        { fileName: 'Abrechnung_Schulze.xlsx', auftragsNr: '12345680', anlage: 'Anlage C', einsatzort: 'Hamburg', datum: '29.10.2023', fachmonteur: '1.5', sumRaw: 90.25, bemerkung: '' },
    ];

    updateState('tool2.extractedData', tool2Data);
    updateState('tool2.totalSum', 480.75);
    updateState('tool2.validRecords', 3);

    renderTool2();
    updateTool2UI();


    // --- Tool 3: Row Manager ---
    const tool3Headers = ['ID', 'Name', 'Role', 'Department', 'Status'];
    const tool3Data = [
        ['101', 'John Doe', 'Engineer', 'Engineering', 'Active'],
        ['102', 'Jane Smith', 'Designer', 'Design', 'Active'],
        ['103', 'Bob Johnson', 'Manager', 'Product', 'On Leave'],
        ['104', 'Alice Brown', 'Developer', 'Engineering', 'Active'],
        ['105', 'Charlie Davis', 'Analyst', 'Finance', 'Inactive'],
    ];

    updateState('tool3.headers', tool3Headers);
    updateState('tool3.data', tool3Data);
    updateState('tool3.selectedIndices', new Set([1])); // Select 2nd row by default

    renderTool3();
    updateSelectionUI();

    showSuccess('Sample data loaded successfully!');
}

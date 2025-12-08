/**
 * Tool 2 - Smart Extractor Renderer
 * Handles table rendering and UI updates
 */

import { state } from '../state.js';
import { showToast } from '../toast.js';

/**
 * Render the extracted data table
 */
export function renderTable() {
    const tableBody = document.getElementById('table-body');
    if (!tableBody) return;

    // Clear Table
    tableBody.innerHTML = '';

    // Filter
    let filtered = state.tool2.extractedData.filter(item => {
        if (!state.tool2.filter) return true;
        return Object.values(item).some(val =>
            String(val).toLowerCase().includes(state.tool2.filter)
        );
    });

    // Sort
    if (state.tool2.sort.column) {
        const col = state.tool2.sort.column;
        const dir = state.tool2.sort.direction === 'asc' ? 1 : -1;

        filtered.sort((a, b) => {
            let valA = a[col];
            let valB = b[col];

            // Numeric sort for Sum
            if (col === 'sumRaw') {
                return (valA - valB) * dir;
            }

            // String sort
            return String(valA).localeCompare(String(valB), undefined, { numeric: true }) * dir;
        });
    }

    // Update Sort Icons
    document.querySelectorAll('.sort-icon').forEach(icon => {
        icon.classList.add('opacity-30');
        icon.setAttribute('data-lucide', 'chevrons-up-down');
        icon.classList.remove('text-blue-600', 'opacity-100');
    });

    if (state.tool2.sort.column) {
        const activeIcon = document.getElementById(`sort-${state.tool2.sort.column}`);
        if (activeIcon) {
            activeIcon.setAttribute('data-lucide', state.tool2.sort.direction === 'asc' ? 'chevron-up' : 'chevron-down');
            activeIcon.classList.remove('opacity-30');
            activeIcon.classList.add('opacity-100', 'text-blue-600');
        }
    }

    // Render Rows
    const emptyState = document.getElementById('empty-state');
    if (filtered.length === 0) {
        if (emptyState) {
            tableBody.appendChild(emptyState);
            if (state.tool2.extractedData.length > 0) {
                const emptyText = emptyState.querySelector('.empty-state-title');
                if (emptyText) emptyText.textContent = "Keine Ergebnisse für den Filter";
                emptyState.style.display = 'table-row';
            }
        }
    } else {
        filtered.forEach(data => {
            const tr = document.createElement('tr');
            const hasBemerkung = data.bemerkung && String(data.bemerkung).trim().length > 0;
            const baseBg = hasBemerkung ? "bg-orange-50" : "bg-white";
            tr.className = `${baseBg} hover:bg-blue-50 transition-colors fade-in group`;

            // Format Currency for Display
            const sumDisplay = (data.sumRaw > 0)
                ? data.sumRaw.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })
                : '-';

            // Safe HTML injection helper
            const safe = (txt) => txt ? String(txt) : '';

            // Validation checks
            const isAuftragsNrMissing = !data.auftragsNr || String(data.auftragsNr).trim() === '';
            const isAnlageMissing = !data.anlage || String(data.anlage).trim() === '';
            const isDatumInvalid = !data.datum || !/\d{1,2}[./-]\d{1,2}[./-]\d{2,4}/.test(String(data.datum));
            const isSumInvalid = data.sumRaw <= 0;

            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-400 border-b border-slate-100">
                    <div class="flex items-center gap-2 max-w-[150px]">
                        <i data-lucide="file" class="w-3 h-3 flex-shrink-0"></i>
                        <span class="truncate" title="${safe(data.fileName)}">${safe(data.fileName)}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-700 font-mono text-xs bg-slate-50 rounded ${isAuftragsNrMissing ? 'validation-error' : ''}" title="${isAuftragsNrMissing ? 'Missing Auftrag-Nr.' : ''}">${safe(data.auftragsNr) || '<span class="text-slate-400 italic">Missing</span>'}</td>
                <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-600 text-xs max-w-[150px] truncate ${isAnlageMissing ? 'validation-warning' : ''}" title="${isAnlageMissing ? 'Missing Anlage' : safe(data.anlage)}">${safe(data.anlage) || '<span class="text-slate-400 italic">Missing</span>'}</td>
                <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-600 text-xs max-w-[150px] truncate" title="${safe(data.einsatzort)}">${safe(data.einsatzort)}</td>
                <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-700 ${isDatumInvalid ? 'validation-warning' : ''}" title="${isDatumInvalid ? 'Invalid date format' : ''}">${safe(data.datum) || '<span class="text-slate-400 italic">Missing</span>'}</td>
                <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-slate-600 text-center text-right numeric">${safe(data.fachmonteur)}</td>
                <td class="px-6 py-4 whitespace-nowrap border-b border-slate-100 text-right font-mono text-slate-800 font-semibold numeric ${isSumInvalid ? 'validation-warning' : ''}" title="${isSumInvalid ? 'Invalid or zero sum' : ''}">${sumDisplay}</td>
                <td class="px-6 py-4 border-b border-slate-100 text-slate-500 text-xs min-w-[200px] leading-relaxed">${safe(data.bemerkung)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Re-initialize Lucide icons
    if (window.lucide) window.lucide.createIcons();
}

/**
 * Update UI elements (totals, counts, buttons)
 */
export function updateUI() {
    const totalDisplay = document.getElementById('total-display');
    const countDisplay = document.getElementById('count-display');
    const badgeCount = document.getElementById('record-count-badge');
    const exportBtn = document.getElementById('btn-export');
    const copyBtn = document.getElementById('btnCopyTable2');

    if (totalDisplay) {
        totalDisplay.textContent = state.tool2.totalSum.toLocaleString('de-DE', { 
            style: 'currency', 
            currency: 'EUR' 
        });
    }

    if (countDisplay) {
        countDisplay.textContent = state.tool2.validRecords;
    }

    if (badgeCount) {
        badgeCount.textContent = state.tool2.validRecords;
        if (state.tool2.validRecords > 0) {
            badgeCount.classList.remove('hidden');
        }
    }

    if (state.tool2.validRecords > 0) {
        if (exportBtn) {
            exportBtn.disabled = false;
        }

        if (copyBtn) {
            copyBtn.disabled = false;
        }
    }

    // Update global state - Tool 2 file count and sum
    if (window.updateToolFileCount) {
        window.updateToolFileCount('tool2', state.tool2.validRecords);
    }
    if (window.updateToolSum) {
        window.updateToolSum('tool2', state.tool2.totalSum);
    }
}

/**
 * Clear all table data
 */
export function clearTable() {
    const tableBody = document.getElementById('table-body');
    const emptyState = document.getElementById('empty-state');
    
    if (tableBody) {
        tableBody.innerHTML = '';
        if (emptyState) {
            tableBody.appendChild(emptyState);
            emptyState.style.display = 'table-row';
        }
    }

    // Reset State
    state.tool2.totalSum = 0;
    state.tool2.validRecords = 0;
    state.tool2.extractedData = [];

    // Reset UI
    const badgeCount = document.getElementById('record-count-badge');
    const exportBtn = document.getElementById('btn-export');
    
    if (badgeCount) badgeCount.classList.add('hidden');
    if (exportBtn) {
        exportBtn.disabled = true;
    }

    updateUI();
    showToast('Tabelle geleert', 'success');
}

/**
 * Export data to Excel file
 */
export function exportToExcel() {
    if (state.tool2.extractedData.length === 0) return;

    // Prepare data for export
    const wsData = state.tool2.extractedData.map(item => ({
        "Dateiname": item.fileName,
        "Auftragsnummer": item.auftragsNr,
        "Anlage": item.anlage,
        "Einsatzort": item.einsatzort,
        "Datum": item.datum,
        "Fachmonteurstunden": item.fachmonteur,
        "Auftragssumme": item.sumRaw,
        "Bemerkung": item.bemerkung
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Exportierte Daten");

    // Generate filename with timestamp
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Export_Daten_${dateStr}.xlsx`);

    showToast('Excel-Datei heruntergeladen!', 'success');
}

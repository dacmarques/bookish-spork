/**
 * Tool 1 - Charts Module
 * Renders SVG-based charts (Sparklines, Bar, Pie) without external libraries
 */

/**
 * Render a simple SVG sparkline
 * @param {Array<number>} data - Array of values
 * @param {string} elementId - ID of the SVG element
 * @param {Object} options - { color, strokeWidth }
 */
export function renderSparkline(data, elementId, options = {}) {
    const svg = document.getElementById(elementId);
    if (!svg || !data || data.length < 2) return;

    // Clear previous
    svg.innerHTML = '';

    const width = 100;
    const height = 30;
    const padding = 2;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Generate points
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
        const normalizedVal = (val - min) / range;
        const y = height - (normalizedVal * (height - 2 * padding) + padding);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    // Create polyline
    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', points.join(' '));
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', options.color || '#6366f1'); // Indigo-500
    polyline.setAttribute('stroke-width', options.strokeWidth || '2');
    polyline.setAttribute('stroke-linecap', 'round');
    polyline.setAttribute('stroke-linejoin', 'round');

    // Create fill area (optional, for aesthetics)
    const areaPoints = [
        `${padding},${height}`,
        ...points,
        `${width - padding},${height}`
    ];

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', areaPoints.join(' '));
    polygon.setAttribute('fill', options.fillColor || '#e0e7ff'); // Indigo-100
    polygon.setAttribute('opacity', '0.3');
    polygon.setAttribute('stroke', 'none');

    svg.appendChild(polygon);
    svg.appendChild(polyline);
}

/**
 * Render a simple bar chart
 * @param {Array<{label: string, value: number}>} data 
 * @param {string} containerId 
 */
export function renderBarChart(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !data || data.length === 0) return;

    const maxVal = Math.max(...data.map(d => d.value));

    let html = '<div class="space-y-3">';

    data.forEach(item => {
        const percentage = (item.value / maxVal) * 100;
        html += `
            <div>
                <div class="flex justify-between text-xs mb-1">
                    <span class="font-medium text-slate-700 truncate w-24" title="${item.label}">${item.label}</span>
                    <span class="text-slate-500">${item.value}</span>
                </div>
                <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-indigo-500 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

/**
 * Render a simple pie chart
 * @param {Array<{label: string, value: number, color: string}>} data 
 * @param {string} containerId 
 */
export function renderPieChart(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !data || data.length === 0) return;

    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    // SVG Config
    const size = 150;
    const center = size / 2;
    const radius = size / 2;

    let currentAngle = 0;
    const slices = data.map(item => {
        const angle = (item.value / total) * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        currentAngle += angle;

        // Calculate coordinates
        const x1 = center + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = center + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = center + radius * Math.cos(Math.PI * endAngle / 180);
        const y2 = center + radius * Math.sin(Math.PI * endAngle / 180);

        // SVG Path command
        // M center center L x1 y1 A radius radius 0 largeArc sweep x2 y2 Z
        const largeArc = angle > 180 ? 1 : 0;
        const d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        return {
            d,
            color: item.color || '#cbd5e1',
            label: item.label,
            percentage: Math.round((item.value / total) * 100)
        };
    });

    // Default colors if not provided
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    let svgHtml = `<svg width="${size}" height="${size}" viewBox="-10 -10 ${size + 20} ${size + 20}" class="transform -rotate-90">`;

    slices.forEach((slice, i) => {
        const color = slice.color || colors[i % colors.length];
        svgHtml += `<path d="${slice.d}" fill="${color}" stroke="white" stroke-width="2" class="hover:opacity-80 transition-opacity" />`;
    });

    svgHtml += `</svg>`;

    // Legend
    let legendHtml = `<div class="ml-6 space-y-2 text-xs">`;
    data.forEach((item, i) => {
        const color = item.color || colors[i % colors.length];
        const percent = Math.round((item.value / total) * 100);
        legendHtml += `
            <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background-color: ${color}"></span>
                <span class="text-slate-600 font-medium">${item.label}</span>
                <span class="text-slate-400">(${percent}%)</span>
            </div>
        `;
    });
    legendHtml += `</div>`;

    container.innerHTML = `<div class="flex items-center justify-center">${svgHtml}${legendHtml}</div>`;
}

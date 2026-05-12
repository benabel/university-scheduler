import { dom } from "../model/dom.js";

export function createAnalysisDiv(analysis) {
    const container = document.createElement('div');

    if (!analysis || !analysis.constraints) {
        const p = document.createElement('p');
        p.textContent = 'No analysis available.';
        container.appendChild(p);
        return container;
    }

    // Score line
    const scoreP = document.createElement('p');
    const scoreStrong = document.createElement('strong');
    scoreStrong.textContent = 'Score:';
    scoreP.appendChild(scoreStrong);
    scoreP.appendChild(document.createTextNode(` ${String(analysis.score || '—')}`));
    container.appendChild(scoreP);

    // Table
    const table = document.createElement('table');
    table.className = 'sf-table';

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Constraint', 'Type', 'Score', 'Matches'].forEach(label => {
        const th = document.createElement('th');
        th.textContent = label;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');
    analysis.constraints.forEach((constraint) => {
        const row = document.createElement('tr');
        const matchCount = constraint.matchCount != null
            ? constraint.matchCount
            : constraint.matches?.length || 0;

        [constraint.name || '',
         constraint.constraintType || constraint.type || '',
         constraint.score || '',
         String(matchCount)].forEach(value => {
            const td = document.createElement('td');
            td.textContent = String(value);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);
    container.appendChild(table);

    return container;
}

export function showAnalysis(analysis) {
	const modal = dom.analysisModal;
	if (!modal) return;
	modal.setBody(createAnalysisDiv(analysis));
	modal.open();
}

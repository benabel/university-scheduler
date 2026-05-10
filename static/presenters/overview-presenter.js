/* overview-presenter.js — Transforms raw data to viewModel for Overview table
 *
 * Pure logic — testable without browser, SF, or DOM
 * Pure functions: (data, uiModel) -> { rows, columns } for SF.createTable
 * Contains rendering business logic for the Overview view
 */

/**
 * Transform data to overview table viewModel
 * @param {Object} data - Raw data
 * @param {Object} uiModel - UI model containing views, constraints, entities
 * @returns {Object} - { columns, rows } viewModel for SF.createTable
 */
export function presentOverview(data, uiModel) {
	if (!uiModel || !uiModel.views) {
		return presentEmptyOverview();
	}

	const viewCount = uiModel.views.length;
	const constraintCount = (uiModel.constraints || []).length;
	const score = data.score || "—";

	return {
		columns: ["Active views", "Constraints", "Current score"],
		rows: [[String(viewCount), String(constraintCount), String(score)]],
	};
}

/**
 * Transform entity/fact data to tables viewModel
 * @param {Object} data - Raw data
 * @param {Object} uiModel - UI model containing entities and facts
 * @returns {Array<{title: string, columns: string[], rows: any[][]}>} - Array of table viewModels
 */
export function presentDataTables(data, uiModel) {
	const tables = [];

	if (!uiModel) {
		return tables;
	}

	// Process entities and facts
	const allEntries = (uiModel.entities || []).concat(uiModel.facts || []);

	allEntries.forEach((entry) => {
		const rows = data[entry.plural] || [];
		if (!rows.length) return;

		const cols = Object.keys(rows[0]).filter(
			(key) => key !== "score" && key !== "solverStatus",
		);
		const values = rows.map((row) =>
			cols.map((key) => {
				const value = row[key];
				if (value == null) return "—";
				if (Array.isArray(value)) return value.join(", ");
				if (typeof value === "object") return JSON.stringify(value);
				return String(value);
			}),
		);

		tables.push({
			title: entry.label,
			columns: cols,
			rows: values,
		});
	});

	return tables;
}

/**
 * Fallback for empty overview
 * @returns {Object}
 */
function presentEmptyOverview() {
	return {
		columns: ["Active views", "Constraints", "Current score"],
		rows: [["0", "0", "—"]],
	};
}

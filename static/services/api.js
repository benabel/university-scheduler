/* api.js — Pure fetch utilities
 *
 * Infrastructure singletons — created once, never reactive
 * Pure fetch: URL input -> JSON output
 * Zero state, zero DOM
 */

/**
 * Fetch JSON from a path with error handling
 * @param {string} path - URL path to fetch
 * @param {string} label - Label for error messages
 * @returns {Promise<any>}
 */
export function requestJson(path, label) {
	return fetch(path).then((response) => {
		if (!response.ok) {
			throw new Error(`${label} returned HTTP ${response.status}`);
		}
		return response.json();
	});
}

/**
 * Fetch the demo data catalog
 * @returns {Promise<{defaultId: string, availableIds: string[]}>}
 */
export async function fetchDemoCatalog() {
	return requestJson("/demo-data", "demo data catalog");
}

/**
 * Fetch a specific demo plan by ID
 * @param {string} demoId - Demo ID
 * @returns {Promise<any>}
 */
export async function fetchDemoPlan(demoId) {
	return requestJson(
		`/demo-data/${encodeURIComponent(demoId)}`,
		`demo data "${demoId}"`,
	);
}

/**
 * Load configuration and UI model
 * @returns {Promise<{config: any, uiModel: any}>}
 */
export async function loadConfigAndUiModel() {
	const config = await fetch("/sf-config.json").then((r) => r.json());
	const uiModel = await fetch("/generated/ui-model.json").then((r) => r.json());
	return { config, uiModel };
}

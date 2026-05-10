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
export async function requestJson(path, label) {
	const response = await fetch(path);
	if (!response.ok) {
		throw new Error(`${label} returned HTTP ${response.status}`);
	}
	return response.json();
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
	const config = await requestJson("/sf-config.json", "config");
	const uiModel = await requestJson("/generated/ui-model.json", "UI model");
	return { config, uiModel };
}

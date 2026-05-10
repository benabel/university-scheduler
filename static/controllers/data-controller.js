/* data-controller.js — Manages demo data loading and state
 *
 * MVP Supervising Presenter layer
 * Orchestrates Model <-> View: reads state, calls presenters,
 * pushes viewModels to SF
 * Only layer that knows all other layers
 */

import {
	fetchDemoCatalog,
	fetchDemoPlan,
	requestJson,
} from "../services/api.js";
import { state } from "../state.js";

/**
 * Bootstrap demo data - loads catalog and default plan
 * @returns {Promise<Object>} - Loaded demo data
 */
export async function bootstrapDemoData() {
	try {
		const catalog = await fetchDemoCatalog();
		clearBootstrapError();

		const defaultId = catalog.defaultId;
		if (!defaultId) {
			throw new Error("demo data catalog is unavailable");
		}

		const data = await fetchDemoPlan(defaultId);
		state.set("currentPlan", clonePlan(data));
		state.set("demoCatalog", catalog);

		return data;
	} catch (err) {
		reportBootstrapError(err);
		throw err;
	}
}

/**
 * Load configuration and UI model
 * @returns {Promise<{config: Object, uiModel: Object}>}
 */
export async function loadConfigAndUiModel() {
	try {
		const config = await fetch("/sf-config.json").then((r) => r.json());
		const uiModel = await fetch("/generated/ui-model.json").then((r) =>
			r.json(),
		);

		state.set("config", config);
		state.set("uiModel", uiModel);

		return { config, uiModel };
	} catch (error) {
		console.error("Failed to load config or UI model:", error);
		throw error;
	}
}

/**
 * Fetch demo catalog (wrapper for backwards compatibility)
 * @returns {Promise<Object>}
 */
export { fetchDemoCatalog };

/**
 * Fetch demo plan (wrapper for backwards compatibility)
 * @param {string} demoId - Demo ID
 * @returns {Promise<Object>}
 */
export { fetchDemoPlan };

/**
 * Clear bootstrap error
 */
export function clearBootstrapError() {
	state.set("bootstrapError", null);
	const app = document.getElementById("sf-app");
	if (app) {
		const bootstrapNotice = app.querySelector(".bootstrap-notice");
		if (bootstrapNotice) {
			bootstrapNotice.textContent = "";
			bootstrapNotice.style.display = "none";
		}
		delete app.dataset.bootstrapError;
	}
}

/**
 * Report bootstrap error
 * @param {Error} err - Error to report
 */
export function reportBootstrapError(err) {
	const errorMessage = describeError(err);
	state.set("bootstrapError", errorMessage);

	const app = document.getElementById("sf-app");
	if (app) {
		const bootstrapNotice = app.querySelector(".bootstrap-notice");
		if (bootstrapNotice) {
			bootstrapNotice.textContent = `Demo data bootstrap failed: ${errorMessage}`;
			bootstrapNotice.style.display = "";
		}
		app.dataset.bootstrapError = "true";
	}
	console.error("Demo data bootstrap failed:", err);
}

/**
 * Describe error for display
 * @param {Error} err - Error to describe
 * @returns {string}
 */
export function describeError(err) {
	if (err?.message) {
		return err.message;
	}
	return String(err || "unknown error");
}

/**
 * Clone plan (deep copy)
 * @param {Object} data - Data to clone
 * @returns {Object} - Deep copy
 */
export function clonePlan(data) {
	return JSON.parse(JSON.stringify(data));
}

/**
 * Check if we can solve
 * @returns {boolean}
 */
export function canSolve() {
	return !state.get("bootstrapError") && !!state.get("demoCatalog")?.defaultId;
}

/**
 * Request JSON (wrapper for backwards compatibility)
 * @param {string} path - URL path
 * @param {string} label - Label for error messages
 * @returns {Promise<any>}
 */
export { requestJson };

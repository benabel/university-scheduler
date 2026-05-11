/* data.js — Manages demo data loading and state */

import { dom } from "../model/dom.js";
import { state } from "../model/state.js";

// Fetch JSON helper
export function requestJson(path, label) {
	return fetch(path).then((response) => {
		if (!response.ok) {
			throw new Error(`${label} returned HTTP ${response.status}`);
		}
		return response.json();
	});
}

// Load initial config and UI model
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

// Fetch demo catalog
export async function fetchDemoCatalog() {
	try {
		const catalog = await requestJson("/demo-data", "demo data catalog");

		if (
			!catalog ||
			typeof catalog.defaultId !== "string" ||
			!Array.isArray(catalog.availableIds)
		) {
			throw new Error("demo data catalog is missing defaultId or availableIds");
		}
		if (catalog.availableIds.indexOf(catalog.defaultId) === -1) {
			throw new Error(
				"demo data catalog defaultId is not present in availableIds",
			);
		}

		const normalizedCatalog = {
			defaultId: catalog.defaultId,
			availableIds: catalog.availableIds.slice(),
		};

		state.set("demoCatalog", normalizedCatalog);
		return normalizedCatalog;
	} catch (error) {
		console.error("Failed to fetch demo catalog:", error);
		throw error;
	}
}

// Fetch demo plan by ID
export async function fetchDemoPlan(demoId) {
	return requestJson(
		`/demo-data/${encodeURIComponent(demoId)}`,
		`demo data "${demoId}"`,
	);
}

// Bootstrap demo data
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

		return data;
	} catch (err) {
		reportBootstrapError(err);
		throw err;
	}
}

// Clear bootstrap error
export function clearBootstrapError() {
	state.set("bootstrapError", null);
	const app = dom.app;
	if (app) {
		const bootstrapNotice = app.querySelector(".bootstrap-notice");
		if (bootstrapNotice) {
			bootstrapNotice.textContent = "";
			bootstrapNotice.style.display = "none";
		}
		delete app.dataset.bootstrapError;
	}
}

// Report bootstrap error
export function reportBootstrapError(err) {
	const errorMessage = describeError(err);
	state.set("bootstrapError", errorMessage);

	const app = dom.app;
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

// Describe error
export function describeError(err) {
	if (err?.message) {
		return err.message;
	}
	return String(err || "unknown error");
}

// Clone plan (deep copy)
export function clonePlan(data) {
	return JSON.parse(JSON.stringify(data));
}

// Check if we can solve
export function canSolve() {
	return !state.get("bootstrapError") && !!state.get("demoCatalog")?.defaultId;
}

/* main.js — MVC Entry Point for university-scheduler */

import {
	bootstrapDemoData,
	loadConfigAndUiModel,
} from "./controllers/data-controller.js";
import {
	renderAll,
	updateSolveActionAvailability,
} from "./controllers/render-controller.js";

import { initUI } from "./controllers/ui-controller.js";
import { TIMELINE_TONES } from "./state/state.js";

// Global toneForKey function (needed by views)
window.toneForKey = (key) => {
	const text = String(key || "");
	let hash = 0;
	for (let index = 0; index < text.length; index += 1) {
		hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
	}
	return TIMELINE_TONES[hash % TIMELINE_TONES.length];
};

// Global entityLabel function (needed by views)
window.entityLabel = (entity, fallback) => {
	if (!entity) return String(fallback);
	return entity.name || entity.id || fallback;
};

// Initialize the application
async function initApp() {
	try {
		// Step 1: Load configuration and UI model
		const { config, uiModel } = await loadConfigAndUiModel();

		// Step 2: Initialize UI
		initUI();

		// Step 3: Bootstrap demo data
		const data = await bootstrapDemoData();

		// Step 4: Update solve button availability now that demo catalog is loaded
		updateSolveActionAvailability();

		// Step 5: Render all views with initial data
		renderAll(data);

		console.log("✅ Application initialized successfully");
	} catch (error) {
		console.error("❌ Application initialization failed:", error);
		// The error will be displayed via the bootstrap notice in the UI
	}
}

// Start the application
initApp();

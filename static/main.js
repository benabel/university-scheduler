/* main.js — MVC Entry Point for university-scheduler
 *
 * Single entry point — 30 lines max
 * Sequence: config → layout → solver → data
 * No logic, only wiring between layers
 */

import {
	bootstrapDemoData,
	loadConfigAndUiModel,
} from "./controllers/data-controller.js";
import {
	renderAll,
	updateSolveActionAvailability,
} from "./controllers/render-controller.js";
import { initUI } from "./controllers/ui-controller.js";
import { TIMELINE_TONES } from "./state.js";

// Global toneForKey function (needed by views)
window.toneForKey = (key) => {
	const text = String(key || "");
	let hash = 0;
	for (let index = 0; index < text.length; index += 1) {
		hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
	}
	return TIMELINE_TONES[hash % TIMELINE_TONES.length];
};

// Initialize the application
async function initApp() {
	// Step 1: Load configuration and UI model
	const { config, uiModel } = await loadConfigAndUiModel();

	// Step 2: Initialize UI
	initUI();

	// Step 3: Bootstrap demo data
	const data = await bootstrapDemoData();

	// Step 4: Render all views with initial data
	updateSolveActionAvailability();
	renderAll(data);
}

// Start the application
initApp();

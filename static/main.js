/* main.js — MVC Entry Point */

import { bootstrapDemoData } from "./controllers/data.js";
import {
	renderAll,
	updateSolveActionAvailability,
} from "./controllers/render.js";
import { state } from "./model/state.js";
import { initUI } from "./views/init-ui.js";

// Initialize the application
async function initApp() {
	try {
		// Step 1: Initialize state (backend, config, uiModel)
		await state.init();

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

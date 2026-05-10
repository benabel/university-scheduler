/* ui-controller.js — Manages UI initialization and tab switching
 *
 * MVP Supervising Presenter layer
 * Orchestrates Model <-> View: reads state, calls presenters,
 * pushes viewModels to SF
 * Only layer that knows all other layers
 */

import { getRef } from "../services/sf-registry.js";
import { state } from "../state.js";
import { initLayout, renderApiGuide } from "../views/index.js";
import { updateSolveActionAvailability } from "./render-controller.js";
import {
	cancelSolve,
	initSolver,
	loadAndSolve,
	openAnalysis,
	pauseSolve,
	resumeSolve,
	syncLifecycleMarkers,
} from "./solver-controller.js";

/**
 * Initialize the UI
 * @returns {Promise<{config: Object, uiModel: Object}>}
 */
export async function initUI() {
	// Initialize layout
	const config = state.get("config");
	const uiModel = state.get("uiModel");

	const { app, header } = initLayout(config, uiModel);
	console.log(app, header);

	// Initialize solver BEFORE setting up header actions
	// so that action handlers can access the solver from state
	const solver = initSolver();
	state.set("solver", solver);

	// Setup header actions
	setupHeaderActions(header);

	// Setup tab change handler
	setupTabChangeHandler(header);

	// Render API guide
	renderApiGuide(SF, state.get("demoCatalog"));
	updateSolveActionAvailability();

	// Add beforeunload handler
	window.addEventListener("beforeunload", () => {
		const solver = state.get("solver");
		if (solver) {
			// Cleanup will be handled by timeline-manager
		}
	});

	return { config, uiModel };
}

/**
 * Setup header action handlers
 * @param {Object} header - SF header instance
 */
function setupHeaderActions(header) {
	const analysisModal = getRef("analysisModal");

	// Update header with actual action handlers
	header.setActions({
		onSolve: () => {
			loadAndSolve();
		},
		onPause: () => {
			pauseSolve();
		},
		onResume: () => {
			resumeSolve();
		},
		onCancel: () => {
			cancelSolve();
		},
		onAnalyze: () => {
			if (analysisModal) {
				openAnalysis();
			}
		},
	});
}

/**
 * Setup tab change handler
 * @param {Object} header - SF header instance
 */
function setupTabChangeHandler(header) {
	header.onTabChange = (tab) => {
		state.set("activeTab", tab);
		handleTabChange(tab);
	};
}

/**
 * Handle tab change
 * @param {string} tab - Active tab ID
 */
export function handleTabChange(tab) {
	// Get all panels from DOM
	const app = getRef("app") || document.getElementById("sf-app");
	if (!app) return;

	// Hide all content panels
	const allPanels = app.querySelectorAll(".sf-content");
	allPanels.forEach((panel) => {
		panel.style.display = "none";
	});

	// Show the selected panel
	const activePanel = findPanelForTab(tab);
	if (activePanel) {
		activePanel.style.display = "";
	}

	// Special cases for panels that need extra handling
	if (tab === "api") {
		renderApiGuide(SF, state.get("demoCatalog"));
	}
}

/**
 * Find panel for a given tab
 * @param {string} tabId - Tab ID
 * @returns {HTMLElement|null}
 */
function findPanelForTab(tabId) {
	const app = getRef("app") || document.getElementById("sf-app");
	if (!app) return null;

	// Try to find panel by ID
	const panelMap = {
		overview: "sf-overview",
		"by-group": "sf-by-group",
		"by-room": "sf-by-room",
		"by-teacher": "sf-by-teacher",
		data: "sf-tables",
		api: "sf-api-guide",
	};

	if (panelMap[tabId]) {
		const container = document.getElementById(panelMap[tabId]);
		if (container) {
			return container.parentElement;
		}
	}

	// Try to find view panel
	const viewPanel = document.getElementById(`view-${tabId}`);
	if (viewPanel) {
		return viewPanel.parentElement;
	}

	// Fallback: find any panel containing the tab ID
	const allPanels = app.querySelectorAll(".sf-content");
	for (const panel of allPanels) {
		if (
			panel.querySelector(`#sf-${tabId}`) ||
			panel.querySelector(`#view-${tabId}`)
		) {
			return panel;
		}
	}

	return null;
}

/**
 * Sync lifecycle markers to DOM
 * Wraps solver-controller's syncLifecycleMarkers for UI layer
 * @param {Object} meta - Metadata from solver
 */
export { syncLifecycleMarkers };

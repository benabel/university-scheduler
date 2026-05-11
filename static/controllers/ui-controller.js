/* ui-controller.js — Manages UI orchestration and tab switching */

import { state } from "../model/state.js";
import {
	renderApiGuide,
	updateSolveActionAvailability,
} from "./render.js";
import {
	cancelSolve,
	initSolver,
	loadAndSolve,
	openAnalysis,
	pauseSolve,
	resumeSolve,
} from "./solver.js";
import { createMainLayout, updatePanelVisibility } from "../views/main-layout.js";

// Initialize the UI
export function initUI() {
	const config = state.get("config");
	const uiModel = state.get("uiModel");

	// Define tabs
	const tabs = [
		{ id: "by-group", label: "By Group", icon: "fa-users" },
		{ id: "by-room", label: "By Room", icon: "fa-door-open" },
		{
			id: "by-teacher",
			label: "By Teacher",
			icon: "fa-chalkboard-user",
		},
		{ id: "data", label: "Data", icon: "fa-table" },
		{ id: "api", label: "REST API", icon: "fa-book" },
	];
	state.set("tabs", tabs);

	// Construct View Shell
	const { header, statusBar } = createMainLayout(config, uiModel, tabs);

	state.set("statusBar", statusBar);
	state.set("header", header);

	// Bind Header Actions
	header.actions = {
		onSolve: () => loadAndSolve(),
		onPause: () => pauseSolve(),
		onResume: () => resumeSolve(),
		onCancel: () => cancelSolve(),
		onAnalyze: () => {
			const analysisModal = state.get("analysisModal");
			openAnalysis(analysisModal);
		},
	};

	header.onTabChange = (tab) => {
		state.set("activeTab", tab);
		handleTabChange(tab);
	};

	// Create analysis modal
	const analysisModal = SF.createModal({
		title: "Score Analysis",
		width: "700px",
	});
	state.set("analysisModal", analysisModal);

	// Initialize solver
	initSolver(state.get("backend"), statusBar);

	// Render API guide
	renderApiGuide();
	updateSolveActionAvailability();

	// Add beforeunload handler
	window.addEventListener("beforeunload", () => {
		const solver = state.get("solver");
		if (solver) {
			const { viewTimelines = {}, customTimelines = {} } = dom;
			Object.values(viewTimelines).forEach(t => t?.destroy());
			Object.values(customTimelines).forEach(t => t?.destroy());
		}
	});
}

// Handle tab change
export function handleTabChange(tab) {
	updatePanelVisibility(tab);
}

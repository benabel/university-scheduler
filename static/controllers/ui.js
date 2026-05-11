/* ui.js — Manages UI initialization and tab switching */

import { dom } from "../model/dom.js";
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

// Initialize the UI
export function initUI() {
	const app = document.querySelector("#sf-app");
	dom.app = app;

	const config = state.get("config");
	const uiModel = state.get("uiModel");

	const statusBar = SF.createStatusBar({
		constraints: uiModel?.constraints || [],
	});
	state.set("statusBar", statusBar);

	// Build tabs
	const tabs = [];
	tabs.push({ id: "by-group", label: "By Group", icon: "fa-users" });
	tabs.push({ id: "by-room", label: "By Room", icon: "fa-door-open" });
	tabs.push({
		id: "by-teacher",
		label: "By Teacher",
		icon: "fa-chalkboard-user",
	});
	tabs.push({ id: "data", label: "Data", icon: "fa-table" });
	tabs.push({ id: "api", label: "REST API", icon: "fa-book" });
	state.set("tabs", tabs);

	// Create header
	const header = SF.createHeader({
		logo: "/sf/img/ouroboros.svg",
		title: config?.title || "University Scheduler",
		subtitle: config?.subtitle || "",
		tabs: tabs,
		actions: {
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
				const analysisModal = state.get("analysisModal");
				openAnalysis(analysisModal);
			},
		},
		onTabChange: (tab) => {
			state.set("activeTab", tab);
			handleTabChange(tab);
		},
	});
	state.set("header", header);

	// Append header and status bar
	app.appendChild(header);
	statusBar.bindHeader(header);
	app.appendChild(statusBar.el);

	// Create bootstrap notice
	const bootstrapNotice = SF.el("div", {
		className: "bootstrap-notice",
		style: {
			display: "none",
			padding: "16px",
			marginBottom: "16px",
			borderRadius: "12px",
			border: "1px solid #dc2626",
			background: "#fef2f2",
			color: "#991b1b",
		},
	});
	app.appendChild(bootstrapNotice);

	// Create overview panel
	const overviewPanel = SF.el("div", {
		className: "sf-content",
		style: { display: state.get("activeTab") === "overview" ? "" : "none" },
	});
	const overviewContainer = SF.el("div", { id: "sf-overview" });
	overviewPanel.appendChild(overviewContainer);
	app.appendChild(overviewPanel);

	// Create view panels from uiModel
	const viewPanels = {};
	(uiModel?.views || []).forEach((view) => {
		const panel = SF.el("div", {
			className: "sf-content",
			style: { display: state.get("activeTab") === view.id ? "" : "none" },
		});
		panel.appendChild(SF.el("div", { id: `view-${view.id}` }));
		viewPanels[view.id] = panel;
		app.appendChild(panel);
	});
	dom.viewPanels = viewPanels;

	// Create data panel
	const dataPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const tablesContainer = SF.el("div", { id: "sf-tables" });
	dataPanel.appendChild(tablesContainer);
	app.appendChild(dataPanel);

	// Create API panel
	const apiPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const apiGuideContainer = SF.el("div", { id: "sf-api-guide" });
	apiPanel.appendChild(apiGuideContainer);
	app.appendChild(apiPanel);

	// Create custom view panels
	const byGroupPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byGroupContainer = SF.el("div", { id: "sf-by-group" });
	byGroupPanel.appendChild(byGroupContainer);
	app.appendChild(byGroupPanel);
	viewPanels["by-group"] = byGroupPanel;

	const byRoomPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byRoomContainer = SF.el("div", { id: "sf-by-room" });
	byRoomPanel.appendChild(byRoomContainer);
	app.appendChild(byRoomPanel);
	viewPanels["by-room"] = byRoomPanel;

	const byTeacherPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byTeacherContainer = SF.el("div", { id: "sf-by-teacher" });
	byTeacherPanel.appendChild(byTeacherContainer);
	app.appendChild(byTeacherPanel);
	viewPanels["by-teacher"] = byTeacherPanel;

	// Set all view panels in dom
	dom.viewPanels = {
		...viewPanels,
		"by-group": byGroupPanel,
		"by-room": byRoomPanel,
		"by-teacher": byTeacherPanel,
	};

	// Create footer
	app.appendChild(
		SF.createFooter({
			links: [
				{ label: "SolverForge", url: "https://www.solverforge.org" },
				{ label: "Docs", url: "https://www.solverforge.org/docs" },
			],
		}),
	);

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
			const viewTimelines = dom.viewTimelines || {};
			const customTimelines = dom.customTimelines || {};

			// Destroy all timelines
			Object.keys(viewTimelines).forEach((viewId) => {
				if (viewTimelines[viewId]) {
					viewTimelines[viewId].destroy();
				}
			});
			Object.keys(customTimelines).forEach((key) => {
				if (customTimelines[key]) {
					customTimelines[key].destroy();
				}
			});
		}
	});
}

// Handle tab change
export function handleTabChange(tab) {
	const viewPanels = dom.viewPanels;
	const _activeTab = state.get("activeTab");

	// Hide all panels
	Object.keys(viewPanels).forEach((key) => {
		if (viewPanels[key]?.style) {
			viewPanels[key].style.display = key === tab ? "" : "none";
		}
	});

	// Show/hide specific panels
	const overviewPanel = document.querySelector("#sf-overview")?.parentElement;
	const dataPanel = document.querySelector("#sf-tables")?.parentElement;
	const apiPanel = document.querySelector("#sf-api-guide")?.parentElement;
	const byGroupPanel = viewPanels["by-group"];
	const byRoomPanel = viewPanels["by-room"];
	const byTeacherPanel = viewPanels["by-teacher"];

	if (overviewPanel)
		overviewPanel.style.display = tab === "overview" ? "" : "none";
	if (dataPanel) dataPanel.style.display = tab === "data" ? "" : "none";
	if (apiPanel) apiPanel.style.display = tab === "api" ? "" : "none";
	if (byGroupPanel)
		byGroupPanel.style.display = tab === "by-group" ? "" : "none";
	if (byRoomPanel) byRoomPanel.style.display = tab === "by-room" ? "" : "none";
	if (byTeacherPanel)
		byTeacherPanel.style.display = tab === "by-teacher" ? "" : "none";
}

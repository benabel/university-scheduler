/* ui.js — Manages UI initialization and tab switching */

import { updateSolveActionAvailability } from "../controllers/render.js";
import {
	cancelSolve,
	getAnalysis,
	initSolver,
	loadAndSolve,
	pauseSolve,
	resumeSolve,
} from "../controllers/solver.js";
import { dom } from "../model/dom.js";
import { state } from "../model/state.js";
import { showAnalysis } from "./analysis-modal.js";
import { renderApiGuide } from "./api-guide.js";

// Initialize the UI
export function initUI() {
	const app = document.querySelector("#sf-app");
	dom.app = app;

	const config = state.get("sfConfig");
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
		title: config?.title || "TODO No title provided in config",
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
			onAnalyze: async () => {
				const analysis = await getAnalysis();
				if (analysis) {
					state.set("lastAnalysis", analysis);
					showAnalysis(analysis);
				}
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
	dom.bootstrapNotice = bootstrapNotice;

	// Create overview panel
	const overviewPanel = SF.el("div", {
		className: "sf-content",
		style: { display: state.get("activeTab") === "overview" ? "" : "none" },
	});
	const overviewContainer = SF.el("div", { id: "sf-overview" });
	overviewPanel.appendChild(overviewContainer);
	app.appendChild(overviewPanel);
	dom.overviewPanel = overviewContainer;

	// Create data panel
	const dataPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const dataContainer = SF.el("div", { id: "sf-tables" });
	dataPanel.appendChild(dataContainer);
	app.appendChild(dataPanel);
	dom.tablesPanel = dataContainer;

	// Create API panel
	const apiPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const apiGuidePanel = SF.el("div", {
		id: "sf-api-guide",
		style: "display: flex; align-items: center;  justify-content: center;",
	});
	dom.apiGuidePanel = apiGuidePanel;

	apiPanel.appendChild(apiGuidePanel);
	app.appendChild(apiPanel);
	const defaultDemoId = state.get("sfConfig").defaultDemoId;
	renderApiGuide(apiGuidePanel, defaultDemoId);

	// Create custom view panels
	const byGroupPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byGroupContainer = SF.el("div", { id: "sf-by-group" });
	byGroupPanel.appendChild(byGroupContainer);
	app.appendChild(byGroupPanel);
	dom.byGroupPanel = byGroupPanel;

	const byRoomPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byRoomContainer = SF.el("div", { id: "sf-by-room" });
	byRoomPanel.appendChild(byRoomContainer);
	app.appendChild(byRoomPanel);
	dom.byRoomPanel = byRoomPanel;

	const byTeacherPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byTeacherContainer = SF.el("div", { id: "sf-by-teacher" });
	byTeacherPanel.appendChild(byTeacherContainer);
	app.appendChild(byTeacherPanel);
	dom.byTeacherPanel = byTeacherPanel;

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
	dom.analysisModal = analysisModal;

	// Initialize solver
	initSolver(state.get("backend"), statusBar);

	// Render API guide
	renderApiGuide(state.get("demoCatalog"));
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
	// Show/hide specific panels using dom references
	const overviewParent = dom.overviewPanel?.parentElement;
	const tablesParent = dom.tablesPanel?.parentElement;
	const apiGuideParent = dom.apiGuidePanel?.parentElement;
	const byGroupPanel = dom.byGroupPanel;
	const byRoomPanel = dom.byRoomPanel;
	const byTeacherPanel = dom.byTeacherPanel;

	if (overviewParent)
		overviewParent.style.display = tab === "overview" ? "" : "none";
	if (tablesParent) tablesParent.style.display = tab === "data" ? "" : "none";
	if (apiGuideParent)
		apiGuideParent.style.display = tab === "api" ? "" : "none";
	if (byGroupPanel)
		byGroupPanel.style.display = tab === "by-group" ? "" : "none";
	if (byRoomPanel) byRoomPanel.style.display = tab === "by-room" ? "" : "none";
	if (byTeacherPanel)
		byTeacherPanel.style.display = tab === "by-teacher" ? "" : "none";
}

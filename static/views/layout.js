/* layout.js — Layout construction and lifecycle
 *
 * SF element construction and lifecycle
 * Contains no business logic
 * Does not read state directly
 */

import { backend } from "../services/sf-backend.js";
import { registerRef } from "../services/sf-registry.js";

/**
 * Initialize the application layout
 * @param {Object} config - Application configuration
 * @param {Object} uiModel - UI model from solver
 * @returns {Object} - { app, header, statusBar, analysisModal }
 */
export function initLayout(config, uiModel) {
	// Get or create app container
	let app = document.querySelector("#sf-app");
	if (!app) {
		app = document.createElement("div");
		app.id = "sf-app";
		document.body.appendChild(app);
	}
	registerRef("app", app);

	// Register backend
	registerRef("backend", backend);

	// Create status bar
	const statusBar = SF.createStatusBar({
		constraints: uiModel?.constraints || [],
	});
	registerRef("statusBar", statusBar);

	// Build tabs from uiModel
	const tabs = buildTabsFromUiModel(uiModel);

	// Create header
	const header = SF.createHeader({
		logo: "/sf/img/ouroboros.svg",
		title: config?.title || "University Scheduler",
		subtitle: config?.subtitle || "",
		tabs: tabs,
		actions: {
			onSolve: () => {},
			onPause: () => {},
			onResume: () => {},
			onCancel: () => {},
			onAnalyze: () => {},
		},
		onTabChange: () => {},
	});
	registerRef("header", header);

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

	// Create all content panels
	createContentPanels(app, uiModel);

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
	registerRef("analysisModal", analysisModal);

	return { app, header, statusBar, analysisModal };
}

/**
 * Build tabs from UI model
 * @param {Object} uiModel - UI model
 * @returns {Array} - Array of tab definitions
 */
function buildTabsFromUiModel(uiModel) {
	const tabs = [];

	// Add custom tabs for domain-specific views
	tabs.push({ id: "by-group", label: "By Group", icon: "fa-users" });
	tabs.push({ id: "by-room", label: "By Room", icon: "fa-door-open" });
	tabs.push({
		id: "by-teacher",
		label: "By Teacher",
		icon: "fa-chalkboard-user",
	});
	tabs.push({ id: "data", label: "Data", icon: "fa-table" });
	tabs.push({ id: "api", label: "REST API", icon: "fa-book" });

	// Add tabs from uiModel views
	(uiModel?.views || []).forEach((view) => {
		// Avoid duplicate tabs
		if (!tabs.some((t) => t.id === view.id)) {
			tabs.push({
				id: view.id,
				label: view.label || view.id,
				icon: "fa-chart-gantt",
			});
		}
	});

	return tabs;
}

/**
 * Create all content panels
 * @param {HTMLElement} app - App container
 * @param {Object} uiModel - UI model
 */
function createContentPanels(app, uiModel) {
	// Create overview panel
	const overviewPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const overviewContainer = SF.el("div", { id: "sf-overview" });
	overviewPanel.appendChild(overviewContainer);
	app.appendChild(overviewPanel);

	// Create view panels from uiModel
	(uiModel?.views || []).forEach((view) => {
		const panel = SF.el("div", {
			className: "sf-content",
			style: { display: "none" },
		});
		panel.appendChild(SF.el("div", { id: `view-${view.id}` }));
		app.appendChild(panel);
	});

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

	const byRoomPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byRoomContainer = SF.el("div", { id: "sf-by-room" });
	byRoomPanel.appendChild(byRoomContainer);
	app.appendChild(byRoomPanel);

	const byTeacherPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	const byTeacherContainer = SF.el("div", { id: "sf-by-teacher" });
	byTeacherPanel.appendChild(byTeacherContainer);
	app.appendChild(byTeacherPanel);
}

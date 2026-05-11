/* main-layout.js — Handles the primary application shell and panel visibility */

import { dom } from "../model/dom.js";

export function createMainLayout(config, uiModel, tabs) {
	const app = document.querySelector("#sf-app");
	dom.app = app;

	// Create Header
	const header = SF.createHeader({
		logo: "/sf/img/ouroboros.svg",
		title: config?.title || "University Scheduler",
		subtitle: config?.subtitle || "",
		tabs: tabs,
		// actions and onTabChange will be bound by the controller
	});

	// Create Status Bar
	const statusBar = SF.createStatusBar({
		constraints: uiModel?.constraints || [],
	});
	statusBar.bindHeader(header);

	// Overview Panel
	const overviewPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	overviewPanel.appendChild(SF.el("div", { id: "sf-overview" }));

	// View Panels from uiModel
	const viewPanels = {};
	(uiModel?.views || []).forEach((view) => {
		const panel = SF.el("div", {
			className: "sf-content",
			style: { display: "none" },
		});
		panel.appendChild(SF.el("div", { id: `view-${view.id}` }));
		viewPanels[view.id] = panel;
	});

	// Data Panel
	const dataPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	dataPanel.appendChild(SF.el("div", { id: "sf-tables" }));

	// API Panel
	const apiPanel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	apiPanel.appendChild(SF.el("div", { id: "sf-api-guide" }));

	// Custom Panels
	const customPanels = {
		"by-group": createSimplePanel("sf-by-group"),
		"by-room": createSimplePanel("sf-by-room"),
		"by-teacher": createSimplePanel("sf-by-teacher"),
	};

	const allPanels = {
		overview: overviewPanel,
		data: dataPanel,
		api: apiPanel,
		...viewPanels,
		...customPanels,
	};

	// Assembly
	app.appendChild(header);
	app.appendChild(statusBar.el);

	// Append all panels in a consistent order or based on config
	Object.values(allPanels).forEach((panel) => app.appendChild(panel));

	app.appendChild(
		SF.createFooter({
			links: [
				{ label: "SolverForge", url: "https://www.solverforge.org" },
				{ label: "Docs", url: "https://www.solverforge.org/docs" },
			],
		}),
	);

	dom.viewPanels = allPanels;

	return { header, statusBar };
}

function createSimplePanel(id) {
	const panel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	panel.appendChild(SF.el("div", { id }));
	return panel;
}

export function updatePanelVisibility(activeTab) {
	const viewPanels = dom.viewPanels;
	Object.keys(viewPanels).forEach((key) => {
		if (viewPanels[key]?.style) {
			viewPanels[key].style.display = key === activeTab ? "" : "none";
		}
	});
}


function createSimplePanel(id) {
	const panel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	panel.appendChild(SF.el("div", { id }));
	return panel;
}

export function updatePanelVisibility(activeTab) {
	const viewPanels = dom.viewPanels;
	Object.keys(viewPanels).forEach((key) => {
		if (viewPanels[key]?.style) {
			viewPanels[key].style.display = key === activeTab ? "" : "none";
		}
	});
}


function createSimplePanel(id) {
	const panel = SF.el("div", {
		className: "sf-content",
		style: { display: "none" },
	});
	panel.appendChild(SF.el("div", { id }));
	return panel;
}

export function updatePanelVisibility(activeTab) {
	const viewPanels = dom.viewPanels;
	Object.keys(viewPanels).forEach((key) => {
		if (viewPanels[key]?.style) {
			viewPanels[key].style.display = key === activeTab ? "" : "none";
		}
	});
}

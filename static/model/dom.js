/* dom.js — Centralized DOM element references */

// DOM element references
const dom = {
	// Main panel
	app: null,

	// Content containers
	overviewPanel: null,
	tablesPanel: null,
	apiGuidePanel: null,
	byGroupPanel: null,
	byRoomPanel: null,
	byTeacherPanel: null,
	bootstrapNotice: null,
	analysisModal: null,

	// View containers (individual view divs)
	viewContainers: {},

	// View panels (parent containers)
	viewPanels: {},
	viewTimelines: {},
	customTimelines: {},
};

export { dom };

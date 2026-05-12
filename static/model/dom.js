/* dom.js — Centralized DOM element references */

// DOM element references
const dom = {
	// Main panel
	app: null,

	// panels
	overviewPanel: null,
	tablesPanel: null,
	apiGuidePanel: null,
	byGroupPanel: null,
	byRoomPanel: null,
	byTeacherPanel: null,

	// UI elements
	bootstrapNotice: null,
	analysisModal: null,

	// View containers (individual view divs)
	viewContainers: {},

	// View panels (parent containers)
	viewTimelines: {},
	customTimelines: {},
};

export { dom };

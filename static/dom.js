/* dom.js — Centralized DOM element references for university-scheduler */

// DOM element references
const dom = {
	// Main container
	app: null,

	// View containers
	viewPanels: {},
	viewTimelines: {},
	customTimelines: {},

	// Reset references
	reset() {
		this.app = null;
		this.viewPanels = {};
		this.viewTimelines = {};
		this.customTimelines = {};
	},
};

export { dom };

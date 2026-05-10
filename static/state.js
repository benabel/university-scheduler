/* state.js — Centralized state management for university-scheduler */

// Constants
export const SLOT_MINUTES = 60;
export const DEFAULT_VIEWPORT_SLOTS = 12;
export const TIMELINE_TONES = [
	"emerald",
	"blue",
	"amber",
	"rose",
	"violet",
	"slate",
];

// Initial state
const initialState = {
	// Config and UI model
	config: null,
	uiModel: null,

	// UI objects
	backend: null,
	header: null,
	statusBar: null,
	analysisModal: null,

	// Data state
	currentPlan: null,
	lastAnalysis: null,
	bootstrapError: null,
	demoCatalog: { defaultId: null, availableIds: [] },
	activeTab: "overview",

	// Solver state
	solver: null,

	// UI tabs
	tabs: [],
};

// Central state class with listeners
class AppState {
	constructor() {
		this.state = { ...initialState };
		this.listeners = new Set();
	}

	getState() {
		return { ...this.state };
	}

	get(prop) {
		return this.state[prop];
	}

	set(prop, value) {
		this.state[prop] = value;
		this.notify();
	}

	setMany(newState) {
		this.state = { ...this.state, ...newState };
		this.notify();
	}

	reset() {
		this.state = { ...initialState };
		this.notify();
	}

	subscribe(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	notify() {
		this.listeners.forEach((listener) => {
			listener(this.getState());
		});
	}
}

// Singleton instance
export const state = new AppState();

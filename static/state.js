/* state.js — Centralized state management for university-scheduler
 *
 * AppState: single source of truth with Observer pattern
 * Contains only observable business data:
 * currentPlan, demoCatalog, activeTab, lastAnalysis
 * No project internals, knows neither DOM nor SF
 */

// Initial state - business data only
const initialState = {
	// Config and UI model
	config: null,
	uiModel: null,

	// Data state
	currentPlan: null,
	lastAnalysis: null,
	bootstrapError: null,
	demoCatalog: { defaultId: null, availableIds: [] },
	activeTab: "overview",

	// Solver state
	solver: null,
};

// Central state class with listeners (Observer pattern)
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

// Re-export constants for backwards compatibility
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

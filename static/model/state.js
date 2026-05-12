/* state.js — Centralized state management */

import { requestJson } from "../services/api.js";

// Initial state
const initialState = {
	// Config and UI model
	sfConfig: null,
	uiModel: null,

	// UI objects
	header: null,
	statusBar: null,

	// Data state
	currentPlan: null,
	lastAnalysis: null,
	bootstrapError: null,
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

	async init() {
		this.set("backend", SF.createBackend({ baseUrl: "" }));
		this.set("sfConfig", await requestJson("/sf-config.json", "sfConfig"));
		this.set(
			"uiModel",
			await requestJson("/generated/ui-model.json", "UI model"),
		);
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

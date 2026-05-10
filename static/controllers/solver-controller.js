/* solver-controller.js — Manages solver lifecycle and operations
 *
 * MVP Supervising Presenter layer
 * Orchestrates Model <-> View: reads state, calls presenters,
 * pushes viewModels to SF
 * Only layer that knows all other layers
 */

import { backend } from "../services/sf-backend.js";
import { getRef } from "../services/sf-registry.js";
import { state } from "../state.js";
import { canSolve, clonePlan, fetchDemoPlan } from "./data-controller.js";
import { renderAll } from "./render-controller.js";

/**
 * Initialize the solver
 * @returns {Object} - Solver instance
 */
export function initSolver() {
	const statusBar = getRef("statusBar");
	const solver = SF.createSolver({
		backend: backend,
		statusBar: statusBar,
		onProgress: (meta) => {
			syncLifecycleMarkers(meta);
		},
		onPauseRequested: (meta) => {
			syncLifecycleMarkers(meta);
		},
		onSolution: (snapshot, meta) => {
			if (snapshot?.solution) {
				state.set("currentPlan", clonePlan(snapshot.solution));
				renderAll(snapshot.solution);
			}
			syncLifecycleMarkers(meta);
		},
		onPaused: (snapshot, meta) => {
			if (snapshot?.solution) {
				state.set("currentPlan", clonePlan(snapshot.solution));
				renderAll(snapshot.solution);
			}
			syncLifecycleMarkers(meta);
		},
		onResumed: (meta) => {
			syncLifecycleMarkers(meta);
		},
		onCancelled: (snapshot, meta) => {
			if (snapshot?.solution) {
				state.set("currentPlan", clonePlan(snapshot.solution));
				renderAll(snapshot.solution);
			}
			syncLifecycleMarkers(meta);
		},
		onComplete: (snapshot, meta) => {
			if (snapshot?.solution) {
				state.set("currentPlan", clonePlan(snapshot.solution));
				renderAll(snapshot.solution);
			}
			syncLifecycleMarkers(meta);
		},
		onFailure: (message, meta, snapshot, analysis) => {
			if (snapshot?.solution) {
				state.set("currentPlan", clonePlan(snapshot.solution));
				renderAll(snapshot.solution);
			}
			if (analysis) {
				state.set("lastAnalysis", analysis);
			}
			console.error("Solver job failed:", message);
			syncLifecycleMarkers(meta);
		},
		onAnalysis: (analysis) => {
			state.set("lastAnalysis", analysis);
			syncLifecycleMarkers();
		},
		onError: (message) => {
			console.error("Solver lifecycle failed:", message);
			syncLifecycleMarkers();
		},
	});

	state.set("solver", solver);
	return solver;
}

/**
 * Load and start solving
 */
export function loadAndSolve() {
	const solver = state.get("solver");
	if (
		solver.isRunning() ||
		solver.getLifecycleState() === "PAUSED" ||
		!canSolve()
	)
		return;

	cleanupTerminalJob()
		.then((data) => data || resolvePlanForSolve())
		.then((data) => solver.start(data))
		.then(() => {
			syncLifecycleMarkers();
		})
		.catch((err) => {
			console.error("Solve start failed:", err);
		});
}

/**
 * Pause solving
 */
export function pauseSolve() {
	const solver = state.get("solver");
	solver
		.pause()
		.then(() => {
			syncLifecycleMarkers();
		})
		.catch((err) => {
			console.error("Pause failed:", err);
		});
}

/**
 * Resume solving
 */
export function resumeSolve() {
	const solver = state.get("solver");
	solver
		.resume()
		.then(() => {
			syncLifecycleMarkers();
		})
		.catch((err) => {
			console.error("Resume failed:", err);
		});
}

/**
 * Cancel solving
 */
export function cancelSolve() {
	const solver = state.get("solver");
	solver
		.cancel()
		.then(() => {
			syncLifecycleMarkers();
		})
		.catch((err) => {
			console.error("Cancel failed:", err);
		});
}

/**
 * Open analysis modal
 */
export async function openAnalysis() {
	const solver = state.get("solver");
	const analysisModal = getRef("analysisModal");
	if (!solver.getJobId() || !analysisModal) return;

	try {
		const analysis = await solver.analyzeSnapshot();
		state.set("lastAnalysis", analysis);
		analysisModal.setBody(buildAnalysisHtml(analysis));
		analysisModal.open();
	} catch (error) {
		console.error("Analysis failed:", error);
	}
}

/**
 * Resolve plan for solving
 * @returns {Promise<Object>}
 */
export function resolvePlanForSolve() {
	const currentPlan = state.get("currentPlan");
	if (currentPlan) {
		return Promise.resolve(clonePlan(currentPlan));
	}
	const catalog = state.get("demoCatalog");
	if (!catalog?.defaultId) {
		return Promise.reject(new Error("demo data catalog is unavailable"));
	}
	return fetchDemoPlan(catalog.defaultId);
}

/**
 * Cleanup terminal job
 * @returns {Promise<Object|null>}
 */
export function cleanupTerminalJob() {
	const solver = state.get("solver");
	const jobState = solver.getLifecycleState();

	if (
		!solver.getJobId() ||
		jobState === "IDLE" ||
		jobState === "PAUSED" ||
		solver.isRunning()
	) {
		return Promise.resolve(null);
	}

	return solver
		.delete()
		.then(() => {
			state.set("lastAnalysis", null);
			syncLifecycleMarkers();
			return null;
		})
		.catch((err) => {
			console.error("Delete failed:", err);
			throw err;
		});
}

/**
 * Sync lifecycle markers with DOM
 * @param {Object} meta - Metadata from solver
 */
export function syncLifecycleMarkers(meta) {
	const solver = state.get("solver");
	const app = document.getElementById("sf-app");

	if (!app) return;

	const jobId = solver.getJobId();
	const snapshotRevision = solver.getSnapshotRevision();
	const lifecycleState = meta?.lifecycleState
		? meta.lifecycleState
		: solver.getLifecycleState();

	if (jobId) {
		app.dataset.jobId = String(jobId);
	} else {
		delete app.dataset.jobId;
	}
	if (snapshotRevision != null) {
		app.dataset.snapshotRevision = String(snapshotRevision);
	} else {
		delete app.dataset.snapshotRevision;
	}
	if (lifecycleState && lifecycleState !== "IDLE") {
		app.dataset.lifecycleState = lifecycleState;
	} else {
		delete app.dataset.lifecycleState;
	}
}

/**
 * Build analysis HTML
 * @param {Object} analysis - Analysis data
 * @returns {string}
 */
function buildAnalysisHtml(analysis) {
	if (!analysis || !analysis.constraints)
		return "<p>No analysis available.</p>";
	let html = `<p><strong>Score:</strong> ${SF.escHtml(analysis.score)}</p>`;
	html +=
		'<table class="sf-table"><thead><tr><th>Constraint</th><th>Type</th><th>Score</th><th>Matches</th></tr></thead><tbody>';
	analysis.constraints.forEach((constraint) => {
		const matchCount =
			constraint.matchCount != null
				? constraint.matchCount
				: constraint.matches
					? constraint.matches.length
					: 0;
		html +=
			"<tr><td>" +
			SF.escHtml(constraint.name) +
			"</td><td>" +
			SF.escHtml(constraint.constraintType || constraint.type || "") +
			"</td><td>" +
			SF.escHtml(constraint.score) +
			"</td><td>" +
			matchCount +
			"</td></tr>";
	});
	html += "</tbody></table>";
	return html;
}

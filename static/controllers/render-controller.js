/* render-controller.js — Manages all rendering operations
 *
 * MVP Supervising Presenter layer
 * Orchestrates Model <-> View: reads state, calls presenters,
 * pushes viewModels to SF
 * Only layer that knows all other layers
 */

import {
	presentByGroup,
	presentByGroupSummary,
	presentByRoom,
	presentByRoomSummary,
	presentByTeacher,
	presentByTeacherSummary,
	presentDataTables,
	presentListView,
	presentOverview,
	presentScalarView,
} from "../presenters/index.js";
import { getRef } from "../services/sf-registry.js";
import { state } from "../state.js";
import { renderApiGuide } from "../views/api-guide-view.js";
import { ensureTimeline } from "../views/timeline-manager.js";
import { canSolve, clonePlan } from "./data-controller.js";

/**
 * Global toneForKey function (needed by views)
 */
window.toneForKey = (key) => {
	const text = String(key || "");
	let hash = 0;
	for (let index = 0; index < text.length; index += 1) {
		hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
	}
	return ["emerald", "blue", "amber", "rose", "violet", "slate"][hash % 6];
};

/**
 * Global entityLabel function (needed by views)
 */
window.entityLabel = (entity, fallback) => {
	if (!entity) return String(fallback);
	return entity.name || entity.id || fallback;
};

/**
 * Render all views with current data
 * @param {Object} data - Raw data to render
 */
export function renderAll(data) {
	const currentPlan = clonePlan(data);
	state.set("currentPlan", currentPlan);

	const uiModel = state.get("uiModel");

	// Render overview
	renderOverview(data, uiModel);

	// Render domain-specific views (By Group, By Room, By Teacher)
	renderCustomViews(data);

	// Render standard views from uiModel
	renderViews(data, uiModel);

	// Render tables
	renderTables(data, uiModel);

	// Render API guide
	renderApiGuide(SF, state.get("demoCatalog"));

	// Update solve action availability
	updateSolveActionAvailability();
}

/**
 * Render overview panel
 * @param {Object} data - Raw data
 * @param {Object} uiModel - UI model
 */
export function renderOverview(data, uiModel) {
	const overviewContainer = document.getElementById("sf-overview");
	if (!overviewContainer) return;

	overviewContainer.innerHTML = "";
	const overviewVm = presentOverview(data, uiModel);

	if ((uiModel?.views || []).length) {
		overviewContainer.appendChild(
			SF.el(
				"p",
				null,
				"The generated views now mount the standard solverforge-ui timeline surface for every planning variable declared in your project.",
			),
		);
		overviewContainer.appendChild(
			SF.createTable({
				columns: overviewVm.columns,
				rows: overviewVm.rows,
			}),
		);
		return;
	}
	overviewContainer.appendChild(
		SF.el(
			"p",
			null,
			"No planning variables are declared yet. Use `solverforge generate entity`, `generate fact`, and `generate variable` to shape the app.",
		),
	);
}

/**
 * Render custom views (By Group, By Room, By Teacher)
 * @param {Object} data - Raw data
 */
function renderCustomViews(data) {
	// By Group view
	renderByGroupView(data);

	// By Room view
	renderByRoomView(data);

	// By Teacher view
	renderByTeacherView(data);
}

/**
 * Render By Group view
 * @param {Object} data - Raw data
 */
function renderByGroupView(data) {
	const byGroupContainer = document.getElementById("sf-by-group");
	if (!byGroupContainer) return;

	const { lanes, axis } = presentByGroup(data);
	const summary = presentByGroupSummary(data);

	byGroupContainer.innerHTML = "";
	byGroupContainer.appendChild(
		SF.createTable({
			columns: summary.columns,
			rows: [summary.values],
		}),
	);

	if (lanes.length > 0) {
		const timeline = ensureTimeline(
			"by-group",
			{
				label: "Groups",
				labelWidth: 280,
				title: "Lessons by Group",
				subtitle: "Group schedule view",
				model: { axis: axis, lanes: applyTonesToLanes(lanes) },
			},
			SF,
		);
		byGroupContainer.appendChild(timeline.el);
	}
}

/**
 * Render By Room view
 * @param {Object} data - Raw data
 */
function renderByRoomView(data) {
	const byRoomContainer = document.getElementById("sf-by-room");
	if (!byRoomContainer) return;

	const { lanes, axis } = presentByRoom(data);
	const summary = presentByRoomSummary(data);

	byRoomContainer.innerHTML = "";
	byRoomContainer.appendChild(
		SF.createTable({
			columns: summary.columns,
			rows: [summary.values],
		}),
	);

	if (lanes.length > 0) {
		const timeline = ensureTimeline(
			"by-room",
			{
				label: "Rooms",
				labelWidth: 280,
				title: "Lessons by Room",
				subtitle: "Room schedule view",
				model: { axis: axis, lanes: applyTonesToLanes(lanes) },
			},
			SF,
		);
		byRoomContainer.appendChild(timeline.el);
	}
}

/**
 * Render By Teacher view
 * @param {Object} data - Raw data
 */
function renderByTeacherView(data) {
	const byTeacherContainer = document.getElementById("sf-by-teacher");
	if (!byTeacherContainer) return;

	const { lanes, axis } = presentByTeacher(data);
	const summary = presentByTeacherSummary(data);

	byTeacherContainer.innerHTML = "";
	byTeacherContainer.appendChild(
		SF.createTable({
			columns: summary.columns,
			rows: [summary.values],
		}),
	);

	if (lanes.length > 0) {
		const timeline = ensureTimeline(
			"by-teacher",
			{
				label: "Teachers",
				labelWidth: 280,
				title: "Lessons by Teacher",
				subtitle: "Teacher schedule view",
				model: { axis: axis, lanes: applyTonesToLanes(lanes) },
			},
			SF,
		);
		byTeacherContainer.appendChild(timeline.el);
	}
}

/**
 * Apply toneForKey to lane items
 * @param {Array} lanes - Array of lane objects
 * @returns {Array} - Lanes with tones applied
 */
function applyTonesToLanes(lanes) {
	return lanes.map((lane) => ({
		...lane,
		items: lane.items.map((item) => ({
			...item,
			tone: item.tone || toneForKey(item.label),
		})),
	}));
}

/**
 * Render standard views from uiModel
 * @param {Object} data - Raw data
 * @param {Object} uiModel - UI model
 */
export function renderViews(data, uiModel) {
	(uiModel?.views || []).forEach((view) => {
		const container = document.getElementById(`view-${view.id}`);
		if (!container) return;

		let payload = null;
		if (view.kind === "list") {
			payload = presentListView(data, view);
		} else {
			payload = presentScalarView(data, view);
		}

		renderTimelinePanel(container, view.id, payload);
	});
}

/**
 * Render timeline panel
 * @param {HTMLElement} container - Container element
 * @param {string} viewId - View ID
 * @param {Object|null} payload - Payload from presenter
 */
function renderTimelinePanel(container, viewId, payload) {
	container.innerHTML = "";
	if (!payload) {
		container.appendChild(SF.el("p", null, "No data available for this view."));
		return;
	}

	container.appendChild(payload.summary);
	const timeline = ensureTimeline(viewId, payload.timeline, SF);
	container.appendChild(timeline.el);
}

/**
 * Render tables
 * @param {Object} data - Raw data
 * @param {Object} uiModel - UI model
 */
export function renderTables(data, uiModel) {
	const tablesContainer = document.getElementById("sf-tables");
	if (!tablesContainer) return;

	tablesContainer.innerHTML = "";
	const tables = presentDataTables(data, uiModel);

	tables.forEach((table) => {
		const section = SF.el("div", { className: "sf-section" });
		section.appendChild(SF.el("h3", null, table.title));
		section.appendChild(
			SF.createTable({ columns: table.columns, rows: table.rows }),
		);
		tablesContainer.appendChild(section);
	});
}

/**
 * Update solve action availability
 */
export function updateSolveActionAvailability() {
	const header = getRef("header");
	if (!header) return;

	const solveButton = findHeaderButton("Solve", header);
	const disabled = !canSolve();
	if (!solveButton) return;
	solveButton.disabled = disabled;
	solveButton.setAttribute("aria-disabled", disabled ? "true" : "false");
	solveButton.title = disabled
		? state.get("bootstrapError")
			? "Demo data bootstrap failed."
			: "Loading demo data catalog..."
		: "";
}

/**
 * Find header button by label
 * @param {string} label - Button label
 * @param {HTMLElement} header - Header element
 * @returns {HTMLElement|null}
 */
export function findHeaderButton(label, header) {
	const h = header || getRef("header");
	if (!h) return null;

	const buttons = h.querySelectorAll("button");
	for (let i = 0; i < buttons.length; i += 1) {
		const text = (buttons[i].textContent || "").trim();
		if (text === label) {
			return buttons[i];
		}
	}
	return null;
}

// Helper for tone application
function toneForKey(key) {
	return window.toneForKey ? window.toneForKey(key) : "blue";
}

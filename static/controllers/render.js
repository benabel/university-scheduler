/* render.js — Manages all rendering operations */

import { dom } from "../model/dom.js";
import { state } from "../model/state.js";
import {
	DEFAULT_VIEWPORT_SLOTS,
	SLOT_MINUTES,
	TIMELINE_TONES,
} from "../utils/constants.js";
import {
	renderByGroup,
	renderByRoom,
	renderByTeacher,
} from "../views/index.js";
import { canSolve, clonePlan } from "./data.js";

// toneForKey function (needed by views)
const toneForKey = (key) => {
	const text = String(key || "");
	let hash = 0;
	for (let index = 0; index < text.length; index += 1) {
		hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
	}
	return TIMELINE_TONES[hash % TIMELINE_TONES.length];
};

// Render all views with current data
export function renderAll(data) {
	const currentPlan = clonePlan(data);
	state.set("currentPlan", currentPlan);

	renderOverview(data);
	renderTables(data);

	// Get panels from dom
	const byGroupPanel = dom.byGroupPanel;
	const byRoomPanel = dom.byRoomPanel;
	const byTeacherPanel = dom.byTeacherPanel;

	// Custom timelines from dom
	const customTimelines = dom.customTimelines || {};

	renderByGroup(
		data,
		byGroupPanel,
		SF,
		toneForKey,
		entityLabel,
		customTimelines,
	);
	renderByRoom(data, byRoomPanel, SF, toneForKey, entityLabel, customTimelines);
	renderByTeacher(
		data,
		byTeacherPanel,
		SF,
		toneForKey,
		entityLabel,
		customTimelines,
	);

	// Update custom timelines in dom
	dom.customTimelines = customTimelines;
}

// Render overview
export function renderOverview(data) {
	const uiModel = state.get("uiModel");
	const overviewPanel = dom.overviewPanel;

	if (!overviewPanel) return;

	overviewPanel.innerHTML = "";
	if ((uiModel?.views || []).length) {
		overviewPanel.appendChild(
			SF.el(
				"p",
				null,
				"The generated views now mount the standard solverforge-ui timeline surface for every planning variable declared in your project.",
			),
		);
		overviewPanel.appendChild(
			SF.createTable({
				columns: ["Constraints", "Current score"],
				rows: [
					[
						String((uiModel.constraints || []).length),
						String(data.score || "—"),
					],
				],
			}),
		);
		return;
	}
	overviewPanel.appendChild(
		SF.el(
			"p",
			null,
			"No planning variables are declared yet. Use `solverforge generate entity`, `generate fact`, and `generate variable` to shape the app.",
		),
	);
}

// Render timeline panel
export function renderTimelinePanel(panel, viewId, payload, emptyMessage) {
	const viewTimelines = dom.viewTimelines;

	panel.innerHTML = "";
	if (!payload) {
		destroyTimeline(viewId);
		panel.appendChild(SF.el("p", null, emptyMessage));
		return;
	}

	panel.appendChild(payload.summary);
	panel.appendChild(ensureTimeline(viewId, payload.timeline, viewTimelines).el);
}

// Ensure timeline
export function ensureTimeline(
	viewId,
	timelineConfig,
	viewTimelinesRef = null,
) {
	const viewTimelines = viewTimelinesRef || dom.viewTimelines;
	let timeline = viewTimelines[viewId];
	if (!timeline) {
		timeline = SF.rail.createTimeline(timelineConfig);
		viewTimelines[viewId] = timeline;
		if (!viewTimelinesRef) {
			dom.viewTimelines = viewTimelines;
		}
		return timeline;
	}
	timeline.setModel(timelineConfig.model);
	return timeline;
}

// Destroy timeline
export function destroyTimeline(viewId) {
	const viewTimelines = dom.viewTimelines;
	const timeline = viewTimelines[viewId];
	if (!timeline) return;
	timeline.destroy();
	delete viewTimelines[viewId];
	dom.viewTimelines = viewTimelines;
}

// Destroy all timelines
export function destroyAllTimelines() {
	const viewTimelines = dom.viewTimelines;
	Object.keys(viewTimelines).forEach((viewId) => {
		destroyTimeline(viewId);
	});

	const customTimelines = dom.customTimelines || {};
	Object.keys(customTimelines).forEach((key) => {
		if (customTimelines[key]) {
			customTimelines[key].destroy();
			delete customTimelines[key];
		}
	});
	dom.customTimelines = customTimelines;
}

// Build scalar view payload
export function buildScalarViewPayload(data, view) {
	const entities = data[view.entityPlural] || [];
	const facts = data[view.sourcePlural] || [];
	if (!entities.length || !facts.length) return null;

	const byIndex = {};
	facts.forEach((fact, index) => {
		byIndex[index] = fact;
	});

	const assignments = facts.map(() => []);
	const detached = [];
	entities.forEach((entity) => {
		const idx = entity[view.variableField];
		if (idx == null || byIndex[idx] == null) {
			detached.push(entity);
			return;
		}
		assignments[idx].push(entity);
	});

	const peakLoad = assignments.reduce(
		(maxCount, items) => Math.max(maxCount, items.length),
		0,
	);
	const horizon = Math.max(peakLoad, detached.length, 1);
	const axis = buildSlotAxis(horizon);
	const lanes = facts.map((fact, factIndex) => {
		const items = assignments[factIndex] || [];
		return {
			id: `${view.id}-lane-${factIndex}`,
			label: String(factLabel(fact, factIndex)),
			mode: "detailed",
			badges: items.length ? [] : ["Empty"],
			stats: [{ label: title(view.entityPlural), value: items.length }],
			items: items.map((entity, itemIndex) =>
				buildTimelineItem(
					`${view.id}-fact-${factIndex}-entity-${itemIndex}`,
					itemIndex,
					entityLabel(entity, itemIndex),
					`Assignment ${String(itemIndex + 1)}`,
					entityLabel(entity, itemIndex),
				),
			),
		};
	});

	if (detached.length) {
		lanes.push({
			id: `${view.id}-detached`,
			label: view.allowsUnassigned ? "Unassigned" : "Unmapped",
			mode: "detailed",
			badges: [view.allowsUnassigned ? "Needs assignment" : "Out of range"],
			stats: [{ label: title(view.entityPlural), value: detached.length }],
			items: detached.map((entity, itemIndex) =>
				buildTimelineItem(
					`${view.id}-detached-${itemIndex}`,
					itemIndex,
					entityLabel(entity, itemIndex),
					view.allowsUnassigned
						? "Awaiting assignment"
						: "Invalid source index",
					entityLabel(entity, itemIndex),
				),
			),
		});
	}

	return {
		summary: buildSummarySection(
			["Source lanes", title(view.entityPlural), "Peak load", "Unassigned"],
			[
				String(facts.length),
				String(entities.length),
				String(peakLoad),
				String(detached.length),
			],
		),
		timeline: {
			label: title(view.sourcePlural),
			labelWidth: 280,
			title: view.label,
			subtitle: `${title(view.entityPlural)} grouped by ${title(view.sourcePlural)}`,
			model: {
				axis: axis,
				lanes: lanes,
			},
		},
	};
}

// Build list view payload
export function buildListViewPayload(data, view) {
	const entities = data[view.entityPlural] || [];
	const facts = data[view.sourcePlural] || [];
	if (!entities.length || !facts.length) return null;

	const byIndex = {};
	facts.forEach((fact, index) => {
		byIndex[index] = fact;
	});

	const rows = entities.map((entity, entityIndex) => {
		const sequence = Array.isArray(entity[view.variableField])
			? entity[view.variableField]
			: [];
		return {
			entity: entity,
			entityIndex: entityIndex,
			sequence: sequence,
		};
	});

	rows.sort((left, right) => {
		if (right.sequence.length !== left.sequence.length) {
			return right.sequence.length - left.sequence.length;
		}
		return String(entityLabel(left.entity, left.entityIndex)).localeCompare(
			String(entityLabel(right.entity, right.entityIndex)),
		);
	});

	const totalItems = rows.reduce((sum, row) => sum + row.sequence.length, 0);
	const longestSequence = rows.reduce(
		(maxCount, row) => Math.max(maxCount, row.sequence.length),
		0,
	);
	const emptyEntities = rows.filter((row) => row.sequence.length === 0).length;
	const horizon = Math.max(longestSequence, 1);
	const axis = buildSlotAxis(horizon);

	const lanes = rows.map((row) => ({
		id: `${view.id}-entity-${row.entityIndex}`,
		label: entityLabel(row.entity, row.entityIndex),
		mode: "detailed",
		badges: listLaneBadges(row.sequence.length, longestSequence),
		stats: [{ label: title(view.sourcePlural), value: row.sequence.length }],
		items: row.sequence.map((factIndex, sequenceIndex) => {
			const fact = byIndex[factIndex];
			return buildTimelineItem(
				`${view.id}-entity-${row.entityIndex}-item-${sequenceIndex}`,
				sequenceIndex,
				factLabel(fact, factIndex),
				`Position ${String(sequenceIndex + 1)}`,
				factLabel(fact, factIndex),
			);
		}),
	}));

	return {
		summary: buildSummarySection(
			[
				title(view.entityPlural),
				title(view.sourcePlural),
				"Longest sequence",
				"Empty lanes",
				"Average items / lane",
			],
			[
				String(rows.length),
				String(totalItems),
				String(longestSequence),
				String(emptyEntities),
				rows.length ? (totalItems / rows.length).toFixed(1) : "0.0",
			],
		),
		timeline: {
			label: title(view.entityPlural),
			labelWidth: 280,
			title: view.label,
			subtitle:
				title(view.sourcePlural) +
				" ordered inside each " +
				title(view.entityPlural),
			model: {
				axis: axis,
				lanes: lanes,
			},
		},
	};
}

// Render tables
export function renderTables(data) {
	const uiModel = state.get("uiModel");
	const tablesPanel = dom.tablesPanel;

	if (!tablesPanel) return;

	tablesPanel.innerHTML = "";
	(uiModel?.entities || []).concat(uiModel?.facts || []).forEach((entry) => {
		const rows = data[entry.plural] || [];
		if (!rows.length) return;
		const cols = Object.keys(rows[0]).filter(
			(key) => key !== "score" && key !== "solverStatus",
		);
		const values = rows.map((row) =>
			cols.map((key) => {
				const value = row[key];
				if (value == null) return "—";
				if (Array.isArray(value)) return value.join(", ");
				if (typeof value === "object") return JSON.stringify(value);
				return String(value);
			}),
		);
		const section = SF.el("div", { className: "sf-section" });
		section.appendChild(SF.el("h3", null, entry.label));
		section.appendChild(SF.createTable({ columns: cols, rows: values }));
		tablesPanel.appendChild(section);
	});
}

// Update solve action availability
export function updateSolveActionAvailability() {
	const header = dom.header;
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

// Find header button
export function findHeaderButton(label, header) {
	const h = header || dom.header;
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

// Build slot axis
export function buildSlotAxis(slotCount) {
	const normalizedSlots = Math.max(slotCount, 1);
	const groupSize = normalizedSlots > 24 ? 8 : normalizedSlots > 12 ? 6 : 4;
	const days = [];
	const ticks = [];

	for (let startSlot = 0; startSlot < normalizedSlots; startSlot += groupSize) {
		const endSlot = Math.min(normalizedSlots, startSlot + groupSize);
		days.push({
			id: `window-${startSlot}`,
			label: `Window ${String(days.length + 1)}`,
			subLabel: slotRangeLabel(startSlot, endSlot),
			startMinute: startSlot * SLOT_MINUTES,
			endMinute: endSlot * SLOT_MINUTES,
		});
	}

	for (let slotIndex = 0; slotIndex < normalizedSlots; slotIndex += 1) {
		ticks.push({
			id: `tick-${slotIndex}`,
			minute: slotIndex * SLOT_MINUTES,
			label: `Slot ${String(slotIndex + 1)}`,
		});
	}

	return {
		startMinute: 0,
		endMinute: normalizedSlots * SLOT_MINUTES,
		days: days,
		ticks: ticks,
		initialViewport: {
			startMinute: 0,
			endMinute:
				Math.min(normalizedSlots, DEFAULT_VIEWPORT_SLOTS) * SLOT_MINUTES,
		},
	};
}

// Build timeline item
export function buildTimelineItem(id, slotIndex, label, meta, toneKey) {
	const SLOT_MINUTES = 60;
	return {
		id: id,
		startMinute: slotIndex * SLOT_MINUTES,
		endMinute: (slotIndex + 1) * SLOT_MINUTES,
		label: String(label),
		meta: meta || "",
		tone: toneForKey(toneKey || label, TIMELINE_TONES),
	};
}

// Slot range label
export function slotRangeLabel(startSlot, endSlot) {
	if (endSlot - startSlot <= 1) {
		return `Slot ${String(startSlot + 1)}`;
	}
	return `Slots ${String(startSlot + 1)}-${String(endSlot)}`;
}

// List lane badges
export function listLaneBadges(length, longestSequence) {
	if (length === 0) return ["Empty"];
	const badges = [];
	if (length === longestSequence) badges.push("Longest");
	if (length === 1) badges.push("Single");
	return badges;
}

// Entity label
export function entityLabel(entity, fallback) {
	if (!entity) return String(fallback);
	return entity.name || entity.id || fallback;
}

// Fact label
export function factLabel(fact, fallback) {
	if (!fact) return String(fallback);
	return fact.name || fact.id || fallback;
}

// Title formatting
export function title(text) {
	return String(text || "")
		.replace(/_/g, " ")
		.replace(/\b\w/g, (match) => match.toUpperCase());
}

// Build summary section
export function buildSummarySection(columns, row) {
	const section = SF.el("div", { className: "sf-section" });
	section.appendChild(
		SF.createTable({
			columns: columns,
			rows: [row],
		}),
	);
	return section;
}

// Build curl command
export function buildCurlCommand(method, path, options) {
	const parts = ["curl"];
	if (options?.stream) {
		parts.push("-N");
	}
	if (method && method !== "GET") {
		parts.push("-X", method);
	}
	if (options?.json) {
		parts.push("-H", '"Content-Type: application/json"');
	}

	const url = buildApiUrl(path);
	parts.push(options?.quoteUrl ? `"${url}"` : url);

	if (options?.data) {
		parts.push("-d", options.data);
	}

	return parts.join(" ");
}

// Build API URL
export function buildApiUrl(path) {
	return currentOrigin() + path;
}

// Current origin
export function currentOrigin() {
	return (
		window.location.origin ||
		`${window.location.protocol}//${window.location.host}`
	);
}

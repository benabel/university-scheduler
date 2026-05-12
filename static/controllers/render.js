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

/* group.js — Render lessons by group */

import { dom } from "../model/dom.js";
import {
	buildAxisFromTimeslots,
	ensureCustomTimeline,
	entityLabel,
	timeslotToMinutes,
} from "../utils/timeline-utils.js";

export function renderByGroup(
	data,
	panel,
	SF,
	toneForKey,
	customTimelinesRef = null,
) {
	const lessons = data.lessons || [];
	const groups = data.groups || [];
	const timeslots = data.timeslots || [];
	const rooms = data.rooms || [];

	if (!lessons.length) {
		panel.innerHTML = "<p>No lessons available.</p>";
		return;
	}

	// Use provided customTimelines or get from dom
	const customTimelines = customTimelinesRef || dom.customTimelines;

	// Créer une lane par groupe existant, même sans lessons
	const byGroup = {};
	groups.forEach((group, idx) => {
		const groupKey = group.name || `Group ${idx}`;
		byGroup[groupKey] = { group: group, lessons: [] };
	});

	// Assigner les lessons aux groupes
	lessons.forEach((lesson) => {
		const groupIdx = lesson.group_idx;
		if (groupIdx == null || !groups[groupIdx]) {
			// Lesson sans groupe : créer une lane "Unassigned"
			const unassignedKey = "Unassigned";
			if (!byGroup[unassignedKey]) {
				byGroup[unassignedKey] = {
					group: { name: unassignedKey },
					lessons: [],
				};
			}
			byGroup[unassignedKey].lessons.push(lesson);
			return;
		}
		const group = groups[groupIdx];
		const groupKey = group.name || `Group ${groupIdx}`;
		if (!byGroup[groupKey]) {
			byGroup[groupKey] = { group: group, lessons: [] };
		}
		byGroup[groupKey].lessons.push(lesson);
	});

	const axis = buildAxisFromTimeslots(timeslots);

	const lanes = Object.entries(byGroup).map((entry) => {
		const groupKey = entry[0];
		const groupData = entry[1];
		const items = groupData.lessons.map((lesson, idx) => {
			const timeslotIdx = lesson.timeslot_idx;
			const timeslot = timeslots[timeslotIdx] || {};
			const roomIdx = lesson.room_idx;
			const room = rooms[roomIdx] || {};
			const tsMinutes = timeslotToMinutes(timeslot);
			return {
				id: `group-${SF.escHtml(groupKey)}-lesson-${idx}`,
				startMinute: tsMinutes.startMinute,
				endMinute: tsMinutes.endMinute,
				label: entityLabel(lesson, idx),
				meta:
					(room.name || `Room ${roomIdx}`) +
					" | " +
					(timeslot.name || timeslot.id || String(timeslotIdx)),
				tone: toneForKey(entityLabel(lesson, idx)),
			};
		});
		return {
			id: `group-${SF.escHtml(groupKey)}`,
			label:
				groupKey + (groupData.group.code ? ` (${groupData.group.code})` : ""),
			mode: "detailed",
			badges: groupData.lessons.length === 0 ? ["No lessons"] : [],
			stats: [{ label: "Lessons", value: groupData.lessons.length }],
			items: items,
		};
	});

	const timeline = ensureCustomTimeline("by-group", customTimelines, SF, {
		label: "Groups",
		labelWidth: 280,
		title: "Lessons by Group",
		subtitle: "Group schedule view",
		model: { axis: axis, lanes: lanes },
	});

	panel.innerHTML = "";
	const realGroupCount = Object.keys(byGroup).filter(
		(key) => key !== "Unassigned",
	).length;
	panel.appendChild(
		SF.createTable({
			columns: ["Total Groups", "Total Lessons"],
			rows: [[String(realGroupCount), String(lessons.length)]],
		}),
	);
	panel.appendChild(timeline.el);

	// Update dom if using dom-managed timelines
	if (!customTimelinesRef) {
		dom.customTimelines = customTimelines;
	}
}

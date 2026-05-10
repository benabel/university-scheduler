/* group-presenter.js — Transforms raw data to viewModel for By Group view
 *
 * Pure logic — testable without browser, SF, or DOM
 * Pure functions: (data) -> viewModel
 * Contains rendering business logic for the By Group view
 */

import {
	buildAxisFromTimeslots,
	timeslotToMinutes,
} from "../../utils/timeline-utils.js";

/**
 * Transform raw data into lanes and axis for By Group view
 * @param {Object} data - Raw data containing lessons, groups, timeslots, rooms
 * @param {Object} uiModel - UI model for reference
 * @returns {Object} - { lanes, axis } viewModel for SF timeline
 */
export function presentByGroup(data) {
	const lessons = data.lessons || [];
	const groups = data.groups || [];
	const timeslots = data.timeslots || [];
	const rooms = data.rooms || [];

	if (!lessons.length) {
		return { lanes: [], axis: buildEmptyAxis() };
	}

	// Create a lane for each existing group, even without lessons
	const byGroup = {};
	groups.forEach((group, idx) => {
		const groupKey = group.name || `Group ${idx}`;
		byGroup[groupKey] = { group: group, lessons: [] };
	});

	// Assign lessons to groups
	lessons.forEach((lesson) => {
		const groupIdx = lesson.group_idx;
		if (groupIdx == null || !groups[groupIdx]) {
			// Lesson without group: create "Unassigned" lane
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
				id: `group-${escapeKey(groupKey)}-lesson-${idx}`,
				startMinute: tsMinutes.startMinute,
				endMinute: tsMinutes.endMinute,
				label: entityLabel(lesson, idx),
				meta:
					(room.name || `Room ${roomIdx}`) +
					" | " +
					(timeslot.name || timeslot.id || String(timeslotIdx)),
				tone: null, // Will be set by view with toneForKey
			};
		});
		return {
			id: `group-${escapeKey(groupKey)}`,
			label:
				groupKey + (groupData.group.code ? ` (${groupData.group.code})` : ""),
			mode: "detailed",
			badges: groupData.lessons.length === 0 ? ["No lessons"] : [],
			stats: [{ label: "Lessons", value: groupData.lessons.length }],
			items: items,
		};
	});

	return { lanes, axis };
}

/**
 * Build summary data for By Group view
 * @param {Object} data - Raw data
 * @returns {Object} - Summary statistics
 */
export function presentByGroupSummary(data) {
	const lessons = data.lessons || [];
	const groups = data.groups || [];
	const byGroup = {};

	groups.forEach((group, idx) => {
		const groupKey = group.name || `Group ${idx}`;
		byGroup[groupKey] = { group: group, lessons: [] };
	});

	lessons.forEach((lesson) => {
		const groupIdx = lesson.group_idx;
		if (groupIdx == null || !groups[groupIdx]) {
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

	const realGroupCount = Object.keys(byGroup).filter(
		(key) => key !== "Unassigned",
	).length;

	return {
		columns: ["Total Groups", "Total Lessons"],
		values: [String(realGroupCount), String(lessons.length)],
	};
}

// Helper functions
function escapeKey(key) {
	return String(key).replace(/[^a-zA-Z0-9-_]/g, "-");
}

function entityLabel(entity, fallback) {
	if (!entity) return String(fallback);
	return entity.name || entity.id || fallback;
}

function buildEmptyAxis() {
	return {
		startMinute: 0,
		endMinute: 600,
		days: [],
		ticks: [],
		initialViewport: { startMinute: 0, endMinute: 600 },
	};
}

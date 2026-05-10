/* room-presenter.js — Transforms raw data to viewModel for By Room view
 *
 * Pure logic — testable without browser, SF, or DOM
 * Pure functions: (data) -> viewModel
 * Contains rendering business logic for the By Room view
 */

import {
	buildAxisFromTimeslots,
	timeslotToMinutes,
} from "../../utils/timeline-utils.js";

/**
 * Transform raw data into lanes and axis for By Room view
 * @param {Object} data - Raw data containing lessons, rooms, timeslots, groups
 * @param {Object} uiModel - UI model for reference
 * @returns {Object} - { lanes, axis } viewModel for SF timeline
 */
export function presentByRoom(data) {
	const lessons = data.lessons || [];
	const rooms = data.rooms || [];
	const timeslots = data.timeslots || [];
	const groups = data.groups || [];

	if (!lessons.length) {
		return { lanes: [], axis: buildEmptyAxis() };
	}

	// Create a lane for each existing room, even without lessons
	const byRoom = {};
	rooms.forEach((room, idx) => {
		const roomKey = room.name || `Room ${idx}`;
		byRoom[roomKey] = { room: room, lessons: [] };
	});

	// Assign lessons to rooms
	lessons.forEach((lesson) => {
		const roomIdx = lesson.room_idx;
		if (roomIdx == null || !rooms[roomIdx]) {
			// Lesson without room: create "Unassigned" lane
			const unassignedKey = "Unassigned";
			if (!byRoom[unassignedKey]) {
				byRoom[unassignedKey] = { room: { name: unassignedKey }, lessons: [] };
			}
			byRoom[unassignedKey].lessons.push(lesson);
			return;
		}
		const room = rooms[roomIdx];
		const roomKey = room.name || `Room ${roomIdx}`;
		if (!byRoom[roomKey]) {
			byRoom[roomKey] = { room: room, lessons: [] };
		}
		byRoom[roomKey].lessons.push(lesson);
	});

	const axis = buildAxisFromTimeslots(timeslots);

	const lanes = Object.entries(byRoom).map((entry) => {
		const roomKey = entry[0];
		const roomData = entry[1];
		const items = roomData.lessons.map((lesson, idx) => {
			const timeslotIdx = lesson.timeslot_idx;
			const timeslot = timeslots[timeslotIdx] || {};
			const groupIdx = lesson.group_idx;
			const group = groups[groupIdx] || {};
			const tsMinutes = timeslotToMinutes(timeslot);
			return {
				id: `room-${escapeKey(roomKey)}-lesson-${idx}`,
				startMinute: tsMinutes.startMinute,
				endMinute: tsMinutes.endMinute,
				label: entityLabel(lesson, idx),
				meta:
					(group.name || `Group ${groupIdx}`) +
					" | " +
					(timeslot.name || timeslot.id || String(timeslotIdx)),
				tone: null, // Will be set by view with toneForKey
			};
		});
		return {
			id: `room-${escapeKey(roomKey)}`,
			label: roomKey + (roomData.room.code ? ` (${roomData.room.code})` : ""),
			mode: "detailed",
			badges: roomData.lessons.length === 0 ? ["Empty"] : [],
			stats: [{ label: "Lessons", value: roomData.lessons.length }],
			items: items,
		};
	});

	return { lanes, axis };
}

/**
 * Build summary data for By Room view
 * @param {Object} data - Raw data
 * @returns {Object} - Summary statistics
 */
export function presentByRoomSummary(data) {
	const lessons = data.lessons || [];
	const rooms = data.rooms || [];
	const byRoom = {};

	rooms.forEach((room, idx) => {
		const roomKey = room.name || `Room ${idx}`;
		byRoom[roomKey] = { room: room, lessons: [] };
	});

	lessons.forEach((lesson) => {
		const roomIdx = lesson.room_idx;
		if (roomIdx == null || !rooms[roomIdx]) {
			const unassignedKey = "Unassigned";
			if (!byRoom[unassignedKey]) {
				byRoom[unassignedKey] = { room: { name: unassignedKey }, lessons: [] };
			}
			byRoom[unassignedKey].lessons.push(lesson);
			return;
		}
		const room = rooms[roomIdx];
		const roomKey = room.name || `Room ${roomIdx}`;
		if (!byRoom[roomKey]) {
			byRoom[roomKey] = { room: room, lessons: [] };
		}
		byRoom[roomKey].lessons.push(lesson);
	});

	const realRoomCount = Object.keys(byRoom).filter(
		(key) => key !== "Unassigned",
	).length;

	return {
		columns: ["Total Rooms", "Total Lessons"],
		values: [String(realRoomCount), String(lessons.length)],
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

/* by-room.js — Render lessons by room */

import {
	buildAxisFromTimeslots,
	ensureCustomTimeline,
	entityLabel,
	timeslotToMinutes,
	toneForKey
} from "../utils/timeline-utils.js";

export function renderByRoom(
	data,
	panel
) {
	const lessons = data.lessons || [];
	const rooms = data.rooms || [];
	const timeslots = data.timeslots || [];
	const groups = data.groups || [];

	if (!lessons.length) {
		panel.innerHTML = "<p>No lessons available.</p>";
		return;
	}

	// TODO remove customTimelines set
	const customTimelines = {};

	// Créer une lane par room existant, même sans lessons
	const byRoom = {};
	rooms.forEach((room, idx) => {
		const roomKey = room.name || `Room ${idx}`;
		byRoom[roomKey] = { room: room, lessons: [] };
	});

	// Assigner les lessons aux rooms
	lessons.forEach((lesson) => {
		const roomIdx = lesson.room_idx;
		if (roomIdx == null || !rooms[roomIdx]) {
			// Lesson sans room : créer une lane "Unassigned"
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
				id: `room-${SF.escHtml(roomKey)}-lesson-${idx}`,
				startMinute: tsMinutes.startMinute,
				endMinute: tsMinutes.endMinute,
				label: entityLabel(lesson, idx),
				meta:
					(group.name || `Group ${groupIdx}`) +
					" | " +
					(timeslot.name || timeslot.id || String(timeslotIdx)),
				tone: toneForKey(entityLabel(lesson, idx)),
			};
		});
		return {
			id: `room-${SF.escHtml(roomKey)}`,
			label: roomKey + (roomData.room.code ? ` (${roomData.room.code})` : ""),
			mode: "detailed",
			badges: roomData.lessons.length === 0 ? ["Empty"] : [],
			stats: [{ label: "Lessons", value: roomData.lessons.length }],
			items: items,
		};
	});

	const timeline = ensureCustomTimeline("by-room", customTimelines, SF, {
		label: "Rooms",
		labelWidth: 280,
		title: "Lessons by Room",
		subtitle: "Room schedule view",
		model: { axis: axis, lanes: lanes },
	});

	panel.innerHTML = "";
	const realRoomCount = Object.keys(byRoom).filter(
		(key) => key !== "Unassigned",
	).length;
	panel.appendChild(
		SF.createTable({
			columns: ["Total Rooms", "Total Lessons"],
			rows: [[String(realRoomCount), String(lessons.length)]],
		}),
	);
	panel.appendChild(timeline.el);


}

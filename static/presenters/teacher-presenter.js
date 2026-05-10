/* teacher-presenter.js — Transforms raw data to viewModel for By Teacher view
 *
 * Pure logic — testable without browser, SF, or DOM
 * Pure functions: (data) -> viewModel
 * Contains rendering business logic for the By Teacher view
 */

import {
	buildAxisFromTimeslots,
	timeslotToMinutes,
} from "../../utils/timeline-utils.js";

/**
 * Transform raw data into lanes and axis for By Teacher view
 * @param {Object} data - Raw data containing lessons, teachers, timeslots, rooms, groups
 * @param {Object} uiModel - UI model for reference
 * @returns {Object} - { lanes, axis } viewModel for SF timeline
 */
export function presentByTeacher(data) {
	const lessons = data.lessons || [];
	const teachers = data.teachers || [];
	const timeslots = data.timeslots || [];
	const rooms = data.rooms || [];
	const groups = data.groups || [];

	if (!lessons.length) {
		return { lanes: [], axis: buildEmptyAxis() };
	}

	// Create a lane for each existing teacher, even without lessons
	const byTeacher = {};
	teachers.forEach((teacher, idx) => {
		const teacherKey = teacher.name || `Teacher ${idx}`;
		byTeacher[teacherKey] = { teacher: teacher, lessons: [] };
	});

	// Assign lessons to teachers
	lessons.forEach((lesson) => {
		const teacherIdx = lesson.teacher_idx;
		if (teacherIdx == null || !teachers[teacherIdx]) {
			// Lesson without teacher: create "Unassigned" lane
			const unassignedKey = "Unassigned";
			if (!byTeacher[unassignedKey]) {
				byTeacher[unassignedKey] = {
					teacher: { name: unassignedKey },
					lessons: [],
				};
			}
			byTeacher[unassignedKey].lessons.push(lesson);
			return;
		}
		const teacher = teachers[teacherIdx];
		const teacherKey = teacher.name || `Teacher ${teacherIdx}`;
		if (!byTeacher[teacherKey]) {
			byTeacher[teacherKey] = { teacher: teacher, lessons: [] };
		}
		byTeacher[teacherKey].lessons.push(lesson);
	});

	const axis = buildAxisFromTimeslots(timeslots);

	const lanes = Object.entries(byTeacher).map((entry) => {
		const teacherKey = entry[0];
		const teacherData = entry[1];
		const items = teacherData.lessons.map((lesson, idx) => {
			const timeslotIdx = lesson.timeslot_idx;
			const timeslot = timeslots[timeslotIdx] || {};
			const roomIdx = lesson.room_idx;
			const room = rooms[roomIdx] || {};
			const groupIdx = lesson.group_idx;
			const group = groups[groupIdx] || {};
			const tsMinutes = timeslotToMinutes(timeslot);
			return {
				id: `teacher-${escapeKey(teacherKey)}-lesson-${idx}`,
				startMinute: tsMinutes.startMinute,
				endMinute: tsMinutes.endMinute,
				label: entityLabel(lesson, idx),
				meta:
					(group.name || `Group ${groupIdx}`) +
					" | " +
					(room.name || `Room ${roomIdx}`) +
					" | " +
					(timeslot.name || timeslot.id || String(timeslotIdx)),
				tone: null, // Will be set by view with toneForKey
			};
		});
		return {
			id: `teacher-${escapeKey(teacherKey)}`,
			label:
				teacherKey +
				(teacherData.teacher.code ? ` (${teacherData.teacher.code})` : ""),
			mode: "detailed",
			badges: teacherData.lessons.length === 0 ? ["Empty"] : [],
			stats: [{ label: "Lessons", value: teacherData.lessons.length }],
			items: items,
		};
	});

	return { lanes, axis };
}

/**
 * Build summary data for By Teacher view
 * @param {Object} data - Raw data
 * @returns {Object} - Summary statistics
 */
export function presentByTeacherSummary(data) {
	const lessons = data.lessons || [];
	const teachers = data.teachers || [];
	const byTeacher = {};

	teachers.forEach((teacher, idx) => {
		const teacherKey = teacher.name || `Teacher ${idx}`;
		byTeacher[teacherKey] = { teacher: teacher, lessons: [] };
	});

	lessons.forEach((lesson) => {
		const teacherIdx = lesson.teacher_idx;
		if (teacherIdx == null || !teachers[teacherIdx]) {
			const unassignedKey = "Unassigned";
			if (!byTeacher[unassignedKey]) {
				byTeacher[unassignedKey] = {
					teacher: { name: unassignedKey },
					lessons: [],
				};
			}
			byTeacher[unassignedKey].lessons.push(lesson);
			return;
		}
		const teacher = teachers[teacherIdx];
		const teacherKey = teacher.name || `Teacher ${teacherIdx}`;
		if (!byTeacher[teacherKey]) {
			byTeacher[teacherKey] = { teacher: teacher, lessons: [] };
		}
		byTeacher[teacherKey].lessons.push(lesson);
	});

	const realTeacherCount = Object.keys(byTeacher).filter(
		(key) => key !== "Unassigned",
	).length;

	return {
		columns: ["Total Teachers", "Total Lessons"],
		values: [String(realTeacherCount), String(lessons.length)],
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

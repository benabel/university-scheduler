/* teacher.js — Render lessons by teacher */

import { dom } from "../dom.js";
import {
	buildAxisFromTimeslots,
	ensureCustomTimeline,
	entityLabel,
	timeslotToMinutes,
} from "../utils/timeline-utils.js";

export function renderByTeacher(
	data,
	container,
	SF,
	toneForKey,
	customTimelinesRef = null,
) {
	const lessons = data.lessons || [];
	const teachers = data.teachers || [];
	const timeslots = data.timeslots || [];
	const rooms = data.rooms || [];
	const groups = data.groups || [];

	if (!lessons.length) {
		container.innerHTML = "<p>No lessons available.</p>";
		return;
	}

	// Use provided customTimelines or get from dom
	const customTimelines = customTimelinesRef || dom.customTimelines;

	// Créer une lane par teacher existant, même sans lessons
	const byTeacher = {};
	teachers.forEach((teacher, idx) => {
		const teacherKey = teacher.name || `Teacher ${idx}`;
		byTeacher[teacherKey] = { teacher: teacher, lessons: [] };
	});

	// Assigner les lessons aux teachers
	lessons.forEach((lesson) => {
		const teacherIdx = lesson.teacher_idx;
		if (teacherIdx == null || !teachers[teacherIdx]) {
			// Lesson sans teacher : créer une lane "Unassigned"
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
				id: `teacher-${SF.escHtml(teacherKey)}-lesson-${idx}`,
				startMinute: tsMinutes.startMinute,
				endMinute: tsMinutes.endMinute,
				label: entityLabel(lesson, idx),
				meta:
					(group.name || `Group ${groupIdx}`) +
					" | " +
					(room.name || `Room ${roomIdx}`) +
					" | " +
					(timeslot.name || timeslot.id || String(timeslotIdx)),
				tone: toneForKey(entityLabel(lesson, idx)),
			};
		});
		return {
			id: `teacher-${SF.escHtml(teacherKey)}`,
			label:
				teacherKey +
				(teacherData.teacher.code ? ` (${teacherData.teacher.code})` : ""),
			mode: "detailed",
			badges: teacherData.lessons.length === 0 ? ["Empty"] : [],
			stats: [{ label: "Lessons", value: teacherData.lessons.length }],
			items: items,
		};
	});

	const timeline = ensureCustomTimeline("by-teacher", customTimelines, SF, {
		label: "Teachers",
		labelWidth: 280,
		title: "Lessons by Teacher",
		subtitle: "Teacher schedule view",
		model: { axis: axis, lanes: lanes },
	});

	container.innerHTML = "";
	const realTeacherCount = Object.keys(byTeacher).filter(
		(key) => key !== "Unassigned",
	).length;
	container.appendChild(
		SF.createTable({
			columns: ["Total Teachers", "Total Lessons"],
			rows: [[String(realTeacherCount), String(lessons.length)]],
		}),
	);
	container.appendChild(timeline.el);

	// Update dom if using dom-managed timelines
	if (!customTimelinesRef) {
		dom.customTimelines = customTimelines;
	}
}

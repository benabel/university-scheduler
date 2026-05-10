/* timeline-utils.js — Utility functions for timeline rendering
 *
 * Pure and stateless utilities
 * Helper functions for axis building and timeslot conversion
 */

import { DAY_MAP, SLOT_MINUTES, WEEKDAYS } from "./constants.js";

/**
 * Parse a time string in "HH:MM:SS" or "HH:MM" format to minutes since midnight
 * @param {string} timeStr - Time string
 * @returns {number} - Minutes since midnight (0-1439)
 */
export function parseTimeToMinutes(timeStr) {
	if (!timeStr) return 0;
	const parts = timeStr.split(":");
	const hours = parseInt(parts[0], 10) || 0;
	const minutes = parseInt(parts[1], 10) || 0;
	// Clamp to valid range (0-1439 for a single day)
	return Math.max(0, Math.min(hours * 60 + minutes, 1439));
}

/**
 * Convert a timeslot to absolute minutes (from Monday 00:00)
 * @param {Object} timeslot - Timeslot object with day_of_week, start_time, end_time
 * @returns {Object} - { startMinute, endMinute }
 */
export function timeslotToMinutes(timeslot) {
	if (!timeslot) return { startMinute: 0, endMinute: SLOT_MINUTES };
	const dayIndex = DAY_MAP[timeslot.day_of_week] || 0;
	const startMin = parseTimeToMinutes(timeslot.start_time);
	let endMin = parseTimeToMinutes(timeslot.end_time);

	// Ensure that endMinute > startMinute
	if (endMin <= startMin) {
		endMin = startMin + SLOT_MINUTES; // Default duration of 60 minutes
	}

	return {
		startMinute: dayIndex * 1440 + startMin,
		endMinute: dayIndex * 1440 + endMin,
	};
}

/**
 * Build axis from timeslots for timeline visualization
 * @param {Array} timeslots - Array of timeslot objects
 * @returns {Object} - Axis configuration with days, ticks, viewport
 */
export function buildAxisFromTimeslots(timeslots) {
	if (!timeslots || !timeslots.length) {
		// Fallback: single day from 8h to 18h
		return {
			startMinute: 0,
			endMinute: 10 * 60, // 10 slots of 60 min
			days: [
				{
					id: "day-0",
					label: "Monday",
					startMinute: 0,
					endMinute: 1440,
					isWeekend: false,
				},
			],
			ticks: [],
			initialViewport: { startMinute: 0, endMinute: 600 },
		};
	}

	// Determine which days are present
	const presentDays = [];
	timeslots.forEach((ts) => {
		const day = ts.day_of_week;
		if (day && presentDays.indexOf(day) === -1) {
			presentDays.push(day);
		}
	});
	presentDays.sort((a, b) => DAY_MAP[a] - DAY_MAP[b]);

	const days = [];
	const ticks = [];
	let maxEndMinute = 0;

	// Create day blocks (one per day)
	presentDays.forEach((day) => {
		const dayIndex = DAY_MAP[day];
		const dayStart = dayIndex * 1440;
		const dayEnd = dayStart + 1440;
		days.push({
			id: `day-${day}`,
			label: WEEKDAYS[dayIndex],
			startMinute: dayStart,
			endMinute: dayEnd,
			isWeekend: day === "Sat" || day === "Sun",
		});
	});

	// Create hour ticks (8h-18h, every 2h for each day)
	presentDays.forEach((day) => {
		const dayIndex = DAY_MAP[day];
		for (let h = 8; h <= 18; h += 2) {
			ticks.push({
				id: `tick-${day}-h${h}`,
				minute: dayIndex * 1440 + h * 60,
				label: `${h}h`,
			});
		}
	});

	// Calculate max end from timeslots
	timeslots.forEach((ts) => {
		const end =
			DAY_MAP[ts.day_of_week] * 1440 + parseTimeToMinutes(ts.end_time);
		maxEndMinute = Math.max(maxEndMinute, end);
	});

	// If no timeslot has a valid day, use 5 days by default
	if (presentDays.length === 0) {
		for (let d = 0; d < 5; d++) {
			days.push({
				id: `day-${d}`,
				label: WEEKDAYS[d],
				startMinute: d * 1440,
				endMinute: (d + 1) * 1440,
				isWeekend: false,
			});
			for (let h = 8; h <= 18; h += 2) {
				ticks.push({
					id: `tick-day${d}-h${h}`,
					minute: d * 1440 + h * 60,
					label: `${h}h`,
				});
			}
		}
		maxEndMinute = 5 * 1440;
	}

	return {
		startMinute: 0,
		endMinute: maxEndMinute,
		days: days,
		ticks: ticks,
		initialViewport: {
			startMinute: 0,
			endMinute: Math.min(maxEndMinute, 5 * 1440),
		},
	};
}

/**
 * Helper: entity label extraction
 * @param {Object} entity - Entity object
 * @param {any} fallback - Fallback value
 * @returns {string}
 */
export function entityLabel(entity, fallback) {
	if (!entity) return String(fallback);
	return entity.name || entity.id || fallback;
}

/**
 * Helper: fact label extraction
 * @param {Object} fact - Fact object
 * @param {any} fallback - Fallback value
 * @returns {string}
 */
export function factLabel(fact, fallback) {
	if (!fact) return String(fallback);
	return fact.name || fact.id || fallback;
}

/**
 * Helper: title formatting (snake_case to Title Case)
 * @param {string} text - Input text
 * @returns {string}
 */
export function title(text) {
	return String(text || "")
		.replace(/_/g, " ")
		.replace(/\b\w/g, (match) => match.toUpperCase());
}

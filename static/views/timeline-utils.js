/* timeline-utils.js — Utility functions for timeline rendering */

import { SLOT_MINUTES } from "../state/state.js";

// Mapping jours de la semaine
export const DAY_MAP = {
	Mon: 0,
	Tue: 1,
	Wed: 2,
	Thu: 3,
	Fri: 4,
	Sat: 5,
	Sun: 6,
};
export const WEEKDAYS = [
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
	"Sunday",
];

// Parse une heure au format "HH:MM:SS" ou "HH:MM" en minutes depuis minuit
export function parseTimeToMinutes(timeStr) {
	if (!timeStr) return 0;
	const parts = timeStr.split(":");
	const hours = parseInt(parts[0], 10) || 0;
	const minutes = parseInt(parts[1], 10) || 0;
	// Clamp to valid range (0-1439 for a single day)
	return Math.max(0, Math.min(hours * 60 + minutes, 1439));
}

// Convertit un timeslot en minutes absolues (depuis Lundi 00:00)
export function timeslotToMinutes(timeslot) {
	if (!timeslot) return { startMinute: 0, endMinute: SLOT_MINUTES };
	const dayIndex = DAY_MAP[timeslot.day_of_week] || 0;
	const startMin = parseTimeToMinutes(timeslot.start_time);
	let endMin = parseTimeToMinutes(timeslot.end_time);

	// Garantir que endMinute > startMinute
	if (endMin <= startMin) {
		endMin = startMin + SLOT_MINUTES; // Durée par défaut de 60 minutes
	}

	return {
		startMinute: dayIndex * 1440 + startMin,
		endMinute: dayIndex * 1440 + endMin,
	};
}

// Construire l'axe à partir des timeslots
export function buildAxisFromTimeslots(timeslots) {
	if (!timeslots || !timeslots.length) {
		// Fallback : un seul jour de 8h à 18h
		return {
			startMinute: 0,
			endMinute: 10 * 60, // 10 slots de 60 min
			days: [
				{
					id: "day-0",
					label: "Lundi",
					startMinute: 0,
					endMinute: 1440,
					isWeekend: false,
				},
			],
			ticks: [],
			initialViewport: { startMinute: 0, endMinute: 600 },
		};
	}

	// Déterminer quels jours sont présents
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

	// Créer les blocs "days" (un par jour)
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

	// Créer les ticks horaires (8h-18h, toutes les 2h pour chaque jour)
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

	// Calculer la fin maximale à partir des timeslots
	timeslots.forEach((ts) => {
		const end =
			DAY_MAP[ts.day_of_week] * 1440 + parseTimeToMinutes(ts.end_time);
		maxEndMinute = Math.max(maxEndMinute, end);
	});

	// Si aucun timeslot n'a de jour valide, utiliser 5 jours par défaut
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

// Ensure custom timeline helper
export function ensureCustomTimeline(key, customTimelines, SF, timelineConfig) {
	let timeline = customTimelines[key];
	if (!timeline) {
		timeline = SF.rail.createTimeline(timelineConfig);
		customTimelines[key] = timeline;
		return timeline;
	}
	timeline.setModel(timelineConfig.model);
	return timeline;
}

// Helper functions for rendering
export function entityLabel(entity, fallback) {
	if (!entity) return String(fallback);
	return entity.name || entity.id || fallback;
}

export function factLabel(fact, fallback) {
	if (!fact) return String(fallback);
	return fact.name || fact.id || fallback;
}

export function title(text) {
	return String(text || "")
		.replace(/_/g, " ")
		.replace(/\b\w/g, (match) => match.toUpperCase());
}

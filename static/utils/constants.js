/* constants.js — Shared constants
 *
 * Pure and stateless utilities
 * Shared constants used across the application
 */

export const SLOT_MINUTES = 60;
export const DEFAULT_VIEWPORT_SLOTS = 12;

// Timeline tone palette
export const TIMELINE_TONES = [
	"emerald",
	"blue",
	"amber",
	"rose",
	"violet",
	"slate",
];

// Day mapping
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

// TODO: open issue upstream -- these should be generated from the solver model
// Constraint levels mapping
export const CONSTRAINT_LEVELS = new Map([
	["Assign Timeslot", "medium"],
	["Assign Room", "medium"],
	["Teacher Availability", "hard"],
	["Group Availability", "hard"],
	["Late Lesson", "soft"],
	["Avoid Late Lessons", "soft"],
	["No Group Conflict", "hard"],
	["No Room Conflict", "hard"],
	["No Teacher Conflict", "hard"],
	["Repeated Subject Day", "soft"],
	["Avoid Repeated Subject Day", "soft"],
	["Room Capacity", "hard"],
	["Room Kind", "soft"],
]);

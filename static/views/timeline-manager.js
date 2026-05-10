/* timeline-manager.js — Timeline instance management
 *
 * SF element construction and lifecycle
 * Contains no business logic
 * Manages SF timeline instances for views
 */

/**
 * Internal registry: key -> SF timeline instance
 * @type {Object.<string, any>}
 */
const timelineRegistry = {};

/**
 * Ensure a timeline exists for a given key, create or update it
 * @param {string} key - Timeline key
 * @param {Object} timelineConfig - SF timeline configuration
 * @param {Object} SF - SolverForge global
 * @returns {Object} - SF timeline instance
 */
export function ensureTimeline(key, timelineConfig, SF) {
	let timeline = timelineRegistry[key];
	if (!timeline) {
		timeline = SF.rail.createTimeline(timelineConfig);
		timelineRegistry[key] = timeline;
		return timeline;
	}
	timeline.setModel(timelineConfig.model);
	return timeline;
}

/**
 * Destroy a specific timeline
 * @param {string} key - Timeline key
 */
export function destroyTimeline(key) {
	const timeline = timelineRegistry[key];
	if (!timeline) return;
	timeline.destroy();
	delete timelineRegistry[key];
}

/**
 * Destroy all timelines
 */
export function destroyAllTimelines() {
	Object.keys(timelineRegistry).forEach((key) => {
		destroyTimeline(key);
	});
}

/**
 * Get a timeline by key
 * @param {string} key - Timeline key
 * @returns {Object|null} - SF timeline instance or null
 */
export function getTimeline(key) {
	return timelineRegistry[key] || null;
}

/**
 * Get all timeline keys
 * @returns {string[]} - Array of timeline keys
 */
export function getAllTimelineKeys() {
	return Object.keys(timelineRegistry);
}

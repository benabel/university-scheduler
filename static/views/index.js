/* view/index.js — Central export for all view modules */

export { renderByGroup } from "./group-view.js";
export { renderByRoom } from "./room-view.js";
export { renderByTeacher } from "./teacher-view.js";
export {
	buildAxisFromTimeslots,
	DAY_MAP,
	ensureCustomTimeline,
	entityLabel,
	factLabel,
	parseTimeToMinutes,
	timeslotToMinutes,
	title,
	WEEKDAYS,
} from "./timeline-utils.js";

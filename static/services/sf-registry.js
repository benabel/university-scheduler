/* sf-registry.js — SF reference registry singleton
 *
 * Infrastructure singletons — created once, never reactive
 * Non-reactive SF refs: statusBar, header, analysisModal
 * Replaces state.set("header"...) pattern
 * No state, no direct DOM manipulation, no business logic
 */

/**
 * @type {Object.<string, any>}
 */
export const refs = {
	header: null,
	statusBar: null,
	analysisModal: null,
	app: null,
};

/**
 * Register a reference in the registry
 * @param {string} name - Reference name
 * @param {any} el - Reference element
 */
export const registerRef = (name, el) => {
	refs[name] = el;
};

/**
 * Get a reference from the registry
 * @param {string} name - Reference name
 * @returns {any}
 */
export const getRef = (name) => refs[name];

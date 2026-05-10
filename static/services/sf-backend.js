/* sf-backend.js — SF backend connection singleton
 *
 * Infrastructure singleton — created once, never reactive
 * HTTP connection point to the SolverForge server
 * No state, no DOM, no business logic
 */

export const backend = SF.createBackend({ baseUrl: "" });

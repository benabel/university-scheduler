/* api-guide.js — API guide view construction
 *
 * SF element construction and lifecycle
 * Contains no business logic
 * Does not read state directly
 */

/**
 * Render the API guide panel
 * @param {Object} SF - SolverForge global
 * @param {Object} demoCatalog - Demo catalog data
 */
export function renderApiGuide(SF, demoCatalog) {
	const apiGuidePanel = document.querySelector("#sf-api-guide");
	if (!apiGuidePanel) return;

	apiGuidePanel.innerHTML = "";

	const defaultDemoPath = demoCatalog?.defaultId
		? `/demo-data/${demoCatalog.defaultId}`
		: "/demo-data/{defaultId}";

	const endpoints = [
		{
			method: "GET",
			path: "/demo-data",
			description: "Discover the default and available demo data IDs",
			curl: buildCurlCommand("GET", "/demo-data"),
		},
		{
			method: "GET",
			path: defaultDemoPath,
			description: "Fetch the discovered default demo data",
			curl: buildCurlCommand("GET", defaultDemoPath),
		},
		{
			method: "POST",
			path: "/jobs",
			description: "Create a retained solving job",
			curl: buildCurlCommand("POST", "/jobs", {
				json: true,
				data: "@plan.json",
			}),
		},
		{
			method: "GET",
			path: "/jobs/{id}",
			description: "Get current job summary",
			curl: buildCurlCommand("GET", "/jobs/{id}"),
		},
		{
			method: "GET",
			path: "/jobs/{id}/snapshot",
			description: "Fetch the latest retained snapshot",
			curl: buildCurlCommand("GET", "/jobs/{id}/snapshot"),
		},
		{
			method: "GET",
			path: "/jobs/{id}/analysis?snapshot_revision={n}",
			description: "Analyze an exact snapshot revision",
			curl: buildCurlCommand("GET", "/jobs/{id}/analysis?snapshot_revision=3", {
				quoteUrl: true,
			}),
		},
		{
			method: "POST",
			path: "/jobs/{id}/pause",
			description: "Request an exact runtime pause",
			curl: buildCurlCommand("POST", "/jobs/{id}/pause"),
		},
		{
			method: "POST",
			path: "/jobs/{id}/resume",
			description: "Resume a paused retained job",
			curl: buildCurlCommand("POST", "/jobs/{id}/resume"),
		},
		{
			method: "POST",
			path: "/jobs/{id}/cancel",
			description: "Cancel a live or paused job",
			curl: buildCurlCommand("POST", "/jobs/{id}/cancel"),
		},
		{
			method: "DELETE",
			path: "/jobs/{id}",
			description: "Delete a terminal retained job",
			curl: buildCurlCommand("DELETE", "/jobs/{id}"),
		},
		{
			method: "GET",
			path: "/jobs/{id}/events",
			description: "Stream job lifecycle updates (SSE)",
			curl: buildCurlCommand("GET", "/jobs/{id}/events", { stream: true }),
		},
	];

	apiGuidePanel.appendChild(SF.createApiGuide({ endpoints: endpoints }));
}

/**
 * Build a curl command string
 * @param {string} method - HTTP method
 * @param {string} path - URL path
 * @param {Object} options - Options (json, data, quoteUrl, stream)
 * @returns {string}
 */
function buildCurlCommand(method, path, options = {}) {
	const parts = ["curl"];
	if (options?.stream) {
		parts.push("-N");
	}
	if (method && method !== "GET") {
		parts.push("-X", method);
	}
	if (options?.json) {
		parts.push("-H", '"Content-Type: application/json"');
	}

	const url = buildApiUrl(path);
	parts.push(options?.quoteUrl ? `"${url}"` : url);

	if (options?.data) {
		parts.push("-d", options.data);
	}

	return parts.join(" ");
}

/**
 * Build API URL from path
 * @param {string} path - URL path
 * @returns {string}
 */
function buildApiUrl(path) {
	return (
		(window.location.origin ||
			`${window.location.protocol}//${window.location.host}`) + path
	);
}

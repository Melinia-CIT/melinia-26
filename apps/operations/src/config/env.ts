/**
 * Environment configuration
 * Reads Vite env vars and provides typed config
 */

export const env = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL as string,
	isDev: import.meta.env.DEV,
	isProd: import.meta.env.PROD,
} as const;

// Validate required env vars
if (!env.apiBaseUrl) {
	throw new Error("VITE_API_BASE_URL is required");
}

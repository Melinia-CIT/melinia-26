/**
 * Token store
 * Manages access token in memory and sessionStorage
 */

const TOKEN_KEY = "melinia_access_token";

let accessToken: string | null = null;

/**
 * Initialize token from sessionStorage on app load
 */
export function initTokenStore(): void {
	try {
		accessToken = sessionStorage.getItem(TOKEN_KEY);
	} catch {
		// sessionStorage might not be available
		accessToken = null;
	}
}

/**
 * Get current access token
 */
export function getToken(): string | null {
	return accessToken;
}

/**
 * Set access token (stores in memory + sessionStorage)
 */
export function setToken(token: string): void {
	accessToken = token;
	try {
		sessionStorage.setItem(TOKEN_KEY, token);
	} catch {
		// sessionStorage might not be available
	}
}

/**
 * Clear access token
 */
export function clearToken(): void {
	accessToken = null;
	try {
		sessionStorage.removeItem(TOKEN_KEY);
	} catch {
		// sessionStorage might not be available
	}
}

/**
 * Check if user has a token
 */
export function hasToken(): boolean {
	return accessToken !== null && accessToken.length > 0;
}

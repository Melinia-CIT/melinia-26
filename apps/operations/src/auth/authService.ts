/**
 * Auth service
 * High-level auth operations for use by the app and router context
 */

import * as authApi from "@/api/auth";
import { type Login } from "@melinia/shared";
import {
	clearToken,
	getToken,
	hasToken,
	initTokenStore,
	setToken,
} from "./tokenStore";

export interface AuthService {
	/**
	 * Initialize auth (restore token from storage)
	 */
	init: () => void;

	/**
	 * Login with credentials
	 */
	login: (credentials: Login) => Promise<void>;

	/**
	 * Logout (clear token and session)
	 */
	logout: () => void;

	/**
	 * Ensure user has a valid session (refresh if needed)
	 */
	ensureSession: () => Promise<void>;

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated: () => boolean;

	/**
	 * Get current access token
	 */
	getAccessToken: () => string | null;
}

/**
 * Create auth service instance
 */
export function createAuthService(): AuthService {
	return {
		init() {
			initTokenStore();
		},

		async login(credentials) {
			const response = await authApi.login(credentials);
			setToken(response.accessToken);
		},

		logout() {
			clearToken();
		},

		async ensureSession() {
			// If we have a token, assume it's valid (interceptor will refresh if needed)
			if (hasToken()) {
				return;
			}

			// No token: attempt refresh (cookie-based)
			try {
				const response = await authApi.refresh();
				setToken(response.accessToken);
			} catch {
				// Refresh failed: user needs to log in
				throw new Error("Session expired");
			}
		},

		isAuthenticated() {
			return hasToken();
		},

		getAccessToken() {
			return getToken();
		},
	};
}

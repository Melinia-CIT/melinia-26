/**
 * HTTP client
 * Axios instance with interceptors for auth and refresh token logic
 */

import axios, {
	type AxiosError,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";
import { clearToken, getToken, setToken } from "@/auth/tokenStore";
import { env } from "@/config/env";

/**
 * Axios instance with base config
 */
export const http = axios.create({
	baseURL: env.apiBaseUrl,
	withCredentials: true, // Required for refresh cookie
	timeout: 15000,
	headers: {
		"Content-Type": "application/json",
	},
});

/**
 * Track if a refresh is in progress (prevent multiple refresh calls)
 */
let refreshPromise: Promise<string> | null = null;

/**
 * Request interceptor: attach access token
 */
http.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		const token = getToken();
		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error),
);

/**
 * Response interceptor: handle 401 and refresh token
 */
http.interceptors.response.use(
	(response: AxiosResponse) => response,
	async (error: AxiosError) => {
		const originalRequest = error.config;

		// Ignore 401s from auth endpoints (avoid infinite loops)
		if (
			originalRequest?.url?.includes("/auth/login") ||
			originalRequest?.url?.includes("/auth/refresh")
		) {
			return Promise.reject(error);
		}

		// Handle 401: attempt refresh once
		if (error.response?.status === 401 && originalRequest) {
			try {
				// Use single-flight refresh promise
				if (!refreshPromise) {
					refreshPromise = refreshAccessToken();
				}

				const newToken = await refreshPromise;
				refreshPromise = null;

				// Retry original request with new token
				if (originalRequest.headers) {
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
				}
				return http(originalRequest);
			} catch (refreshError) {
				// Refresh failed: clear auth and redirect to login
				refreshPromise = null;
				clearToken();

				// Redirect to login (via window location to ensure clean state)
				const currentPath = window.location.pathname;
				if (currentPath !== "/login") {
					window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
				}

				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

/**
 * Refresh access token using the refresh cookie
 */
async function refreshAccessToken(): Promise<string> {
	const response = await http.post<{ accessToken: string }>(
		"/auth/refresh",
		{},
	);
	const newToken = response.data.accessToken;
	setToken(newToken);
	return newToken;
}

/**
 * Auth API
 * Login and refresh token endpoints
 */

import { http } from "./http";

export interface LoginCredentials {
	email: string;
	passwd: string;
}

export interface LoginResponse {
	accessToken: string;
}

export interface RefreshResponse {
	accessToken: string;
}

/**
 * Login with email and password
 */
export async function login(
	credentials: LoginCredentials,
): Promise<LoginResponse> {
	const response = await http.post<LoginResponse>("/auth/login", credentials);
	return response.data;
}

/**
 * Refresh access token using the refresh cookie
 */
export async function refresh(): Promise<RefreshResponse> {
	const response = await http.post<RefreshResponse>("/auth/refresh", {});
	return response.data;
}

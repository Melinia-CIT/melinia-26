/**
 * Auth API
 * Login and refresh token endpoints
 */

import { http } from "./http";
import type { Login, LoginResponse, RefreshResponse } from "@melinia/shared";

/**
 * Login with email and password
 */
export async function login(
	credentials: Login,
): Promise<LoginResponse> {
	const response = await http.post<LoginResponse>("/auth/login", credentials);
	return response.data;
}

/**
 * Refresh access token using the refresh cookie
 */
export async function refresh(): Promise<RefreshResponse> {
	const response = await http.post<RefreshResponse>("/auth/refresh");
	return response.data;
}
/**
 * Logout and clear session cookies on the server
 */
export async function logout(): Promise<void> {
	await http.post("/auth/logout");
}

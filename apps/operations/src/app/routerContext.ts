/**
 * Router context
 * Typed context for TanStack Router (used in guards, loaders, and components)
 */

import type { QueryClient } from "@tanstack/react-query";
import { QueryClient as TanStackQueryClient } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { http } from "@/api/http";
import {
	createRegistrationsApi,
	type RegistrationsApi,
} from "@/api/registrations";
import { createUsersApi, type UsersApi } from "@/api/users";
import type { AuthService } from "@/auth/authService";
import { createAuthService } from "@/auth/authService";
import { env } from "@/config/env";

export interface RouterContext {
	queryClient: QueryClient;
	http: AxiosInstance;
	auth: AuthService;
	api: {
		baseUrl: string;
		registrations: RegistrationsApi;
		users: UsersApi;
	};
}

/**
 * Create router context (singleton instances)
 */
export function createRouterContext(): RouterContext {
	const queryClient = new TanStackQueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60, // 1 minute
				retry: 1,
				refetchOnWindowFocus: false,
			},
			mutations: {
				retry: false,
			},
		},
	});

	const auth = createAuthService();

	// Initialize auth (restore token from storage)
	auth.init();

	return {
		queryClient,
		http,
		auth,
		api: {
			baseUrl: env.apiBaseUrl,
			registrations: createRegistrationsApi(http),
			users: createUsersApi(http),
		},
	};
}

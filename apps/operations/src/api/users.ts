import type { AxiosInstance } from "axios";
import type { UserWithProfile } from "@melinia/shared";

export interface GetUserByIdResponse {
	data: UserWithProfile;
}

export function createUsersApi(http: AxiosInstance) {
	return {
		async getById(id: string): Promise<UserWithProfile> {
			const { data } = await http.get<GetUserByIdResponse>(`/users/${id}`);
			return data.data;
		},
		async getMyEvents(): Promise<any[]> {
			const { data } = await http.get<{ events: any[] }>("/users/me/events");
			return data.events;
		},
	};
}

export type UsersApi = ReturnType<typeof createUsersApi>;

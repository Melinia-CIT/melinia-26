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
	};
}

export type UsersApi = ReturnType<typeof createUsersApi>;

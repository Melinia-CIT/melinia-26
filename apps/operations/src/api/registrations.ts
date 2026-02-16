import type { AxiosInstance } from "axios";

export interface Registration {
	id: string;
	name: string;
	email: string;
	phone: string;
	college: string;
	status: "pending" | "verified" | "rejected";
	checkedIn: boolean;
	registeredAt: string;
	checkedInAt?: string;
}

export interface RegistrationsListParams {
	page?: number;
	limit?: number;
	search?: string;
	status?: Registration["status"];
	checkedIn?: boolean;
}

export interface RegistrationsListResponse {
	data: Registration[];
	total: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface CheckInPayload {
	user_id: string;
}

export interface CheckInResponse {
	success: boolean;
	registration: Registration;
}

export function createRegistrationsApi(http: AxiosInstance) {
	return {
		async list(
			params: RegistrationsListParams = {},
		): Promise<RegistrationsListResponse> {
			const { data } = await http.get<RegistrationsListResponse>(
				"/registrations",
				{ params },
			);
			return data;
		},

		async getById(id: string): Promise<Registration> {
			const { data } = await http.get<Registration>(`/registrations/${id}`);
			return data;
		},

		async updateStatus(
			id: string,
			status: Registration["status"],
		): Promise<Registration> {
			const { data } = await http.patch<Registration>(
				`/registrations/${id}/status`,
				{ status },
			);
			return data;
		},

		async checkIn(userId: string): Promise<CheckInResponse> {
			const { data } = await http.post<CheckInResponse>(
				"/ops/check-in",
				{
					participant_id: userId,
				},
			);
			return data;
		},

		async search(query: string): Promise<Registration[]> {
			const { data } = await http.get<Registration[]>("/registrations/search", {
				params: { q: query },
			});
			return data;
		},
	};
}

export type RegistrationsApi = ReturnType<typeof createRegistrationsApi>;

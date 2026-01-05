import { type AdminLoginInput } from "@melinia/shared";
import api from "./api";

interface AdminLoginResponse {
    accessToken: string;
    userId: string;
    role: string;
}

export const adminLogin = async (credentials: AdminLoginInput): Promise<AdminLoginResponse> => {
    const response = await api.post<AdminLoginResponse>('/admin/auth/login', credentials);
    const { accessToken } = response.data;

    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
    }

    return response.data;
};

export const adminLogout = async () => {
    try {
        await api.post('/admin/auth/logout');
    } finally {
        localStorage.removeItem('accessToken');
    }
};

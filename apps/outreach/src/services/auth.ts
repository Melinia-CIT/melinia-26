import { type Login, LoginResponse } from "@melinia/shared";
import api from "./api";

export const login = async (credentials: Login): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const { accessToken } = response.data;

    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
    }

    return response.data;
};

export const logout = async () => {
    try {
        await api.post('/auth/logout');
    } finally {
        localStorage.removeItem('accessToken');
    }
};

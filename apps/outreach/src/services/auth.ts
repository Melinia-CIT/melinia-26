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

export const sendOTP = async (data: { email: string }) => {
    const response = await api.post('/auth/send-otp', data);
    return response.data;
};

export const verifyOTP = async (data: { otp: string }) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
};

export const register = async (data: { passwd: string; confirmPasswd: string }) => {
    const response = await api.post<{ message: string; accessToken: string }>('/auth/register', data,);
    const { accessToken } = response.data;
    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
    }
    return response.data;
};

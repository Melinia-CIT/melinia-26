import { type Login, LoginResponse, type RegistrationType, type GenerateOTP, type VerifyOTPType} from "@melinia/shared";
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

export const sendOTP = async (data: GenerateOTP) => {
    const response = await api.post('/auth/send-otp', data);
    return response.data;
};

export const verifyOTP = async (data: VerifyOTPType) => {
    const response = await api.post('/auth/verify-otp', data);
    return response.data;
};

export const register = async (data: RegistrationType) => {
    const response = await api.post('/auth/register', data);
    const { accessToken } = response.data;

    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
    }

    return response.data;
};

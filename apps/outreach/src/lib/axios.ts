import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { logout } from '../services/auth';
import { useNavigate } from 'react-router';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};


// attach the bearer token in before making a request
apiClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (window.location.pathname === '/login') {
            return Promise.reject(error);
        }

        if (originalRequest.url === '/auth/refresh') {
            await logout();
            const navigate = useNavigate();
            navigate("/login", { replace: true });
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return apiClient(originalRequest);
            }).catch((err) => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const response = await apiClient.post<{ accessToken: string }>('/auth/refresh');

            const { accessToken } = response.data;

            localStorage.setItem('accessToken', accessToken);

            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            processQueue(null, accessToken);
            isRefreshing = false;

            return apiClient(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;

            localStorage.removeItem('accessToken');

            return Promise.reject(refreshError);
        }
    }
);

export default apiClient;

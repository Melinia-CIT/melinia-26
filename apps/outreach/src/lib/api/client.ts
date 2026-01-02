import axios, { AxiosInstance, AxiosError } from "axios";
import { AuthData } from "../../types/auth";

class ApiClient {
    private axiosInstance: AxiosInstance;
    private authData: AuthData | null = null;
    private refreshPromise: Promise<string> | null = null;

    constructor(baseURL: string) {
        // Load auth data from localStorage first
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("authData");
            if (stored) {
                try {
                    this.authData = JSON.parse(stored);
                } catch {
                    localStorage.removeItem("authData");
                }
            }
        }

        // Create axios instance with config
        this.axiosInstance = axios.create({
            baseURL,
            headers: {
                "Content-Type": "application/json",
                ...(this.authData?.accessToken && {
                    "Authorization": `Bearer ${this.authData.accessToken}`,
                }),
            },
            withCredentials: true
        });

        // Response interceptor for handling token refresh
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                const originalRequest = error.config as any;

                // If 401 and not already retried, try to refresh token
                if (error.response?.status === 401 && error.config?.url?.includes("/api/v1/auth/refresh") && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        const newAccessToken = await this.refreshAccessToken();
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, clear auth and redirect to login
                        this.clearAuth();
                        if (typeof window !== "undefined") {
                            window.location.href = "/login";
                        }
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    private async refreshAccessToken(): Promise<string> {
        // Prevent multiple simultaneous refresh requests
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        this.refreshPromise = (async () => {
            try {
                if (!this.authData?.refreshToken) {
                    throw new Error("No refresh token available");
                }

                const response = await axios.post<{ accessToken: string }>(
                    `${this.axiosInstance.defaults.baseURL}/auth/refresh`,
                    {
                        refreshToken: this.authData.refreshToken,
                    }
                );

                const newAccessToken = response.data.accessToken;

                // Update auth data with new access token
                if (this.authData) {
                    this.authData.accessToken = newAccessToken;
                    if (typeof window !== "undefined") {
                        localStorage.setItem("authData", JSON.stringify(this.authData));
                    }
                }

                // Update axios default header
                this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

                return newAccessToken;
            } finally {
                this.refreshPromise = null;
            }
        })();

        return this.refreshPromise;
    }

    async setAuthData(authData: AuthData | null): Promise<void> {
        this.authData = await authData;

        if (typeof window !== "undefined") {
            if (authData) {
                await localStorage.clear();
                localStorage.setItem("authData", JSON.stringify(authData));
                // Update axios headers with new token
                console.log("Before:", this.axiosInstance.defaults.headers.common.Authorization);
                this.axiosInstance.defaults.headers.common.Authorization = await `Bearer ${authData.accessToken}`;
                console.log("after:",this.axiosInstance.defaults.headers.common.Authorization);
            } else {
                localStorage.removeItem("authData");
                delete this.axiosInstance.defaults.headers.common.Authorization;
            }
        }
    }

    clearAuth(): void {
        this.authData = null;
        if (typeof window !== "undefined") {
            localStorage.removeItem("authData");
            delete this.axiosInstance.defaults.headers.common.Authorization;
        }
    }

    getAuthData(): AuthData | null {
        return this.authData;
    }

    isAuthenticated(): boolean {
        return !!this.authData?.accessToken;
    }

    getUserToken(): string | null {
        return this.authData?.accessToken || null;
    }

    async get<T>(endpoint: string) {
        return this.axiosInstance.get<T>(endpoint).then((res) => res.data);
    }

    async post<T>(endpoint: string, data?: unknown) {
        return this.axiosInstance.post<T>(endpoint, data).then((res) => res.data);
    }

    async put<T>(endpoint: string, data: unknown) {
        return this.axiosInstance.put<T>(endpoint, data).then((res) => res.data);
    }

    async patch<T>(endpoint: string, data?: unknown) {
        return this.axiosInstance.patch<T>(endpoint, data).then((res) => res.data);
    }

    async delete<T>(endpoint: string) {
        return this.axiosInstance.delete<T>(endpoint).then((res) => res.data);
    }
}

export const apiClient = new ApiClient("http://localhost:3000");

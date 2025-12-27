import axios, { AxiosInstance } from "axios";
import { AuthData } from "../../types/auth";

class ApiClient {
    private axiosInstance: AxiosInstance;
    private authData: AuthData | null = null;

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
                ...(this.authData?.token && {
                    Authorization: `Bearer ${this.authData.token}`,
                }),
            },
        });

        // Response interceptor for 401 errors
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.clearAuth();
                    if (typeof window !== "undefined") {
                        window.location.href = "/login";
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    setAuthData(authData: AuthData | null): void {
        this.authData = authData;

        if (typeof window !== "undefined") {
            if (authData) {
                localStorage.setItem("authData", JSON.stringify(authData));
                // Update axios headers with new token
                this.axiosInstance.defaults.headers.common.Authorization = `Bearer ${authData.token}`;
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
        return !!this.authData?.token;
    }

    getUserToken(): string | null {
        return this.authData?.token || null;
    }

    // getUserRole(): number | null {
    //     return this.authData?.role_id || null;
    // }

    // getUserEmail(): string | null {
    //     return this.authData?.email_id || null;
    // }

    // getEmployeeID(): number | null {
    //     return this.authData?.employee_id || null;
    // }

    // getUserDisplayName(): string | null {
    //     if (this.authData?.first_name && this.authData?.last_name) {
    //         return `${this.authData.first_name} ${this.authData.last_name}`;
    //     }
    //     return null;
    // }

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

export const apiClient = new ApiClient("http://localhost:8080");
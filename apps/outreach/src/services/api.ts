import apiClient from '../lib/axios';
import { AxiosResponse } from 'axios';


export const api = {
    get: <T = any>(url: string, params?: any): Promise<AxiosResponse<T>> => {
        return apiClient.get<T>(url, { params });
    },

    post: <T = any, D = any>(url: string, data?: D): Promise<AxiosResponse<T>> => {
        return apiClient.post<T>(url, data);
    },

    put: <T = any, D = any>(url: string, data?: D): Promise<AxiosResponse<T>> => {
        return apiClient.put<T>(url, data);
    },

    patch: <T = any, D = any>(url: string, data?: D): Promise<AxiosResponse<T>> => {
        return apiClient.patch<T>(url, data);
    },

    delete: <T = any>(url: string): Promise<AxiosResponse<T>> => {
        return apiClient.delete<T>(url);
    },
};

export default api;

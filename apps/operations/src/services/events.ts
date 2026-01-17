import { type AxiosResponse } from "axios";
import api from "./api";
import {
    type CreateEvent,
    type UpdateEventDetailsInput,
    type Event,
} from "@melinia/shared";

interface ApiResponse<T> {
    status: boolean;
    message: string;
    data: T;
}

const BASE_PATH = "/events";

export const fetchEvents = async (): Promise<Event[]> => {
    const response: AxiosResponse<ApiResponse<Event[]>> = await api.get<ApiResponse<Event[]>>(BASE_PATH);
    return response.data.data;
};

export const createEvent = async (payload: CreateEvent): Promise<Event> => {
    const response: AxiosResponse<ApiResponse<Event>> = await api.post<ApiResponse<Event>>(BASE_PATH, payload);
    return response.data.data;
};

export const updateEvent = async (id: string, payload: UpdateEventDetailsInput): Promise<Event> => {
    const response: AxiosResponse<ApiResponse<Event>> = await api.patch<ApiResponse<Event>>(`${BASE_PATH}/${id}`, payload);
    return response.data.data;
};

export const deleteEvent = async (id: string): Promise<void> => {
    await api.delete<ApiResponse<unknown>>(`${BASE_PATH}/${id}`);
};

import { apiClient } from "./client";
import { TypicalResponse } from "../../types/api";
import { LoginResponse } from "../../types/auth";
import {LoginRequest} from "@packages/shared/dist";

export class AuthService {
    private static instance: AuthService;
    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }

        return AuthService.instance;
    }

    public async login(formData: LoginRequest): Promise<LoginResponse> {
        const response = await apiClient.post<LoginResponse>(
            "/api/v1/auth/login",
            formData
        );

        if (!response) {
            alert("Something went wrong!");
        }

        if (!response.status) {
            alert(response.message);
        }

        return response;
    }

};

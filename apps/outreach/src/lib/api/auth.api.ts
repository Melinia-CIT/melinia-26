import { apiClient } from "./client";
import { TypicalResponse } from "../../types/api";
import { LoginResponse, RegisterationResponse } from "../../types/auth";
import { LoginRequest } from "@melinia/shared";
import { GenerateOTPFormData, RegisterationType, createProfileType, VerifyOTPType } from "@melinia/shared";

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
            throw new Error("Login failed");
        }

        apiClient.setAuthData({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken || "",
        });

        return response;
    }

    public async sendOTP(emailID: GenerateOTPFormData): Promise<TypicalResponse> {
        const response = await apiClient.post<TypicalResponse>(
            "/api/v1/auth/send-otp",
            emailID
        );

        if (!response) {
            throw new Error("Failed to send OTP");
        }

        return response;
    }

    public async verifyOTP(otp: VerifyOTPType): Promise<TypicalResponse> {
        const response = await apiClient.post<TypicalResponse>(
            "/api/v1/auth/verify-otp",
            otp
        );

        if (!response) {
            throw new Error("Failed to verify OTP");
        }

        return response;
    }

    public async setPassword(
        passwords: RegisterationType
    ): Promise<RegisterationResponse> {
        const response = await apiClient.post<RegisterationResponse>(
            "/api/v1/auth/register",
            passwords
        );
        
        if (!response?.accessToken) {
            throw new Error("Failed to set password - no token received");
        }
        
        apiClient.setAuthData({
            accessToken: response.accessToken,
            refreshToken: "",
        });
        
        return response;
    }
    public async setUpProfile(profile: createProfileType): Promise<TypicalResponse> {
        // At this point, the token should already be set from setPassword()
        const response = await apiClient.post<TypicalResponse>(
            "/api/v1/user/profile",
            profile
        );

        if (!response) {
            throw new Error("Failed to set up profile");
        }

        console.log(response);
        return response;
    }
}

export const authClient = new AuthService();
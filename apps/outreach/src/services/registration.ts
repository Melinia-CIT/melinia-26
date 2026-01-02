import api from "./api";
import { GenerateOTPFormData, RegisterationType, VerifyOTPType } from "@melinia/shared";

class RegisterationService {
    private static instance: RegisterationService;
    public static getInstance(): RegisterationService {
        if (!RegisterationService.instance) {
            RegisterationService.instance = new RegisterationService();
        }
        return RegisterationService.instance;
    }


    public sendOTP = async (emailID: GenerateOTPFormData) => {
        const response = await api.post(
            "/auth/send-otp",
            emailID
        );

        if (!response) {
            throw new Error("Failed to send OTP");
        }

        return response;
    }

    public verifyOTP = async (otp: VerifyOTPType) => {
        const response = await api.post(
            "/auth/verify-otp",
            otp
        );

        if (!response) {
            throw new Error("Failed to verify OTP");
        }

        return response;
    }

    public setPassword = async (passwords: RegisterationType) => {
        const response = await api.post("/auth/register", passwords);
        const { accessToken } = response.data;

        if (!accessToken) {
            throw new Error("Failed to set password - no token received");
        }

        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
        }
        return response.data;
    }
};

export const registration = new RegisterationService();


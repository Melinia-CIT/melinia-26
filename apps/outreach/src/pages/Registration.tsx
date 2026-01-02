import React, { useState, useEffect } from 'react';
import { EmailStep, OTPStep, PasswordStep, ProgressBar, Step } from '../components/registration';
import { registration } from '../services/registration';
import toast from "react-hot-toast";
import {
    registrationSchema,
    generateOTPSchema,
    type GenerateOTPFormData,
    verifyOTPSchema,
    type VerifyOTPType,
    type RegisterationType,
} from '@melinia/shared';
import axios, { AxiosError } from 'axios';
import { useNavigate } from 'react-router';
import { ZodError } from 'zod';
import { useMutation } from '@tanstack/react-query';

const Register: React.FC = () => {
    const router = useNavigate();

    const [currentStep, setCurrentStep] = useState<number>(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [emailID, setEmailID] = useState<GenerateOTPFormData | null>();
    
    const [otp, setOTP] = useState<VerifyOTPType | null>(null);

    const [passwordFormData, setPasswordFormData] = useState<RegisterationType>({
        passwd: '',
        confirmPasswd: '',
    });

    const steps: Step[] = [
        { number: 1, label: 'Email' },
        { number: 2, label: 'OTP' },
        { number: 3, label: 'Password' },
    ];

    // Helper: Handle Backend Errors
const getBackendErrorMessage = (error: unknown, fieldName: string): void => {
    if (error instanceof AxiosError) {
        const data = error.response?.data;
        if (data?.error && typeof data.error === 'object' && 'message' in data.error) {
            const errorObj = data.error as { message?: string; name?: string };
            if (errorObj.name === 'ZodError' && errorObj.message) {
                try {
                    const zodErrors = JSON.parse(errorObj.message);
                    if (Array.isArray(zodErrors)) {
                        const formattedErrors: Record<string, string> = {};
                        zodErrors.forEach((err: any) => {
                            const fieldKey = err.path?.[0] || fieldName;
                            formattedErrors[fieldKey] = err.message;
                            toast.error(err.message);
                        });
                        setErrors(formattedErrors);
                        return;
                    }
                } catch (e) {
                    // Ignore parse error
                }
            }
        }
        
        let message: string = 'An error occurred';
        if (data?.message && typeof data.message === 'string') {
            message = data.message;
        } else if (typeof data === 'string') {
            message = data;
        }
        
        setErrors({ [fieldName]: message });
        toast.error(message);
    } else if (error instanceof Error) {
        setErrors({ [fieldName]: error.message });
    } else {
        setErrors({ [fieldName]: 'An unexpected error occurred' });
    }
};
    const handleZodError = (error: ZodError): void => {
        const formattedErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
            const fieldName = String(issue.path[0]);
            formattedErrors[fieldName] = issue.message;
        });
        setErrors(formattedErrors);
    };

    // Email Mutation
    const emailMutation = useMutation({
        mutationFn: (data: GenerateOTPFormData) => registration.sendOTP(data),
        onSuccess: (response, variables) => {
            setEmailID(variables);
            setCurrentStep(2);
            toast.success("OTP sent to email")
        },
        onError: (error) => getBackendErrorMessage(error, 'email'),
    });

    // OTP Mutation
    const otpMutation = useMutation({
        mutationFn: (data: VerifyOTPType) => registration.verifyOTP(data),
        onSuccess: (data, variables) => {
            setOTP(variables);
            setCurrentStep(3);
            toast.success("OTP verified")
        },
        onError: (error) => getBackendErrorMessage(error, 'otp'),
    });

    // Password Mutation
    const passwordMutation = useMutation({
        mutationFn: (data: RegisterationType) => registration.setPassword(data),
        onSuccess: () => {
            setEmailID(null);
            setOTP(null);
            setPasswordFormData({ passwd: '', confirmPasswd: '' });
            setCurrentStep(1);

            toast.success('Registration completed successfully!');
            router('/app');
        },
        onError: (error) => getBackendErrorMessage(error, 'form'),
    });

    // Handlers
    const handleEmailSubmit = async (data: GenerateOTPFormData): Promise<void> => {
        try {
            setErrors({});
            const validatedData = await generateOTPSchema.parse(data);
            emailMutation.mutate(validatedData);
        } catch (error: unknown) {
            if (error instanceof ZodError) handleZodError(error);
        }
    };

    const handleOTPSubmit = async (data: VerifyOTPType): Promise<void> => {
        try {
            setErrors({});
            const validatedData = await verifyOTPSchema.parse(data);
            otpMutation.mutate(validatedData);
        } catch (error: unknown) {
            if (error instanceof ZodError) handleZodError(error);
        }
    };

    const handlePasswordSubmit = async (data: RegisterationType): Promise<void> => {
        try {
            setErrors({});
            const validatedData = await registrationSchema.parse(data);
            setPasswordFormData(validatedData);
            passwordMutation.mutate(validatedData);
        } catch (error: unknown) {
            if (error instanceof ZodError) handleZodError(error);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 font-geist text-zinc-100 flex justify-center px-2 py-3 items-center">
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-full h-36 sm:h-40 rounded-2xl bg-[image:url('https://cdn.melinia.dev/melinia-alt.webp')] bg-cover bg-center mb-10" />

                <div className="w-full px-10">
                    <ProgressBar currentStep={currentStep} totalSteps={steps.length} steps={steps} />
                </div>

                <div className="w-full bg-zinc-900 rounded-lg p-6 mb-6">
                    {currentStep === 1 && (
                        <EmailStep
                            onSubmit={handleEmailSubmit}
                            errors={errors}
                            isLoading={emailMutation.isPending}
                        />
                    )}

                    {currentStep === 2 && (
                        <OTPStep
                            onSubmit={handleOTPSubmit}
                            errors={errors}
                            email={emailID?.email || ''}
                            isLoading={otpMutation.isPending}
                        />
                    )}

                    {currentStep === 3 && (
                        <PasswordStep
                            onSubmit={handlePasswordSubmit}
                            errors={errors}
                            isLoading={passwordMutation.isPending}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
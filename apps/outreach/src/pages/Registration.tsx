import React, { useState, useEffect } from 'react';
import { EmailStep, OTPStep, PasswordStep, ProfileStep, ProgressBar, Step } from '../components/registration';
import { authClient } from '../lib/api/auth.api'; 
import toast from "react-hot-toast";
import {
    registrationSchema,
    profileSchema,
    generateOTPSchema,
    type GenerateOTPFormData,
    verifyOTPSchema,
    type VerifyOTPType,
    type RegisterationType,
    createProfileSchema,
    type createProfileType,
} from '@melinia/shared';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router';
import { ZodError } from 'zod';
import { useMutation } from '@tanstack/react-query'; // 1. Import useMutation

const Register: React.FC = () => {
    const router = useNavigate();

    // 2. Initialize state from localStorage to sustain on refresh
   const [currentStep, setCurrentStep] = useState<number>(1);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Restore email if it exists, otherwise null
    const [emailID, setEmailID] = useState<GenerateOTPFormData | null>();
    
    const [otp, setOTP] = useState<VerifyOTPType | null>(null);

    const [passwordFormData, setPasswordFormData] = useState<RegisterationType>({
        passwd: '',
        confirmPasswd: '',
    });

    const [profileFormData, setProfileFormData] = useState<createProfileType>({
        firstName: '',
        lastName: '',
        college: '',
        degree: '',
        otherDegree: null,
        year: 0,
        ph_no: '',
    });

    const steps: Step[] = [
        { number: 1, label: 'Email' },
        { number: 2, label: 'OTP' },
        { number: 3, label: 'Password' },
        { number: 4, label: 'Profile' },
    ];

    // 3. Sync currentStep to localStorage
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
                            });
                            setErrors(formattedErrors);
                            return;
                        }
                    } catch (e) {
                        // Ignore parse error
                    }
                }
            }
            const message = data ? data : 'An error occurred';
            setErrors({ [fieldName]: message });
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

    // 4. Setup Mutations

    // Email Mutation
    const emailMutation = useMutation({
        mutationFn: (data: GenerateOTPFormData) => authClient.sendOTP(data),
        onSuccess: (response, variables) => {
            setEmailID(variables);
            setCurrentStep(2);
            toast.success("OTP sent to email")
        },
        onError: (error) => getBackendErrorMessage(error, 'email'),
    });

    // OTP Mutation
    const otpMutation = useMutation({
        mutationFn: (data: VerifyOTPType) => authClient.verifyOTP(data),
        onSuccess: (data, variables) => {
            setOTP(variables);
            setCurrentStep(3);
            toast.success("OTP verified")
        },
        onError: (error) => getBackendErrorMessage(error, 'otp'),
    });

    // Password Mutation
    const passwordMutation = useMutation({
        mutationFn: (data: RegisterationType) => authClient.setPassword(data),
        onSuccess: () => {
            setCurrentStep(4);

            toast.success("Password Saved!")
        },
        onError: (error) => getBackendErrorMessage(error, 'form'),
    });

    // Profile Mutation
    const profileMutation = useMutation({
        mutationFn: (data: createProfileType) => authClient.setUpProfile(data),
        onSuccess: () => {
            
            // Reset form data
            setProfileFormData({
                firstName: '',
                lastName: '',
                college: '',
                degree: '',
                otherDegree: '',
                year: 0,
                ph_no: '',
            });
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

    const handleProfileSubmit = async (data: createProfileType): Promise<void> => {
        try {
            setErrors({});
            const validatedData = await createProfileSchema.parse(data);

            const fullProfileData: createProfileType = {
                ph_no: validatedData.ph_no,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                college: validatedData.college,
                degree: validatedData.degree,
                otherDegree: validatedData.otherDegree,
                year: validatedData.year,
            };
            
            profileMutation.mutate(fullProfileData);
        } catch (error: unknown) {
            if (error instanceof ZodError) handleZodError(error);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-2 py-3 items-center">
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-full h-36 sm:h-40 rounded-2xl bg-[image:url('/melinia-alt.jpg')] bg-cover bg-center mb-10" />

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

                    {currentStep === 4 && (
                        <ProfileStep
                            formData={profileFormData}
                            onInputChange={(name: string, value: string) => {
                                if (name === 'year') {
                                    setProfileFormData((prev) => ({ ...prev, [name]: parseInt(value) }));
                                } else {
                                    setProfileFormData((prev) => ({ ...prev, [name]: value }));
                                }
                            }}
                            onSubmit={handleProfileSubmit}
                            errors={errors}
                            isLoading={profileMutation.isPending}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Register;
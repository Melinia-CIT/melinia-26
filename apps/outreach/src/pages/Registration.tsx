import React, { useState } from 'react';
import { EmailStep, OTPStep, PasswordStep, ProfileStep, ProgressBar, Step } from '../features/registration';
import { authClient } from '../lib/api/auth.api';
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
import { TypicalResponse } from '../types/api';
import { AxiosError } from 'axios';
import { useNavigate } from 'react-router';
import { ZodError } from 'zod';

const Register: React.FC = () => {
	const router = useNavigate();
	const [currentStep, setCurrentStep] = useState<number>(1);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const [emailID, setEmailID] = useState<GenerateOTPFormData | null>(null);
	const [loadingEmailForm, setLoadingEmailForm] = useState<boolean>(false);

	const [otp, setOTP] = useState<VerifyOTPType | null>(null);
	const [loadingOTPForm, setLoadingOTPForm] = useState<boolean>(false);

	const [passwordFormData, setPasswordFormData] = useState<RegisterationType>({
		passwd: '',
		confirmPasswd: '',
	});
	const [loadingPasswordForm, setLoadingPasswordForm] = useState<boolean>(false);
	const [profileFormData, setProfileFormData] = useState<createProfileType>({
		firstName: '',
		lastName: '',
		college: '',
		degree: '',
		otherDegree: null,
		year: 0,
		ph_no: '',
	});
	const [loadingProfileForm, setLoadingProfileForm] = useState<boolean>(false);


	const steps: Step[] = [
		{ number: 1, label: 'Email' },
		{ number: 2, label: 'OTP' },
		{ number: 3, label: 'Password' },
		{ number: 4, label: 'Profile' },
	];

	const getBackendErrorMessage = (error: unknown, fieldName: string): void => {
		if (error instanceof AxiosError) {
			const data = error.response?.data;
			console.log("data:", data);

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
						// If parsing fails, fall back to error message
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
		console.log("Zod validation error");
		const formattedErrors: Record<string, string> = {};
		error.issues.forEach((issue) => {
			const fieldName = String(issue.path[0]);
			formattedErrors[fieldName] = issue.message;
		});
		setErrors(formattedErrors);
	};

	const handleEmailSubmit = async (data: GenerateOTPFormData): Promise<void> => {
		try {
			setErrors({});
			setLoadingEmailForm(true);

			const validatedData = await generateOTPSchema.parse(data);
			const response = await authClient.sendOTP(validatedData);
			//console.log(response);

			setEmailID(validatedData);
			setCurrentStep(2);
		} catch (error: unknown) {
			if (error instanceof ZodError) {
				handleZodError(error);
			} else {
				getBackendErrorMessage(error, 'email');
			}
		} finally {
			setLoadingEmailForm(false);
		}
	};

	const handleOTPSubmit = async (data: VerifyOTPType): Promise<void> => {
		try {
			setErrors({});
			setLoadingOTPForm(true);
			const validatedData = await verifyOTPSchema.parse(data);
			const response = await authClient.verifyOTP(validatedData);

			setOTP(validatedData);
			// Move to next step after successful verification
			setCurrentStep(3);
			console.log("current step:", currentStep)
		} catch (error: unknown) {
			if (error instanceof ZodError) {
				handleZodError(error);
			} else {
				getBackendErrorMessage(error, 'otp');
			}
		} finally {
			// Always set loading to false in finally block
			setLoadingOTPForm(false);
		}
	};

	const handlePasswordSubmit = async (data: RegisterationType): Promise<void> => {
		try {
			setErrors({});
			setLoadingPasswordForm(true);

			const validatedData = await registrationSchema.parse(data);
			setPasswordFormData(validatedData);
			const response = await authClient.setPassword(validatedData);

			setCurrentStep(4);
		} catch (error: unknown) {
			if (error instanceof ZodError) {
				handleZodError(error);
			} else {
				getBackendErrorMessage(error, 'form');
			}
		} finally {
			setLoadingPasswordForm(false);
		}
	};

	const handleProfileSubmit = async (data: createProfileType): Promise<void> => {
		try {
			setErrors({});
			console.log("clicked")
			setLoadingProfileForm(true);
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
			console.log(fullProfileData);
			const response = await authClient.setUpProfile(fullProfileData);

			if (response) {
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

				alert('Registration completed successfully!');
				// Use setTimeout to ensure state updates complete before navigation
				setTimeout(() => {
					router('/user');
				}, 0);
			}
		} catch (error: unknown) {
			if (error instanceof ZodError) {
				handleZodError(error);
			} else {
				getBackendErrorMessage(error, 'form');
			}
		} finally {
			setLoadingProfileForm(false);
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
							isLoading={loadingEmailForm}
						/>
					)}

					{currentStep === 2 && (
						<OTPStep
							onSubmit={handleOTPSubmit}
							errors={errors}
							email={emailID?.email || ''}
							isLoading={loadingOTPForm}
						/>
					)}

					{currentStep === 3 && (
						<PasswordStep
							onSubmit={handlePasswordSubmit}
							errors={errors}
							isLoading={loadingPasswordForm}
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
							isLoading={loadingProfileForm}
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default Register;
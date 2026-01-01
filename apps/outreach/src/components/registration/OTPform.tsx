import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOTPSchema, type VerifyOTPType } from "@melinia/shared";

interface OTPStepProps {
	onSubmit: (data: VerifyOTPType) => Promise<void>;
	errors?: Record<string, string>;
	email: string;
	isLoading: boolean;
}

export const OTPStep: React.FC<OTPStepProps> = ({
	onSubmit,
	errors,
	email,
	isLoading,
}) => {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors: formErrors },
	} = useForm<VerifyOTPType>({
		resolver: zodResolver(verifyOTPSchema),
		mode: "onChange",
	});

	const otpValue = watch("otp", "");

	const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.replace(/\D/g, "").slice(0, 6);
		setValue("otp", value);
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
			<h2 className="text-xl font-semibold mb-6">Verify OTP</h2>
			<p className="text-zinc-400 text-sm mb-4">
				Enter the 6-digit OTP sent to {email}
			</p>

			<div>
				<label className="block text-sm font-medium mb-2">OTP</label>
				<input
					type="text"
					placeholder="000000"
					disabled={isLoading}
					maxLength={6}
					{...register("otp")}
					onChange={handleOtpChange}
					className={`w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none tracking-widest text-center text-2xl ${formErrors.otp
							? "border-red-500 focus:border-red-500"
							: "border-zinc-700 focus:border-zinc-500"
						} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
				/>
				{formErrors.otp?.message && (
					<p className="text-red-500 text-sm mt-1">
						{String(formErrors.otp.message)}
					</p>
				)}
				{errors?.otp && !formErrors.otp && (
					<p className="text-red-500 text-sm mt-1">{errors.otp}</p>
				)}
			</div>

			<button
				type="submit"
				disabled={isLoading || otpValue.length !== 6}
				className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded font-medium transition"
			>
				{isLoading ? "Verifying..." : "Verify OTP"}
			</button>
		</form>
	);
};
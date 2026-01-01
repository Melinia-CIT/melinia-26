import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { generateOTPSchema, type GenerateOTPFormData } from "@melinia/shared";

interface EmailStepProps {
	onSubmit: (data: GenerateOTPFormData) => Promise<void>;
	errors?: Record<string, string>;
	isLoading: boolean;
}

export const EmailStep: React.FC<EmailStepProps> = ({
	onSubmit,
	errors,
	isLoading,
}) => {
	const {
		register,
		handleSubmit,
		formState: { errors: formErrors },
	} = useForm<GenerateOTPFormData>({
		resolver: zodResolver(generateOTPSchema),
		mode: "onBlur",
	});

	return (
		<form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
			<h2 className="text-xl font-semibold mb-6">Enter Your Email</h2>

			<div>
				<label className="block text-sm font-medium mb-2">Email</label>
				<input
					type="email"
					placeholder="you@example.com"
					disabled={isLoading}
					{...register("email")}
					className={`w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none ${formErrors.email
						? "border-red-500 focus:border-red-500"
						: "border-zinc-700 focus:border-zinc-500"
						} ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
				/>
				{formErrors.email && (
					<p className="text-red-500 text-sm mt-1">{String(formErrors.email.message)}</p>
				)}
				{errors?.email && (
					<p className="text-red-500 text-sm mt-1">{errors.email}</p>
				)}
			</div>

			<button
				type="submit"
				disabled={isLoading}
				className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded font-medium transition"
			>
				{isLoading ? "Sending OTP..." : "Send OTP"}
			</button>
		</form>
	);
};
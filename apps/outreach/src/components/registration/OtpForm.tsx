import { useRef, useEffect, useState } from "react";
import { UseMutationResult } from "@tanstack/react-query";

interface OtpFormProps {
	mutation: UseMutationResult<any, Error, { otp: string }, unknown>;
	isVerified: boolean;
	onOtpSubmit: (otp: string) => void;
}

const OtpForm = ({ mutation, isVerified, onOtpSubmit }: OtpFormProps) => {
	const [otpValue, setOtpValue] = useState<string[]>(["", "", "", "", "", ""]);
	const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

	// Focus first input when component mounts
	useEffect(() => {
		inputRefs.current[0]?.focus();
	}, []);

	const handleOtpChange = (index: number, value: string) => {
		const sanitizedValue = value.replace(/[^0-9]/g, "");
		const newOtp = [...otpValue];
		newOtp[index] = sanitizedValue;
		setOtpValue(newOtp);

		// Auto focus next input
		if (sanitizedValue && index < 5) {
			inputRefs.current[index + 1]?.focus();
		}

		// Auto submit when full
		const fullOtp = newOtp.join("");
		if (fullOtp.length === 6) {
			onOtpSubmit(fullOtp);
		}
	};

	const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Backspace" && !otpValue[index] && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	return (
		<div className="flex flex-col gap-6">
			<div className="flex justify-between gap-2 sm:gap-4">
				{otpValue.map((digit, index) => (
					<input
						key={index}
						ref={(el) => {
							inputRefs.current[index] = el;
						}}
						type="text"
						inputMode="numeric"
						maxLength={1}
						value={digit}
						disabled={mutation.isPending || isVerified}
						onChange={(e) => handleOtpChange(index, e.target.value)}
						onKeyDown={(e) => handleOtpKeyDown(index, e)}
						className={`w-full aspect-square rounded-lg bg-zinc-900 border text-center text-xl font-bold text-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${mutation.isError ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'}
            `}
					/>
				))}
			</div>
		</div>
	);
};

export default OtpForm;

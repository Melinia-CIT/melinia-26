import React from "react";
import { Errors } from "./types";

// OTP Step Component
interface OTPStepProps {
    otp: string;
    onOtpChange: (value: string) => void;
    onSubmit: () => void;
    errors: Errors;
    email: string;
    isLoading: boolean;
}

export const OTPStep: React.FC<OTPStepProps> = ({ otp, onOtpChange, onSubmit, errors, email, isLoading }) => {
    const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        onOtpChange(value);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && otp.length === 6) {
            onSubmit();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Verify OTP</h2>
            <p className="text-zinc-400 text-sm mb-4">Enter the 6-digit OTP sent to {email}</p>
            <div>
                <label className="block text-sm font-medium mb-2">OTP</label>
                <input
                    type="text"
                    value={otp}
                    onChange={handleOtpChange}
                    onKeyPress={handleKeyPress}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500 tracking-widest text-center text-2xl"
                />
                {errors.otp && <p className="text-red-500 text-sm mt-1">{errors.otp}</p>}
            </div>
            <button
                onClick={onSubmit}
                disabled={isLoading || otp.length !== 6}
                className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded font-medium transition"
            >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
            </button>
        </div>
    );
};

import React from "react";
import { Errors } from "./types";

// Email Step Component
interface EmailStepProps {
    email: string;
    onEmailChange: (value: string) => void;
    onSubmit: () => void;
    errors: Errors;
    isLoading: boolean;
}

export const EmailStep: React.FC<EmailStepProps> = ({
    email,
    onEmailChange,
    onSubmit,
    errors,
    isLoading,
}) => {
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSubmit();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-6">Enter Your Email</h2>
            <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => onEmailChange(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500"
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <button
                onClick={onSubmit}
                disabled={isLoading}
                className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded font-medium transition"
            >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
            </button>
        </div>
    );
};


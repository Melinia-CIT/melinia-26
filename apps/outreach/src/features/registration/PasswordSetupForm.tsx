import React from "react";
import { Errors } from "./types";

// Password Step Component
interface PasswordStepProps {
    passwd: string;
    confirmPasswd: string;
    onPasswordChange: (name: string, value: string) => void;
    onSubmit: () => void;
    errors: Errors;
    isLoading: boolean;
  }
  
  export const PasswordStep: React.FC<PasswordStepProps> = ({
    passwd,
    confirmPasswd,
    onPasswordChange,
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
        <h2 className="text-xl font-semibold mb-6">Set Your Password</h2>
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            value={passwd}
            onChange={(e) => onPasswordChange('passwd', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter password"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />
          <p className="text-zinc-500 text-xs mt-2">
            Must be 8+ characters with uppercase, lowercase, and number
          </p>
          {errors.passwd && <p className="text-red-500 text-sm mt-1">{errors.passwd}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Confirm Password</label>
          <input
            type="password"
            value={confirmPasswd}
            onChange={(e) => onPasswordChange('confirmPasswd', e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Confirm password"
            className="w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-zinc-500"
          />
          {errors.confirmPasswd && (
            <p className="text-red-500 text-sm mt-1">{errors.confirmPasswd}</p>
          )}
        </div>
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 rounded font-medium transition"
        >
          {isLoading ? 'Submitting...' : 'Next'}
        </button>
      </div>
    );
  };
  

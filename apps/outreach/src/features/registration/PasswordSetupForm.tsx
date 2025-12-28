import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema, type RegisterationType } from "@melinia/shared";

interface PasswordStepProps {
  onSubmit: (data: RegisterationType) => Promise<void>;
  errors: Record<string, string>;
  isLoading: boolean;
}

export const PasswordStep: React.FC<PasswordStepProps> = ({
  onSubmit,
  errors,
  isLoading,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<RegisterationType>({
    resolver: zodResolver(registrationSchema),
    mode: "onBlur",
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <h2 className="text-xl font-semibold mb-6">Set Your Password</h2>

      <div>
        <label className="block text-sm font-medium mb-2">Password</label>
        <input
          type="password"
          placeholder="Enter password"
          disabled={isLoading}
          {...register("passwd")}
          className={`w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none ${formErrors.passwd
              ? "border-red-500 focus:border-red-500"
              : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        <p className="text-zinc-500 text-xs mt-2">
          Must be 8+ characters with uppercase, lowercase, and number
        </p>
        {formErrors.passwd?.message && (
          <p className="text-red-500 text-sm mt-1">
            {String(formErrors.passwd.message)}
          </p>
        )}
        {errors.passwd && !formErrors.passwd && (
          <p className="text-red-500 text-sm mt-1">{errors.passwd}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Confirm Password</label>
        <input
          type="password"
          placeholder="Confirm password"
          disabled={isLoading}
          {...register("confirmPasswd")}
          className={`w-full px-4 py-2 rounded bg-zinc-800 text-zinc-100 placeholder-zinc-500 border transition focus:outline-none ${formErrors.confirmPasswd
              ? "border-red-500 focus:border-red-500"
              : "border-zinc-700 focus:border-zinc-500"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        />
        {formErrors.confirmPasswd?.message && (
          <p className="text-red-500 text-sm mt-1">
            {String(formErrors.confirmPasswd.message)}
          </p>
        )}
        {errors.confirmPasswd && !formErrors.confirmPasswd && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPasswd}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-4 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 rounded font-medium transition"
      >
        {isLoading ? "Submitting..." : "Next"}
      </button>
    </form>
  );
};
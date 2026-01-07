import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key, Lock, Eye, EyeClosed } from "iconoir-react";
import { registrationSchema, type RegistrationType } from "@melinia/shared";
import { UseMutationResult } from "@tanstack/react-query";

interface PasswordFormProps {
    mutation: UseMutationResult<any, Error, RegistrationType, unknown>;
}

const PasswordForm = ({ mutation }: PasswordFormProps) => {
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegistrationType>({
        resolver: zodResolver(registrationSchema),
        mode: "onBlur",
    });

    const onSubmit = (data: RegistrationType) => {
        mutation.mutate(data);
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Password */}
            <div className="w-full">
                <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors duration-200
              ${errors.passwd ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'}
            `}
                        {...register("passwd")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        {showPassword ? <EyeClosed strokeWidth={1.5} width={20} height={20} /> : <Eye strokeWidth={1.5} width={20} height={20} />}
                    </button>
                </div>
                {errors.passwd && (
                    <p className="text-red-400 text-xs mt-1 pl-1">{errors.passwd.message}</p>
                )}
            </div>

            {/* Confirm Password */}
            <div className="w-full">
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors duration-200
              ${errors.confirmPasswd ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'}
            `}
                        {...register("confirmPasswd")}
                    />
                </div>
                {errors.confirmPasswd && (
                    <p className="text-red-400 text-xs mt-1 pl-1">{errors.confirmPasswd.message}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-white py-3 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
                {mutation.isPending ? "Creating Account..." : "Create Account"}
            </button>
        </form>
    );
};

export default PasswordForm;

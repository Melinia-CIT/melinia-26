import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { Eye, EyeClosed, Lock } from "iconoir-react";
import toast from "react-hot-toast";
import { z } from "zod";
import { resetPasswordSchema as baseResetPasswordSchema } from "@melinia/shared";

const resetPasswordSchema = baseResetPasswordSchema.omit({ token: true })
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

const ResetPassword = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [searchParams] = useSearchParams();

    const token = searchParams.get("token");

    const {
            register,
            handleSubmit,
            formState: { errors, isValid },
    } = useForm<ResetPasswordForm>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onChange",
    });

    const resetMutation = useMutation({
        mutationFn: async (data: ResetPasswordForm) => {
            if (!token) {
                throw new Error("Invalid or missing reset token.");
            }

            const payload = {
                token: token,
                newPasswd: data.newPasswd,
            };

            const response = await api.post("/auth/reset-password", payload);
            return response.data;
        },
        onSuccess: () => {
            toast.success("Password has been reset successfully!");
            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 2000);
        },
        onError: (error: any) => {
            console.error(error);
            const message = error.response?.data?.message || error.message || "Failed to reset password.";
            toast.error(message);
        },
    });

    const onSubmit = (data: ResetPasswordForm) => {
        resetMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center font-geist">
            <div className="w-full max-w-md flex flex-col items-center">

                <p className="font-inst font-bold text-2xl self-start mb-2 tracking-wide">
                    Reset Password
                </p>
                <p className="text-sm text-zinc-400 self-start mb-6">
                    Enter your new password below.
                </p>

                {/* Token Missing Warning */}
                {!token && (
                    <div className="w-full p-4 mb-4 bg-red-500/10 border border-red-500/50 text-red-200 rounded-lg text-sm flex justify-between items-center">
                        <span>Error: No reset token found in URL.</span>
                        <Link to="/login" className="underline hover:text-white ml-2">Go to Login</Link>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
                    {/* Password Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                autoComplete="new-password"
                                className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors duration-200 pr-10
                    ${errors.newPasswd ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'}
                `}
                                disabled={!token || resetMutation.isSuccess}
                                {...register("newPasswd")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                            >
                                {showPassword ? <EyeClosed strokeWidth={1.5} width={20} height={20} /> : <Eye strokeWidth={1.5} width={20} height={20} />}
                            </button>
                        </div>
                        {errors.newPasswd && (
                            <p className="text-red-400 text-xs mt-1 pl-1">{errors.newPasswd.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={resetMutation.isPending || !token || resetMutation.isSuccess || !isValid}
                        className="w-full rounded-lg bg-white py-2 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {resetMutation.isPending ? "Resetting..." : "Confirm Password"}
                    </button>
                </form>

                {resetMutation.isSuccess && (
                    <p className="mt-4 text-sm text-green-400 text-center">
                        Redirecting to login...
                    </p>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;

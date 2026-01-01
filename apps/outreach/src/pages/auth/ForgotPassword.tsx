import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPasswordSchema, type ForgotPassword } from "@melinia/shared";
import { Mail } from "iconoir-react";
import api from "../../services/api";


const ForgotPassword = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
    } = useForm<ForgotPassword>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onChange",
    });

    const forgotMutation = useMutation({
        mutationFn: async (data: ForgotPassword) => {
            const response = await api.post("/auth/forgot-password", data);
            return response.data;
        },
        onSuccess: (response: any) => {
            toast.success(response?.message || "Reset link sent to your email!");
        },
        onError: (error: any) => {
            console.error(error);
            const message = error.response?.data?.message || "Failed to send reset link. Please try again.";
            toast.error(message);
        },
    });

    const onSubmit = (data: ForgotPassword) => {
        forgotMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center font-geist">
            <div className="w-full max-w-md flex flex-col items-center">

                <p className="font-inst font-bold text-2xl self-start mb-2 tracking-wide">
                    Forgot Password
                </p>
                <p className="text-sm text-zinc-400 self-start mb-6">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">

                    {/* Email Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type="email"
                                placeholder="Email"
                                autoComplete="email"
                                className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-4  py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors duration-200
                    ${errors.email ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'} `}
                                disabled={forgotMutation.isSuccess}
                                {...register("email")}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-1 pl-1">{errors.email.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={forgotMutation.isPending || !isValid || forgotMutation.isSuccess}
                        className="w-full rounded-lg bg-white py-2 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {forgotMutation.isPending ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 text-center w-full flex justify-center items-center gap-2">
                    <p className="text-sm text-zinc-400">Spidy sense working?</p>
                    <Link to="/login" className="text-sm text-zinc-100 hover:text-white transition-colors font-medium">
                        Back to Login
                    </Link>
                </div>

                {forgotMutation.isSuccess && (
                    <p className="mt-4 text-sm text-zinc-400 text-center animate-pulse">
                        Check your inbox (and spam folder).
                    </p>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
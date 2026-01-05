import { useState } from "react";
import { Eye, EyeClosed, Mail, Lock } from "iconoir-react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { adminLoginSchema, type AdminLoginInput } from "@melinia/shared";
import { adminLogin } from "../../services/auth";

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AdminLoginInput>({
        resolver: zodResolver(adminLoginSchema),
    });

    const loginMutation = useMutation({
        mutationFn: async (data: AdminLoginInput) => await adminLogin(data),
        onSuccess: () => {
            setApiError(null);
            navigate("/dashboard", { replace: true });
        },
        onError: (error: any) => {
            console.error(error);
            const message = error.response?.data?.message || "Incorrect email or password";
            setApiError(message);
        },
    });

    const onSubmit = (data: AdminLoginInput) => {
        setApiError(null);
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center font-geist text-base">
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-full h-36 sm:h-40 rounded-2xl bg-[image:url('https://cdn.melinia.dev/melinia-alt.webp')] bg-cover bg-center mb-10 shadow-lg shadow-zinc-900/50" />
                <p className="font-inst font-bold text-2xl self-start mb-6">Admin Login</p>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center gap-4">
                    {apiError && (
                        <div className="w-full rounded-lg bg-red-900/40 border border-red-700 px-3 py-2 text-sm text-red-200">
                            {apiError}
                        </div>
                    )}
                    {/* Email Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type="email"
                                placeholder="Email"
                                {...register("email")}
                                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors duration-200"
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                {...register("passwd")}
                                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors duration-200"
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
                            <p className="text-red-500 text-xs mt-1">{errors.passwd.message}</p>
                        )}
                    </div>

                    <div className="self-end -mt-2">
                        <a href="#" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                            Forgot Password?
                        </a>
                    </div>
                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full rounded-lg bg-white py-2 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition flex justify-center items-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loginMutation.isPending ? "Logging in..." : "Continue"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

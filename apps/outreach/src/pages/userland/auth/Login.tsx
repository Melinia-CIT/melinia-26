import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { loginSchema, type Login } from "@melinia/shared";
import { Eye, EyeClosed, Mail, Lock } from "iconoir-react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router";
import { login } from "../../../services/auth";


const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Login>({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useMutation({
        mutationFn: async (data: Login) => await login(data),
        onSuccess: () => {
            toast.success("Login successful!");
            setTimeout(() => {
                navigate("/app", { replace: true });
            }, 1000);
        },
        onError: (error: any) => {
            console.error(error);
            const message = error.response?.data?.message || "Login failed. Please try again.";
            toast.error(message);
        },
    });

    const onSubmit = (data: Login) => {
        // If there are validation errors, toast them.
        if (Object.keys(errors).length > 0) {
            toast.error("Please fix the errors in the form.");
            return;
        }
        loginMutation.mutate(data);
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center font-geist text-base">
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-full h-36 sm:h-40 rounded-2xl bg-[image:url('https://cdn.melinia.in/melinia-alt.webp')] bg-cover bg-center mb-10 shadow-lg shadow-zinc-900/50" />
                <p className="font-inst font-bold text-2xl self-start mb-6">Login</p>

                <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col items-center gap-4">
                    {/* Email Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type="text"
                                placeholder="Email"
                                className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors duration-200
                                ${errors.email ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'} `}
                                {...register("email")}
                            />
                        </div>
                        {errors.email && (
                            <p className="text-red-400 text-xs mt-1 pl-1">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Password Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-10 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 transition-colors duration-200
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

                    <div className="self-end -mt-2">
                        <Link to="/forgot-password" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                            Forgot Password?
                        </Link>
                    </div>
                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full rounded-lg bg-white py-2 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                    >
                        {loginMutation.isPending ? "Logging in..." : "Continue"}
                    </button>
                </form>

                <p className="text-sm text-zinc-500 mt-4">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-zinc-100 hover:text-white hover:underline transition-colors">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;

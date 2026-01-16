import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Key, Lock, Eye, EyeClosed, CheckCircle } from "iconoir-react";
import { ChevronDown, TicketPercent } from "lucide-react";
import { registrationSchema, type RegistrationType } from "@melinia/shared";
import { UseMutationResult } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../services/api";

interface PasswordFormProps {
    mutation: UseMutationResult<any, Error, RegistrationType, unknown>;
}

const PasswordForm = ({ mutation }: PasswordFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);
    const [couponValid, setCouponValid] = useState<boolean | null>(null);
    const [showCoupon, setShowCoupon] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegistrationType>({
        resolver: zodResolver(registrationSchema),
        mode: "onBlur",
    });

    const onSubmit = (data: RegistrationType) => {
        const payload = { ...data };

        if (!payload.couponCode || payload.couponCode.trim() === "") {
            delete payload.couponCode;
        }

        mutation.mutate(payload);
    };

    const checkCoupon = async (code: string) => {
        if (!code || code.trim() === "") {
            setCouponValid(null);
            return;
        }

        setIsCheckingCoupon(true);
        try {
            await api.get("/coupons/check", { code });
            setCouponValid(true);
        } catch (error: any) {
            const message = error.response?.data?.message || "Invalid coupon code.";
            setCouponValid(false);
            toast.error(message);
        } finally {
            setIsCheckingCoupon(false);
        }
    };

    const inputClasses = (hasError?: boolean) => `
        w-full rounded-lg bg-zinc-900 border pl-10 pr-10 py-3 text-sm text-zinc-100 
        placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors duration-200
        ${hasError ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-800 focus:ring-zinc-600'}
    `;

    const IconWrapper = ({ children }: { children: React.ReactNode }) => (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {children}
        </div>
    );

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {/* Password */}
            <div>
                <div className="relative">
                    <IconWrapper>
                        <Key strokeWidth={1.5} width={20} height={20} />
                    </IconWrapper>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className={inputClasses(!!errors.passwd)}
                        {...register("passwd")}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                        {showPassword ? (
                            <EyeClosed strokeWidth={1.5} width={20} height={20} />
                        ) : (
                            <Eye strokeWidth={1.5} width={20} height={20} />
                        )}
                    </button>
                </div>
                {errors.passwd && (
                    <p className="text-red-400 text-xs mt-1 pl-1">{errors.passwd.message}</p>
                )}
            </div>

            {/* Confirm Password */}
            <div>
                <div className="relative">
                    <IconWrapper>
                        <Lock strokeWidth={1.5} width={20} height={20} />
                    </IconWrapper>
                    <input
                        type="password"
                        placeholder="Confirm Password"
                        className={inputClasses(!!errors.confirmPasswd)}
                        {...register("confirmPasswd")}
                    />
                </div>
                {errors.confirmPasswd && (
                    <p className="text-red-400 text-xs mt-1 pl-1">{errors.confirmPasswd.message}</p>
                )}
            </div>

            {/* Coupon Toggle Button */}
            <button
                type="button"
                onClick={() => setShowCoupon(!showCoupon)}
                className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors pt-1"
            >
                <ChevronDown
                    strokeWidth={2}
                    width={16}
                    height={16}
                    className={`transition-transform ${showCoupon ? 'rotate-180' : ''}`}
                />
                {showCoupon ? 'Hide' : 'Have a coupon code?'}
            </button>

            {/* Coupon Code */}
            {showCoupon && (
                <div className="pt-2">
                    <div className="relative">
                        <IconWrapper>
                            <TicketPercent strokeWidth={1.5} width={20} height={20} />
                        </IconWrapper>
                        <input
                            type="text"
                            placeholder="Coupon Code"
                            className={`w-full rounded-lg bg-zinc-900 border pl-10 pr-10 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 transition-colors duration-200
                                ${couponValid === false ? 'border-red-500 focus:ring-red-500/50' : 'border-zinc-700 focus:ring-zinc-500/50'}
                            `}
                            {...register("couponCode", {
                                onChange: (e) => {
                                    const uppercasedValue = e.target.value.toUpperCase();
                                    e.target.value = uppercasedValue;
                                    setValue("couponCode", uppercasedValue);
                                },
                                onBlur: (e) => checkCoupon(e.target.value),
                            })}
                        />
                        {isCheckingCoupon && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-zinc-500 border-t-zinc-200 rounded-full animate-spin" />
                        )}
                        {couponValid === true && (
                            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" strokeWidth={2} />
                        )}
                    </div>
                </div>
            )}

            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full rounded-lg bg-white py-3 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
                {mutation.isPending ? "Creating Account..." : "Create Account"}
            </button>
        </form>
    );
};

export default PasswordForm;


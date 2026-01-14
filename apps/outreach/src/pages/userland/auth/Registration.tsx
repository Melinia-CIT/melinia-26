import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import { sendOTP, verifyOTP, register } from "../../../services/auth";
import EmailForm from "../../../components/registration/EmailForm";
import OtpForm from "../../../components/registration/OtpForm";
import PasswordForm from "../../../components/registration/PasswordForm";
import { CheckCircle } from "iconoir-react";

const Registration = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [userEmail, setUserEmail] = useState("");
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(true);
    const [isOtpVerified, setIsOtpVerified] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        // If timer is greater than 0 and we are waiting, start the interval
        if (timer > 0 && !canResend) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        // If timer hits 0, allow resending
        else if (timer === 0) {
            setCanResend(true);
        }

        // Cleanup interval on unmount or when dependency changes
        return () => clearInterval(interval);
    }, [timer, canResend]);


    // 1. Send OTP Mutation
    const sendOTPMutation = useMutation({
        mutationFn: sendOTP,
        onSuccess: () => {
            if (currentStep === 2) {
                toast.success("OTP Resent Successfully!");
            } else {
                toast.success("OTP sent to your email!");
            }
            setTimer(60);
            setCanResend(false);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Failed to send OTP.";
            toast.error(message);
        },
    });

    // 2. Verify OTP Mutation
    const verifyOTPMutation = useMutation({
        mutationFn: verifyOTP,
        onSuccess: () => {
            toast.success("Email verified successfully!");
            setIsOtpVerified(true);
            setCurrentStep(3);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Invalid OTP.";
            toast.error(message);
            setIsOtpVerified(false);
        },
    });

    // 3. Register Mutation
    const registerMutation = useMutation({
        mutationFn: register,
        onSuccess: () => {
            toast.success("Account created! Redirecting...");
            setTimeout(() => {
                navigate("/app", { replace: true });
            }, 1000);
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || "Registration failed.";
            toast.error(message);
        },
    });

    // Called by EmailForm on success
    const handleEmailSuccess = (data: { email: string }) => {
        setUserEmail(data.email);

        setTimer(60);
        setCanResend(false);

        setCurrentStep(2);
    };

    // Called by OtpForm when user fills OTP
    const handleOtpSubmit = (otp: string) => {
        verifyOTPMutation.mutate({ otp });
    };

    const handleResendClick = () => {
        sendOTPMutation.mutate({ email: userEmail });
    };

    // Helper for Stepper UI
    const getStepStatus = (step: number) => {
        if (currentStep > step) return "completed";
        if (currentStep === step) return "active";
        return "pending";
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center font-geist text-base selection:bg-zinc-700">
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-4">

                {/* --- LEFT: STEPPER (Same as before) --- */}
                <div className="hidden md:flex flex-col justify-center order-1 md:order-1">
                    {/* ... Stepper UI remains exactly the same ... */}
                    <div className="space-y-8 relative">
                        <div className="absolute left-[19px] top-8 bottom-8 w-[2px] bg-zinc-800 -z-10" />
                        {/* Step 1 */}
                        <div className={`flex items-center gap-4 transition-all duration-300 ${getStepStatus(1) === 'active' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
            ${getStepStatus(1) === 'completed' ? 'bg-green-500/20 border-green-500 text-green-500' :
                                    getStepStatus(1) === 'active' ? 'bg-zinc-900 border-zinc-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                                {getStepStatus(1) === 'completed' ? <CheckCircle width={20} height={20} /> : <span className="text-sm font-bold">1</span>}
                            </div>
                            <div>
                                <h3 className={`font-bold ${getStepStatus(1) === 'active' ? 'text-white' : 'text-zinc-400'}`}>Verify Email</h3>
                                <p className="text-xs text-zinc-500">Enter your email to receive a code.</p>
                            </div>
                        </div>
                        {/* Step 2 */}
                        <div className={`flex items-center gap-4 transition-all duration-300 ${getStepStatus(2) === 'active' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
            ${getStepStatus(2) === 'completed' ? 'bg-green-500/20 border-green-500 text-green-500' :
                                    getStepStatus(2) === 'active' ? 'bg-zinc-900 border-zinc-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                                {getStepStatus(2) === 'completed' ? <CheckCircle width={20} height={20} /> : <span className="text-sm font-bold">2</span>}
                            </div>
                            <div>
                                <h3 className={`font-bold ${getStepStatus(2) === 'active' ? 'text-white' : 'text-zinc-400'}`}>Enter OTP</h3>
                                <p className="text-xs text-zinc-500">Check your inbox for the 6-digit code.</p>
                            </div>
                        </div>
                        {/* Step 3 */}
                        <div className={`flex items-center gap-4 transition-all duration-300 ${getStepStatus(3) === 'active' ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors
            ${getStepStatus(3) === 'completed' ? 'bg-green-500/20 border-green-500 text-green-500' :
                                    getStepStatus(3) === 'active' ? 'bg-zinc-900 border-zinc-400 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-600'}`}>
                                {getStepStatus(3) === 'completed' ? <CheckCircle width={20} height={20} /> : <span className="text-sm font-bold">3</span>}
                            </div>
                            <div>
                                <h3 className={`font-bold ${getStepStatus(3) === 'active' ? 'text-white' : 'text-zinc-400'}`}>Set Password</h3>
                                <p className="text-xs text-zinc-500">Create a secure password.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: FORM AREA --- */}
                <div className="w-full max-w-md mx-auto flex flex-col justify-center order-2 md:order-2">
                    <div className="w-full rounded-2xl bg-[image:url('https://cdn.melinia.in/melinia-alt.webp')] bg-cover bg-center mb-10 shadow-lg shadow-zinc-900/50 h-36 sm:h-40" />

                    {/* Mobile Slider Stepper */}
                    <div className="md:hidden flex justify-between items-center mb-8 px-2">
                        <div className={`h-1 flex-1 mx-1 rounded-full transition-colors ${currentStep > 1 ? 'bg-[#04692d]' : currentStep >= 1 ? 'bg-white' : 'bg-zinc-800'}`} />
                        <div className={`h-1 flex-1 mx-1 rounded-full transition-colors ${currentStep > 2 ? 'bg-[#04692d]' : currentStep >= 2 ? 'bg-white' : 'bg-zinc-800'}`} />
                        <div className={`h-1 flex-1 mx-1 rounded-full transition-colors ${currentStep > 3 ? 'bg-[#04692d]' : currentStep >= 3 ? 'bg-white' : 'bg-zinc-800'}`} />
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="font-inst font-bold text-3xl mb-2 text-white">
                            {currentStep === 1 && "Get Started"}
                            {currentStep === 2 && "Verify Email"}
                            {currentStep === 3 && "Create Account"}
                        </h1>
                        <p className="text-zinc-400 text-sm">
                            {currentStep === 1 && "With great power comes great responsibility."}
                            {currentStep === 2 && `We have sent a code to ${userEmail || "your email"}`}
                            {currentStep === 3 && "Almost there! Just set your password."}
                        </p>
                    </div>

                    {/* STEP 1 */}
                    {currentStep === 1 && (
                        <EmailForm mutation={sendOTPMutation} onSuccess={handleEmailSuccess} />
                    )}

                    {/* STEP 2 */}
                    {currentStep === 2 && (
                        <>
                            <OtpForm
                                mutation={verifyOTPMutation}
                                isVerified={isOtpVerified}
                                onOtpSubmit={handleOtpSubmit}
                            />
                            {/* Controls for Step 2 remain here because they rely on global state/timer */}
                            <div className="flex justify-between items-center mt-6">
                                <button
                                    onClick={() => setCurrentStep(1)}
                                    disabled={verifyOTPMutation.isPending || isOtpVerified}
                                    className={`text-sm transition-colors ${(verifyOTPMutation.isPending || isOtpVerified)
                                        ? 'text-zinc-700 cursor-not-allowed'
                                        : 'text-zinc-400 hover:text-white'
                                        }`}
                                >
                                    Change Email
                                </button>
                                <button
                                    onClick={handleResendClick}
                                    disabled={!canResend || sendOTPMutation.isPending || verifyOTPMutation.isPending || isOtpVerified}
                                    className={`text-sm font-medium transition-colors ${(canResend && !verifyOTPMutation.isPending && !isOtpVerified)
                                        ? 'text-zinc-300 hover:text-white'
                                        : 'text-zinc-600 cursor-not-allowed'
                                        }`}
                                >
                                    {canResend ? "Resend Code" : `Resend Code (${timer}s)`}
                                </button>
                            </div>
                        </>
                    )}

                    {/* STEP 3 */}
                    {currentStep === 3 && (
                        <PasswordForm mutation={registerMutation} />
                    )}

                    {
                        currentStep === 1 && (
                            <div className="mt-8 text-center">
                                <p className="text-sm text-zinc-600">
                                    Already have an account?{" "}
                                    <button onClick={() => navigate("/login")} className="text-zinc-400 hover:text-white hover:underline transition-colors">
                                        Login
                                    </button>
                                </p>
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    );
};

export default Registration;

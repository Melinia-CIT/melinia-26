import { useState } from "react";
import { Eye, EyeClosed, Mail, Lock } from "iconoir-react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

const Login = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (email === "admin" && password === "123") {
            toast.success("Login successful!");
            setTimeout(() => {
                navigate("/dashboard");
            }, 500);
        } else {
            toast.error("Invalid credentials!");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex justify-center px-4 py-6 items-center font-geist text-base">
            <div className="w-full max-w-md flex flex-col items-center">
                <div className="w-full h-36 sm:h-40 rounded-2xl bg-[image:url('https://cdn.melinia.dev/melinia-alt.webp')] bg-cover bg-center mb-10 shadow-lg shadow-zinc-900/50" />
                <p className="font-inst font-bold text-2xl self-start mb-6">Admin Login</p>

                <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
                    {/* Email Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type="text"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg bg-zinc-900 border border-zinc-800 pl-10 pr-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-colors duration-200"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="w-full">
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" strokeWidth={1.5} width={20} height={20} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                    </div>

                    <div className="self-end -mt-2">
                        <a href="#" className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
                            Forgot Password?
                        </a>
                    </div>
                    <button
                        type="submit"
                        className="w-full rounded-lg bg-white py-2 text-sm text-zinc-900 font-semibold hover:bg-zinc-200 transition flex justify-center items-center gap-2 mt-2"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;

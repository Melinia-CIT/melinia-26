import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";

interface HeroProps {
    isVisible?: boolean;
}

function Hero({ isVisible = true }: HeroProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (videoRef.current && isVisible) {
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(error => {
                console.error("Video auto-play failed:", error);
            });
        }
    }, [isVisible]);

    return (
        <div
            className={`relative h-[100dvh] w-full bg-black overflow-hidden flex items-center justify-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        >
            {/* Background Video */}
            <video
                ref={videoRef}
                src="/hero-bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* Dimming Overlay */}
            <div className="absolute inset-0 bg-black/40 z-[5]" />

            {/* Top Left Logos */}
            <div className="absolute top-8 left-8 z-30 flex items-center gap-4 md:gap-8">
                <img src="/cit-logo.png" alt="CIT Logo" className="h-8 md:h-12 w-auto object-contain" />
                <img src="/melinia.png" alt="Melinia Logo" className="h-8 md:h-10 w-auto object-contain" />
            </div>

            {/* Top Right Buttons */}
            <div className="absolute top-8 right-8 z-30 flex items-center gap-3 md:gap-4">
                <button
                    onClick={() => navigate("/login")}
                    className="px-5 md:px-7 py-2 md:py-2.5 text-sm md:text-base rounded-md border border-white/20 bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all font-medium text-white"
                >
                    Login
                </button>
                <button
                    onClick={() => navigate("/register")}
                    className="px-5 md:px-7 py-2 md:py-2.5 text-sm md:text-base rounded-md bg-white text-black font-bold hover:bg-gray-200 transition-all"
                >
                    Register
                </button>
            </div>

            {/* Main Logo (Static) */}
            <motion.img
                src="https://cdn.melinia.dev/melinia-26.png"
                alt="Melinia 26 Logo"
                className={`relative z-10 w-[20rem] sm:w-[25rem] md:w-[40rem] lg:w-[60rem] object-contain transition-all duration-1000 delay-500 ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]`}
            />

        </div>
    );
}

export default Hero;

import { useRef, useEffect } from "react";

interface HeroProps {
    isVisible?: boolean;
}

function Hero({ isVisible = true }: HeroProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && isVisible) {
            videoRef.current.playbackRate = 0.9;
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(error => {
                console.error("Video auto-play failed:", error);
            });
        }
    }, [isVisible]);

    return (
        /* Added 'flex items-center justify-center' to center the child elements */
        <div className={`relative h-[100dvh] w-full bg-black overflow-hidden flex items-center justify-center transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

            <video
                ref={videoRef}
                src="/hero-bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* The relative z-index ensures the logo sits on top of the absolute video */}
            <img
                src="https://cdn.melinia.dev/melinia-26.png"
                alt="Melinia 26 Logo"
                className={`relative z-10 w-[25rem] md:w-[24rem] lg:w-[60rem] object-contain transition-all duration-1000 delay-500 ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]`}
            />

        </div>
    );
}

export default Hero;

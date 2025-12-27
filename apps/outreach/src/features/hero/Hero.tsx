import { useRef, useEffect } from "react";

interface HeroProps {
    isVisible?: boolean;
}

function Hero({ isVisible = true }: HeroProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current && isVisible) {
            // Ensure video plays from the start
            videoRef.current.currentTime = 0;
            videoRef.current.play().catch(error => {
                console.error("Video auto-play failed:", error);
            });
        }
    }, [isVisible]);

    return (
        <div className={`relative h-[100dvh] w-full bg-black overflow-hidden transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Video with brightness filter */}
            <video
                ref={videoRef}
                src="/hero-bg.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Logo at the center */}
            <div
                className="absolute inset-0 flex items-center justify-center p-8"
                style={{
                    background: "url('https://cdn.melinia.dev/melinia-alt.jpg') center center/cover no-repeat",
                }}
            >
                {/* <img
                    src="/melinia-26.png"
                    alt="Melinia 26 Logo"
                    className={`w-64 md:w-96 lg:w-[32rem] object-contain transition-all duration-1000 delay-500 ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]`}
                /> */}
            </div>

        </div>
    );
}

export default Hero;


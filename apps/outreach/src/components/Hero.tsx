import { useRef, useEffect } from "react";

function Hero() {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            // Ensure video plays from the start
            videoRef.current.currentTime = 0;
        }
    }, []);

    return (
        <>
            <div className="relative h-[100dvh] w-full bg-black overflow-hidden">
                {/* Video with brightness filter */}
                <video
                    ref={videoRef}
                    src="/website-entry.mp4"
                    autoPlay
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover brightness-75"
                />
            </div>
        </>
    );
}

export default Hero;

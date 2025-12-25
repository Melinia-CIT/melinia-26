import { useState } from "react";

interface IntroVideoProps {
    onComplete: () => void;
}

const IntroVideo = ({ onComplete }: IntroVideoProps) => {
    const [isFading, setIsFading] = useState(false);

    const handleEnded = () => {
        setIsFading(true);
        // Wait for fade out animation to finish before unmounting
        setTimeout(() => {
            onComplete();
        }, 1000); // 1s fade out
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] bg-black flex items-center justify-center transition-opacity duration-1000 ${isFading ? 'opacity-0' : 'opacity-100'}`}
        >
            <video
                src="/spiderman-eyes.mp4"
                autoPlay
                muted
                playsInline
                onEnded={handleEnded}
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export default IntroVideo;

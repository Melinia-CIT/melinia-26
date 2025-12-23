

interface IntroVideoProps {
    onComplete: () => void;
}

const IntroVideo = ({ onComplete }: IntroVideoProps) => {




    const handleEnded = () => {
        // Optional: Add a small fade out if desired, but sticking to prompt strictly first.
        onComplete();
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "black",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
            }}
        >
            <style>
                {`
          @keyframes zoomIn {
            0% {
              transform: scale(1);
            }
            100% {
              transform: scale(4);
            }
          }
        `}
            </style>
            <video
                src="/miguel-entry.mp4"
                autoPlay
                muted
                playsInline
                onEnded={handleEnded}
                style={{
                    width: "100%",
                    height: "auto",
                    // "center of the video" is implicit if the element is centered and scales from center (default transform-origin)
                    transformOrigin: "center center",
                    animation: "zoomIn 5s ease-in-out forwards",
                }}
            />
        </div>
    );
};

export default IntroVideo;

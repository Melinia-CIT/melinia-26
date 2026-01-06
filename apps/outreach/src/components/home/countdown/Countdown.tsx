import { useState, useEffect, useRef } from "react";
import SpiderWeb from "../../common/SpiderWeb";
import Reveal from "../../common/Reveal";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface FlipCardProps {
    value: number;
    label: string;
}

function FlipCard({ value, label }: FlipCardProps) {
    const [currentValue, setCurrentValue] = useState(value);
    const [isFlipping, setIsFlipping] = useState(false);
    const prevValueRef = useRef(value);

    useEffect(() => {
        if (value !== prevValueRef.current) {
            setIsFlipping(true);

            setTimeout(() => {
                setCurrentValue(value);
                setIsFlipping(false);
            }, 300);

            prevValueRef.current = value;
        }
    }, [value]);

    const formatNumber = (num: number): string => {
        return num.toString().padStart(2, "0");
    };

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Flip Card Container */}
            <div className="relative w-24 h-28 md:w-32 md:h-36" style={{ perspective: '1000px' }}>


                {/* Full Card - Static (shows current value) */}
                <div className="absolute inset-0 overflow-hidden">
                    <div
                        className="w-full h-full rounded-xl border-2 border-white/20 backdrop-blur-xl flex items-center justify-center"
                        style={{
                            background: 'linear-gradient(180deg, rgba(42, 22, 54, 0.9) 0%, rgba(15, 11, 19, 0.9) 100%)',
                            boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 4px 12px rgba(0, 0, 0, 0.6)'
                        }}
                    >
                        <span className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F2F2F2] to-[#3db8cc] leading-none">
                            {formatNumber(currentValue)[0]}
                        </span>
                        <span className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F2F2F2] to-[#3db8cc] leading-none">
                            {formatNumber(currentValue)[1]}
                        </span>
                    </div>
                </div>

                {/* Flipping Top Half */}
                {isFlipping && (
                    <div
                        className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden origin-bottom"
                        style={{
                            animation: 'flipTop 0.6s ease-in-out',
                            transformStyle: 'preserve-3d',
                            zIndex: 10
                        }}
                    >
                        <div
                            className="w-full h-full rounded-t-xl border-2 border-b border-white/20 backdrop-blur-xl flex items-end justify-center pb-1"
                            style={{
                                background: 'linear-gradient(180deg, rgba(42, 22, 54, 0.9) 0%, rgba(26, 13, 36, 0.95) 100%)',
                                boxShadow: 'inset 0 2px 4px rgba(255, 255, 255, 0.1), 0 2px 8px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <span className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F2F2F2] to-[#3db8cc] leading-none">
                                {formatNumber(currentValue)[0]}
                            </span>
                            <span className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-[#F2F2F2] to-[#3db8cc] leading-none">
                                {formatNumber(currentValue)[1]}
                            </span>
                        </div>
                    </div>
                )}

                {/* Center Line */}
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-black/50 z-20" style={{ transform: 'translateY(-1px)' }} />

                {/* Shine Effect */}
                <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
                </div>
            </div>

            {/* Label */}
            <span className="text-[10px] md:text-xs lg:text-sm font-semibold uppercase tracking-widest text-[#f5a850]">
                {label}
            </span>

            <style dangerouslySetInnerHTML={{
                __html: `
                    @keyframes flipTop {
                        0% {
                            transform: rotateX(0deg);
                        }
                        100% {
                            transform: rotateX(-180deg);
                        }
                    }
                `
            }} />
        </div>
    );
}

function Countdown() {
    // Set your target date here (example: March 1, 2026)
    const targetDate = new Date("2026-02-25T00:00:00").getTime();

    const calculateTimeLeft = (): TimeLeft => {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000),
        };
    };

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="w-full flex items-center justify-center bg-black/20 backdrop-blur-sm py-12">
            <div
                className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-white px-4"
            >
                {/* Days */}
                <Reveal delay={0.1} direction="down" width="fit-content">
                    <FlipCard value={timeLeft.days} label="Days" />
                </Reveal>

                {/* Spider Web Separator */}
                <div className="hidden sm:block scale-[0.4] md:scale-75">
                    <Reveal delay={0.2} direction="down" width="fit-content">
                        <SpiderWeb />
                    </Reveal>
                </div>

                {/* Hours */}
                <Reveal delay={0.3} direction="down" width="fit-content">
                    <FlipCard value={timeLeft.hours} label="Hours" />
                </Reveal>

                {/* Spider Web Separator */}
                <div className="hidden md:block scale-[0.4] md:scale-75">
                    <Reveal delay={0.4} direction="down" width="fit-content">
                        <SpiderWeb />
                    </Reveal>
                </div>

                {/* Minutes */}
                <Reveal delay={0.5} direction="down" width="fit-content">
                    <FlipCard value={timeLeft.minutes} label="Minutes" />
                </Reveal>

                {/* Spider Web Separator */}
                <div className="hidden sm:block scale-[0.4] md:scale-75">
                    <Reveal delay={0.6} direction="down" width="fit-content">
                        <SpiderWeb />
                    </Reveal>
                </div>

                {/* Seconds */}
                <Reveal delay={0.7} direction="down" width="fit-content">
                    <FlipCard value={timeLeft.seconds} label="Seconds" />
                </Reveal>
            </div>
        </div>
    );
}

export default Countdown;

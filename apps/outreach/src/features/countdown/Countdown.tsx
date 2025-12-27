import { useState, useEffect } from "react";
import SpiderWeb from "../../components/common/SpiderWeb";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
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

    const formatNumber = (num: number): string => {
        return num.toString().padStart(2, "0");
    };

    return (
        <>
            <div
                className="w-full min-h-[180px] md:min-h-[200px] bg-cover bg-center flex items-center justify-center gap-3 md:gap-6 lg:gap-8 text-white px-4 py-8 md:py-12"
                // style={{ background: "url('/countdown-bg.png') no-repeat center/cover" }}
            >
                {/* Days */}
                <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-lg md:rounded-xl w-20 h-20 md:w-25 md:h-25 lg:w-30 lg:h-30 flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-4xl lg:text-5xl font-bold leading-none">{formatNumber(timeLeft.days)}</span>
                    <span className="text-[8px] md:text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/60 md:mt-1">Days</span>
                </div>

                {/* Spider Web Separator */}
                <div className="hidden sm:block scale-[0.3] md:scale-50">
                    <SpiderWeb />
                </div>

                {/* Hours */}
                <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-lg md:rounded-xl w-20 h-20 md:w-25 md:h-25 lg:w-30 lg:h-30 flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-4xl lg:text-5xl font-bold leading-none">{formatNumber(timeLeft.hours)}</span>
                    <span className="text-[8px] md:text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/60 md:mt-1">Hours</span>
                </div>

                {/* Spider Web Separator */}
                <div className="hidden md:block scale-[0.3] md:scale-50">
                    <SpiderWeb />
                </div>

                {/* Minutes */}
                <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-lg md:rounded-xl w-20 h-20 md:w-25 md:h-25 lg:w-30 lg:h-30 flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-4xl lg:text-5xl font-bold leading-none">{formatNumber(timeLeft.minutes)}</span>
                    <span className="text-[8px] md:text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/60 md:mt-1">Minutes</span>
                </div>

                {/* Spider Web Separator */}
                <div className="hidden sm:block scale-[0.3] md:scale-50">
                    <SpiderWeb />
                </div>

                {/* Seconds */}
                <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-lg md:rounded-xl w-20 h-20 md:w-25 md:h-25 lg:w-30 lg:h-30 flex flex-col items-center justify-center">
                    <span className="text-2xl md:text-4xl lg:text-5xl font-bold leading-none">{formatNumber(timeLeft.seconds)}</span>
                    <span className="text-[8px] md:text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/60 md:mt-1">Seconds</span>
                </div>
            </div>
        </>
    );
}

export default Countdown;

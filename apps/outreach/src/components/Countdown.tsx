import { useState, useEffect } from "react";
import SpiderWeb from "./SpiderWeb";

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function Countdown() {
    // Set your target date here (example: March 1, 2026)
    const targetDate = new Date("2026-03-01T00:00:00").getTime();

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
                className="h-[20%] w-full bg-cover bg-center flex items-center justify-center gap-4 text-white"
                style={{ backgroundImage: "url('/countdown-bg.jpg')" }}
            >
                {/* Days */}
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-xl w-24 h-24 flex items-center justify-center">
                        <span className="text-5xl font-bold">{formatNumber(timeLeft.days)}</span>
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Days</span>
                </div>

                {/* Spider Web Separator */}
                <div className="scale-50 opacity-70">
                    <SpiderWeb />
                </div>

                {/* Hours */}
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-xl w-24 h-24 flex items-center justify-center">
                        <span className="text-5xl font-bold">{formatNumber(timeLeft.hours)}</span>
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Hours</span>
                </div>

                {/* Spider Web Separator */}
                <div className="scale-50 opacity-70">
                    <SpiderWeb />
                </div>

                {/* Minutes */}
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-xl w-24 h-24 flex items-center justify-center">
                        <span className="text-5xl font-bold">{formatNumber(timeLeft.minutes)}</span>
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Minutes</span>
                </div>

                {/* Spider Web Separator */}
                <div className="scale-50 opacity-70">
                    <SpiderWeb />
                </div>

                {/* Seconds */}
                <div className="flex flex-col items-center gap-2">
                    <div className="bg-black/80 backdrop-blur-sm border-2 border-white/20 rounded-xl w-24 h-24 flex items-center justify-center">
                        <span className="text-5xl font-bold">{formatNumber(timeLeft.seconds)}</span>
                    </div>
                    <span className="text-sm font-semibold uppercase tracking-wider">Seconds</span>
                </div>
            </div>
        </>
    );
}

export default Countdown;

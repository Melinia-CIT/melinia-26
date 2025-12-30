import { Event } from '../types';

interface EventCardProps {
    event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
    return (
        <div className="relative group">
            {/* Glassmorphic Main Card */}
            <div
                className="rounded-2xl p-6 md:p-10 shadow-2xl border-2 border-white/20 hover:border-[#752B65]/60 transition-all duration-500 relative backdrop-blur-xl bg-gradient-to-br from-[#2A1636]/80 via-[#34143F]/70 to-[#1a0d24]/80 hover:scale-[1.02] hover:shadow-[0_0_50px_rgba(117,43,101,0.5)] group-hover:translate-y-[-4px]"
                style={{
                    boxShadow: '0 8px 32px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
            >
                {/* Animated gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#752B65]/0 via-[#752B65]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                {/* Logo Circle with pulse animation */}
                <div
                    className="w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto relative group-hover:scale-110 transition-all duration-500 animate-pulse-slow"
                    style={{
                        background: 'linear-gradient(135deg, #8a3575 0%, #6b35d4 100%)',
                        boxShadow: '0 0 40px rgba(138, 53, 117, 0.8), 0 0 80px rgba(107, 53, 212, 0.5), inset 0 0 30px rgba(0,0,0,0.3)',
                        border: '3px solid rgba(242, 242, 242, 0.3)'
                    }}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-60" />
                    <span className="text-4xl md:text-6xl filter drop-shadow-[0_0_20px_rgba(242,242,242,0.7)] relative z-10 group-hover:scale-110 transition-transform duration-300" role="img" aria-label="Event icon">{event.logo}</span>
                </div>

                {/* Event Title with gradient */}
                <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F2F2F2] via-[#d4d4d4] to-[#3db8cc] text-center mb-1 md:mb-2 tracking-tight group-hover:scale-105 transition-transform duration-300">
                    {event.title}
                </h3>

                {/* Tagline with glow */}
                <p className="text-[#3db8cc] text-center text-xs md:text-sm mb-3 md:mb-4 font-medium group-hover:text-[#f5a850] transition-colors duration-300">
                    {event.tagline}
                </p>

                {/* Category Pill with glassmorphic effect */}
                <div className="flex justify-center">
                    <div
                        className="px-4 py-1.5 rounded-full text-xs font-semibold border-2 border-[#8a3575]/70 text-[#3db8cc] hover:border-[#8a3575] hover:text-[#F2F2F2] hover:scale-105 transition-all duration-300 backdrop-blur-sm"
                        style={{
                            background: 'rgba(42, 22, 54, 0.7)',
                            boxShadow: 'inset 0 1px 2px rgba(138, 53, 117, 0.4), 0 2px 12px rgba(138, 53, 117, 0.3)'
                        }}
                    >
                        {event.category}
                    </div>
                </div>
            </div>
        </div>
    );
};

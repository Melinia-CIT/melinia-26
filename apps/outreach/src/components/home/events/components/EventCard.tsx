import { Event } from '../types';

interface EventCardProps {
    event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
    return (
        <div className="relative group">
            {/* Glassmorphic Main Card */}
            <div
                className="rounded-2xl p-6 md:p-10 shadow-2xl border-2 border-white/20 relative backdrop-blur-xl bg-gradient-to-br from-[#2A1636]/80 via-[#34143F]/70 to-[#1a0d24]/80"
                style={{
                    boxShadow: '0 8px 32px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
            >

                {/* Logo Circle with pulse animation */}
                <div
                    className="w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto relative"
                    style={{
                        background: 'linear-gradient(135deg, #8a3575 0%, #6b35d4 100%)',
                        border: '3px solid rgba(242, 242, 242, 0.3)'
                    }}
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-60" />
                    <span className="text-4xl md:text-6xl relative z-10" role="img" aria-label="Event icon">{event.logo}</span>
                </div>

                {/* Event Title with gradient */}
                <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#F2F2F2] via-[#d4d4d4] to-[#3db8cc] text-center mb-1 md:mb-2 tracking-tight">
                    {event.title}
                </h3>

                {/* Tagline with glow */}
                <p className="text-[#3db8cc] text-center text-xs md:text-sm mb-3 md:mb-4 font-medium transition-colors duration-300">
                    {event.tagline}
                </p>

                {/* Category Pill with glassmorphic effect */}
                <div className="flex justify-center">
                    <div
                        className="px-4 py-1.5 rounded-full text-xs font-semibold border-2 border-[#8a3575]/70 text-[#3db8cc] backdrop-blur-sm"
                        style={{
                            background: 'rgba(42, 22, 54, 0.7)'
                        }}
                    >
                        {event.category}
                    </div>
                </div>
            </div>
        </div>
    );
};

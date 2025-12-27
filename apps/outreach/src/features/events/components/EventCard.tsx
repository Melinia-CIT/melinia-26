import { Event } from '../types';

interface EventCardProps {
    event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
    return (
        <div
            className="rounded-3xl p-10 bg-[#F4F3ED] shadow-lg border-2 border-[#E1062C]/20 hover:shadow-xl transition-shadow duration-300"
            style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(225, 6, 44, 0.06)'
            }}
        >
            {/* Logo Circle */}
            <div
                className="w-36 h-36 rounded-full flex items-center justify-center mb-6 mx-auto relative"
                style={{
                    background: 'linear-gradient(135deg, #E1062C 0%, #B0124F 100%)',
                    boxShadow: '0 8px 24px rgba(225, 6, 44, 0.25), inset 0 -2px 8px rgba(0, 0, 0, 0.1)'
                }}
            >
                <span className="text-6xl" role="img" aria-label="Event icon">{event.logo}</span>
            </div>

            {/* Event Title */}
            <h3 className="text-3xl font-bold text-[#050608] text-center mb-2 tracking-tight">
                {event.title}
            </h3>

            {/* Tagline */}
            <p className="text-[#6F7FA3] text-center text-sm mb-4">
                {event.tagline}
            </p>

            {/* Category Pill */}
            <div className="flex justify-center">
                <div className="px-5 py-1.5 rounded-full text-sm font-medium bg-white/50 border border-[#6F7FA3]/30 text-[#6F7FA3]">
                    {event.category}
                </div>
            </div>
        </div>
    );
};

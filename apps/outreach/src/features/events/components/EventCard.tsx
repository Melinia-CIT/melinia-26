import { Event } from '../types';

interface EventCardProps {
    event: Event;
}

export const EventCard = ({ event }: EventCardProps) => {
    return (
        <div className="relative group">
            {/* Background Stacked Card */}
            <div
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-md border-2 border-[#0F0B13] bg-[#0F0B13] -z-10"
                aria-hidden="true"
            />

            {/* Main Card */}
            <div
                className="rounded-md p-6 md:p-10 bg-[#2A1636] shadow-lg border border-[#0F0B13] hover:shadow-xl transition-shadow duration-300 relative z-10"
            >
                {/* Logo Circle */}
                <div
                    className="w-24 h-24 md:w-36 md:h-36 rounded-full flex items-center justify-center mb-4 md:mb-6 mx-auto relative group-hover:scale-105 transition-transform duration-300"
                    style={{
                        background: '#752B65',
                        boxShadow: '0 0 24px rgba(117, 43, 101, 0.4), inset 0 0 12px rgba(0,0,0,0.2)',
                        border: '1px solid rgba(117, 43, 101, 0.2)'
                    }}
                >
                    <span className="text-4xl md:text-6xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" role="img" aria-label="Event icon">{event.logo}</span>
                </div>

                {/* Event Title */}
                <h3 className="text-2xl md:text-3xl font-bold text-[#F2F2F2] text-center mb-1 md:mb-2 tracking-tight">
                    {event.title}
                </h3>

                {/* Tagline */}
                <p className="text-[#1196A9] text-center text-xs md:text-sm mb-3 md:mb-4">
                    {event.tagline}
                </p>

                {/* Category Pill */}
                <div className="flex justify-center">
                    <div className="px-4 py-1.5 rounded-sm text-xs font-medium bg-transparent border border-[#752B65] text-[#1196A9]">
                        {event.category}
                    </div>
                </div>
            </div>
        </div>
    );
};

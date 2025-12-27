import { Event } from '../types';

interface EventOverviewProps {
    event: Event;
}

export const EventOverview = ({ event }: EventOverviewProps) => {
    return (
        <div className="space-y-5 animate-fadeIn">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Team Size Card */}
                <div
                    className="rounded-2xl p-5 backdrop-blur-sm border"
                    style={{
                        background: 'rgba(255, 255, 255, 0.6)',
                        borderColor: 'rgba(200, 200, 200, 0.5)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
                    }}
                >
                    <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(111, 127, 163, 0.15)' }}>
                            <svg className="w-5 h-5" style={{ color: '#6F7FA3' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[#6F7FA3] text-xs font-medium mb-0.5 uppercase tracking-wide">Team Size</div>
                            <div className="text-[#050608] text-base font-semibold truncate">{event.teamSize}</div>
                        </div>
                    </div>
                </div>

                {/* Prize Card */}
                <div
                    className="rounded-2xl p-5 backdrop-blur-sm border"
                    style={{
                        background: 'linear-gradient(135deg, rgba(255, 240, 245, 0.8) 0%, rgba(255, 245, 250, 0.6) 100%)',
                        borderColor: 'rgba(225, 6, 44, 0.2)',
                        boxShadow: '0 4px 12px rgba(225, 6, 44, 0.1)'
                    }}
                >
                    <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(225, 6, 44, 0.2)' }}>
                            <svg className="w-5 h-5 text-[#E1062C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-[#6F7FA3] text-xs font-medium mb-0.5 uppercase tracking-wide">Total Prize</div>
                            <div className="text-[#E1062C] text-base font-semibold truncate">{event.prize}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <h4 className="text-[#050608] text-lg font-bold mb-3">About the Event</h4>
                <p className="text-[#6F7FA3] leading-relaxed text-sm">
                    {event.about}
                </p>
            </div>

            {/* Coordinators Section */}
            <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <h4 className="text-[#050608] text-lg font-bold mb-4">Event Coordinators</h4>
                <div className="space-y-3">
                    {event.coordinators.map((coordinator, index) => (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200/50 last:border-0 gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                                    style={{
                                        background: 'linear-gradient(135deg, #E1062C 0%, #B0124F 100%)'
                                    }}
                                >
                                    {coordinator.name.charAt(0)}
                                </div>
                                <span className="text-[#050608] font-semibold text-sm truncate">{coordinator.name}</span>
                            </div>
                            <a
                                href={`tel:${coordinator.phone}`}
                                className="text-[#6F7FA3] hover:text-[#E1062C] transition-colors font-mono text-xs flex-shrink-0"
                            >
                                {coordinator.phone}
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

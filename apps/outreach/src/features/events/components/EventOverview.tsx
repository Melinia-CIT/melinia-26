import { Event } from '../types';

interface EventOverviewProps {
    event: Event;
}

export const EventOverview = ({ event }: EventOverviewProps) => {
    return (
        <div className="space-y-5 md:space-y-6 animate-fadeIn">
            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Team Size Card */}
                <div className="relative group">
                    <div
                        className="rounded-xl p-4 md:p-5 border-2 border-white/20 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#34143F]/85 to-[#1a0d24]/75 hover:scale-105 hover:rotate-1 transition-all duration-500 hover:shadow-[0_0_40px_rgba(61,184,204,0.4)] group-hover:border-[#3db8cc]/50"
                        style={{
                            boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-slow group-hover:scale-110 transition-transform duration-300" style={{ background: 'rgba(61, 184, 204, 0.35)', boxShadow: '0 0 20px rgba(61, 184, 204, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)' }}>
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#3db8cc]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[#F2F2F2]/60 text-[10px] md:text-xs font-medium mb-0.5 uppercase tracking-wide">Team Size</div>
                                <div className="text-[#F2F2F2] text-sm md:text-base font-bold truncate group-hover:text-[#3db8cc] transition-colors duration-300">{event.teamSize}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prize Card */}
                <div className="relative group">
                    <div
                        className="rounded-xl p-4 md:p-5 border-2 border-white/20 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#34143F]/85 to-[#1a0d24]/75 hover:scale-105 hover:rotate-[-1deg] transition-all duration-500 hover:shadow-[0_0_40px_rgba(245,168,80,0.4)] group-hover:border-[#f5a850]/50"
                        style={{
                            boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0 animate-pulse-slow group-hover:scale-110 transition-transform duration-300" style={{ background: 'rgba(245, 168, 80, 0.35)', boxShadow: '0 0 20px rgba(245, 168, 80, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)' }}>
                                <svg className="w-4 h-4 md:w-5 md:h-5 text-[#f5a850]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[#F2F2F2]/60 text-[10px] md:text-xs font-medium mb-0.5 uppercase tracking-wide">Total Prize</div>
                                <div className="text-[#F2F2F2] text-sm md:text-base font-bold truncate group-hover:text-[#f5a850] transition-colors duration-300">{event.prize}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="relative group">
                <div
                    className="rounded-xl p-5 md:p-6 border-2 border-white/20 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#2A1636]/80 to-[#1a0d24]/75 hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_0_40px_rgba(138,53,117,0.4)] group-hover:border-[#8a3575]/50"
                    style={{
                        boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    }}
                >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#8a3575]/0 via-[#8a3575]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <h4 className="text-[#f5a850] text-base md:text-lg font-bold mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">About the Event</h4>
                    <p className="text-[#F2F2F2]/75 leading-relaxed text-xs md:text-sm group-hover:text-[#F2F2F2]/95 transition-colors duration-300">
                        {event.about}
                    </p>
                </div>
            </div>

            {/* Coordinators Section */}
            <div className="relative group">
                <div
                    className="rounded-xl p-5 md:p-6 border-2 border-white/20 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#34143F]/85 to-[#1a0d24]/75 hover:scale-[1.02] transition-all duration-500 hover:shadow-[0_0_40px_rgba(61,184,204,0.4)] group-hover:border-[#3db8cc]/50"
                    style={{
                        boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    }}
                >
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#3db8cc]/0 via-[#3db8cc]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <h4 className="text-[#F2F2F2] text-base md:text-lg font-bold mb-3 md:mb-4 group-hover:text-[#3db8cc] transition-colors duration-300">Event Coordinators</h4>
                    <div className="space-y-2 md:space-y-3">
                        {event.coordinators.map((coordinator, index) => (
                            <div key={index} className="flex items-center py-2 border-b border-white/10 last:border-0 gap-3 hover:bg-white/10 hover:px-2 hover:rounded-lg transition-all duration-300">
                                <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                                    <div className="flex flex-col">
                                        <span className="text-[#F2F2F2] font-semibold text-xs md:text-sm truncate">{coordinator.name}</span>
                                        <a
                                            href={`tel:${coordinator.phone}`}
                                            className="text-[#3db8cc] hover:text-[#f5a850] hover:scale-105 transition-all duration-300 font-mono text-[10px] md:text-xs flex-shrink-0 inline-block"
                                        >
                                            {coordinator.phone}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

import { Event } from '../types';

interface EventRoundsProps {
    event: Event;
}

export const EventRounds = ({ event }: EventRoundsProps) => {
    return (
        <div className="relative group animate-fadeIn">
            <div
                className="rounded-xl p-5 md:p-6 border-2 border-white/20 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#2A1636]/85 to-[#1a0d24]/80"
                style={{
                    boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                }}
            >
                <h4 className="text-[#f5a850] text-base md:text-lg font-bold mb-4 md:mb-5">Competition Rounds</h4>
                {event.rounds ? (
                    <div className="space-y-4 md:space-y-5">
                        {event.rounds.map((round, index) => (
                            <div key={index} className="relative pl-6 md:pl-7 transition-transform duration-300">
                                <div
                                    className="absolute left-0 top-1.5 md:top-2 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full"
                                    style={{
                                        background: 'linear-gradient(135deg, #e67e22 0%, #f5a850 100%)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                ></div>
                                {index !== event.rounds!.length - 1 && (
                                    <div className="absolute left-[4px] md:left-[6px] top-5 md:top-6 w-[2px] h-full bg-gradient-to-b from-[#e67e22]/60 to-transparent"></div>
                                )}
                                <div>
                                    <h5 className="text-[#F2F2F2] font-bold text-sm md:text-base mb-1 md:mb-1.5 transition-colors duration-300">{round.title}</h5>
                                    <p className="text-[#F2F2F2]/75 text-xs md:text-sm transition-colors duration-300">{round.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[#6F7FA3] text-xs md:text-sm">Round details will be announced soon.</p>
                )}
            </div>
        </div>
    );
};

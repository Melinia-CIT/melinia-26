import { Event } from '../types';

interface EventRoundsProps {
    event: Event;
}

export const EventRounds = ({ event }: EventRoundsProps) => {
    return (
        <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm animate-fadeIn">
            <h4 className="text-[#050608] text-lg font-bold mb-5">Competition Rounds</h4>
            {event.rounds ? (
                <div className="space-y-5">
                    {event.rounds.map((round, index) => (
                        <div key={index} className="relative pl-7">
                            <div
                                className="absolute left-0 top-2 w-3.5 h-3.5 rounded-full"
                                style={{
                                    background: 'linear-gradient(135deg, #E1062C 0%, #B0124F 100%)'
                                }}
                            ></div>
                            {index !== event.rounds!.length - 1 && (
                                <div className="absolute left-[6px] top-6 w-[2px] h-full bg-gradient-to-b from-[#E1062C]/50 to-transparent"></div>
                            )}
                            <div>
                                <h5 className="text-[#050608] font-bold text-base mb-1.5">{round.title}</h5>
                                <p className="text-[#6F7FA3] text-sm">{round.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-[#6F7FA3] text-sm">Round details will be announced soon.</p>
            )}
        </div>
    );
};

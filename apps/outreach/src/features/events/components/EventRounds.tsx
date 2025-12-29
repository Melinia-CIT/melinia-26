import { Event } from '../types';

interface EventRoundsProps {
    event: Event;
}

export const EventRounds = ({ event }: EventRoundsProps) => {
    return (
        <div className="relative group animate-fadeIn">
            <div
                className="absolute inset-0 translate-x-2 translate-y-2 rounded-md border-2 border-[#0F0B13] bg-[#0F0B13] -z-10"
                aria-hidden="true"
            />
            <div className="rounded-md p-5 md:p-6 bg-[#2A1636] border border-[#0F0B13] shadow-sm relative z-10">
                <h4 className="text-[#EA8427] text-base md:text-lg font-bold mb-4 md:mb-5">Competition Rounds</h4>
                {event.rounds ? (
                    <div className="space-y-4 md:space-y-5">
                        {event.rounds.map((round, index) => (
                            <div key={index} className="relative pl-6 md:pl-7">
                                <div
                                    className="absolute left-0 top-1.5 md:top-2 w-2.5 h-2.5 md:w-3.5 md:h-3.5 rounded-full"
                                    style={{
                                        background: '#D24623'
                                    }}
                                ></div>
                                {index !== event.rounds!.length - 1 && (
                                    <div className="absolute left-[4px] md:left-[6px] top-5 md:top-6 w-[2px] h-full bg-gradient-to-b from-[#D24623]/50 to-transparent"></div>
                                )}
                                <div>
                                    <h5 className="text-[#F2F2F2] font-bold text-sm md:text-base mb-1 md:mb-1.5">{round.title}</h5>
                                    <p className="text-[#F2F2F2]/70 text-xs md:text-sm">{round.description}</p>
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

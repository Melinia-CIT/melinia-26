import { Event } from '../types';

interface EventPrizesProps {
    event: Event;
}

export const EventPrizes = ({ event }: EventPrizesProps) => {
    return (
        <div className="space-y-5 animate-fadeIn">
            <div
                className="rounded-2xl p-6 border shadow-sm"
                style={{
                    background: 'linear-gradient(135deg, rgba(255, 240, 245, 0.8) 0%, rgba(255, 245, 250, 0.6) 100%)',
                    borderColor: 'rgba(225, 6, 44, 0.2)'
                }}
            >
                <h4 className="text-[#050608] text-lg font-bold mb-4 text-center">Prize Pool</h4>
                <div className="text-center py-4">
                    <div className="text-5xl font-bold text-[#E1062C] mb-1.5">{event.prize}</div>
                    <div className="text-[#6F7FA3] text-base">Total Prize Money</div>
                </div>
            </div>

            <div className="rounded-2xl p-6 bg-white/60 backdrop-blur-sm border border-gray-200/50 shadow-sm">
                <h4 className="text-[#050608] text-lg font-bold mb-4">Team Requirements</h4>
                <div className="space-y-3">
                    {[
                        `Team size: ${event.teamSize}`,
                        'Open to all college students',
                        'Prior registration required',
                        'Valid student ID mandatory'
                    ].map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2.5 text-[#6F7FA3]">
                            <svg className="w-4 h-4 flex-shrink-0 text-[#E1062C]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[#050608] text-sm">{requirement}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

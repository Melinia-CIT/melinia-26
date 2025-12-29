import { Event } from '../types';

interface EventPrizesProps {
    event: Event;
}

export const EventPrizes = ({ event }: EventPrizesProps) => {
    return (
        <div className="space-y-4 md:space-y-5 animate-fadeIn">
            <div className="relative group">
                <div
                    className="absolute inset-0 translate-x-2 translate-y-2 rounded-md border-2 border-[#0F0B13] bg-[#0F0B13] -z-10"
                    aria-hidden="true"
                />
                <div
                    className="rounded-md p-5 md:p-6 bg-[#2A1636] border border-[#0F0B13] shadow-sm relative z-10"
                >
                    <h4 className="text-[#EA8427] text-base md:text-lg font-bold mb-3 md:mb-4 text-center">Prize Pool</h4>
                    <div className="text-center py-2 md:py-4">
                        <div className="text-3xl md:text-5xl font-bold text-[#EA8427] mb-1 md:mb-1.5 tracking-tight">{event.prize}</div>
                        <div className="text-[#F2F2F2] text-sm md:text-base">Total Prize Money</div>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <div
                    className="absolute inset-0 translate-x-2 translate-y-2 rounded-md border-2 border-[#0F0B13] bg-[#0F0B13] -z-10"
                    aria-hidden="true"
                />
                <div className="rounded-md p-5 md:p-6 bg-[#34143F] border border-[#0F0B13] shadow-sm relative z-10">
                    <h4 className="text-[#EA8427] text-base md:text-lg font-bold mb-3 md:mb-4">Team Requirements</h4>
                    <div className="space-y-2 md:space-y-3">
                        {[
                            `Team size: ${event.teamSize}`,
                            'Open to all college students',
                            'Prior registration required',
                            'Valid student ID mandatory'
                        ].map((requirement, index) => (
                            <div key={index} className="flex items-center gap-2.5 text-[#F2F2F2]/70">
                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#1196A9]" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-[#F2F2F2] text-xs md:text-sm">{requirement}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

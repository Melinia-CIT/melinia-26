import { Event } from '../types';

interface EventPrizesProps {
    event: Event;
}

export const EventPrizes = ({ event }: EventPrizesProps) => {
    return (
        <div className="space-y-4 md:space-y-5 animate-fadeIn">
            <div className="relative group">
                <div
                    className="rounded-xl p-5 md:p-6 border-2 border-white/25 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#2A1636]/85 to-[#1a0d24]/80"
                    style={{
                        boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}
                >
                    <h4 className="text-[#f5a850] text-base md:text-lg font-bold mb-3 md:mb-4 text-center">Prize Pool</h4>
                    <div className="text-center py-2 md:py-4">
                        <div
                            className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#f5a850] via-[#e67e22] to-[#f5a850] mb-1 md:mb-1.5 tracking-tight"
                        >
                            {event.prize}
                        </div>
                        <div className="text-[#F2F2F2]/90 text-sm md:text-base transition-colors duration-300">Total Prize Money</div>
                    </div>
                </div>
            </div>

            <div className="relative group">
                <div
                    className="rounded-xl p-5 md:p-6 border-2 border-white/20 shadow-lg relative backdrop-blur-lg bg-gradient-to-br from-[#34143F]/85 to-[#1a0d24]/75"
                    style={{
                        boxShadow: '0 4px 24px rgba(15, 11, 19, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                    }}
                >
                    <h4 className="text-[#f5a850] text-base md:text-lg font-bold mb-3 md:mb-4 transition-colors duration-300">Team Requirements</h4>
                    <div className="space-y-2 md:space-y-3">
                        {[
                            `Team size: ${event.teamSize}`,
                            'Open to all college students',
                            'Prior registration required',
                            'Valid student ID mandatory'
                        ].map((requirement, index) => (
                            <div key={index} className="flex items-center gap-2.5 text-[#F2F2F2]/75 transition-all duration-300">
                                <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 text-[#3db8cc]" fill="currentColor" viewBox="0 0 20 20">
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

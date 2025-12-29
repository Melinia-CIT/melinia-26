import { eventsData } from './data';
import { useEventCarousel } from './useEventCarousel';
import { EventCard } from './components/EventCard';
import { TabBar } from './components/TabBar';
import { EventOverview } from './components/EventOverview';
import { EventRounds } from './components/EventRounds';
import { EventPrizes } from './components/EventPrizes';


function Events() {
    const {
        currentIndex,
        incomingIndex,
        activeTab,
        isSliding,
        slideDirection,
        setActiveTab,
        handlePrevious,
        handleNext,
        handleJumpTo,
    } = useEventCarousel(eventsData.length);

    const renderEventSlide = (event: typeof eventsData[0], isAbsolute: boolean = false) => (
        <div className={`${isAbsolute ? 'absolute inset-0 w-full h-full' : 'relative w-full'}`}>
            {/* Grid layout: stacked on mobile, side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-[35%_65%] gap-6 md:gap-8 px-4 md:px-10 h-full">
                {/* LEFT COLUMN - Event Visual Card */}
                <div className="space-y-6">
                    <EventCard event={event} />
                </div>

                {/* RIGHT COLUMN - Event Details */}
                <div className="space-y-4 md:space-y-5 pb-4">
                    {/* Header with Tabs and Register Button */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

                        {/* Register Button */}
                        <div className="relative w-full md:w-auto group">
                            <div
                                className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-md border-2 border-black bg-[#050608] -z-10"
                                aria-hidden="true"
                            />
                            <button
                                className="relative z-10 w-full md:w-auto px-6 py-2.5 rounded-md font-semibold text-[#0F0B13] bg-[#D24623] border-2 border-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(210,70,35,0.5)] hover:-translate-y-1 whitespace-nowrap flex-shrink-0"
                            >
                                Register Now
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="min-h-[auto] md:min-h-[480px]">
                        {activeTab === 'overview' && <EventOverview event={event} />}
                        {activeTab === 'rounds' && <EventRounds event={event} />}
                        {activeTab === 'prizes' && <EventPrizes event={event} />}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="w-full min-h-screen relative bg-[#0F0B13] bg-[radial-gradient(circle_at_center,_#15101C_0%,_#0F0B13_100%)]"
        >

            <div className="relative z-10 w-full max-w-[1800px] mx-auto px-4 md:px-8 py-10 md:py-20">
                {/* Section Header */}
                <div className="text-center mb-8 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-[#F2F2F2] mb-2 md:mb-3 tracking-tight uppercase">Events</h2>
                    <p className="text-[#F2F2F2]/70 text-sm md:text-lg px-4">Discover our flagship competitions and workshops</p>
                </div>

                {/* Carousel Container - with padding for arrows */}
                <div className="relative px-0 md:px-12">
                    {/* Sliding content container */}
                    <div className="overflow-hidden relative min-h-[800px] md:min-h-[600px]">
                        {/* Outgoing Slide (Current) */}
                        <div
                            className={`w-full transition-none ${isSliding && incomingIndex !== null
                                ? slideDirection === 'right'
                                    ? 'animate-slideOutLeft'
                                    : 'animate-slideOutRight'
                                : 'opacity-100 translate-x-0'
                                }`}
                        >
                            {renderEventSlide(eventsData[currentIndex])}
                        </div>

                        {/* Incoming Slide (Next/Prev) */}
                        {isSliding && incomingIndex !== null && (
                            <div
                                className={`absolute inset-0 w-full transition-none ${slideDirection === 'right'
                                    ? 'animate-slideInRight'
                                    : 'animate-slideInLeft'
                                    }`}
                            >
                                {renderEventSlide(eventsData[incomingIndex], true)}
                            </div>
                        )}
                    </div>

                    {/* Navigation Arrows - Adjusted for responsiveness */}
                    <button
                        onClick={handlePrevious}
                        disabled={isSliding}
                        className="absolute left-0 lg:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#34143F] border border-[#752B65] shadow-lg hover:shadow-xl hover:bg-[#752B65] hover:text-[#F2F2F2] transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed flex items-center justify-center group z-20"
                        aria-label="Previous event"
                    >
                        <svg className="w-5 h-5 text-[#1196A9] group-hover:text-[#F2F2F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={isSliding}
                        className="absolute right-0 lg:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#34143F] border border-[#752B65] shadow-lg hover:shadow-xl hover:bg-[#752B65] hover:text-[#F2F2F2] transition-all duration-300 disabled:opacity-0 disabled:cursor-not-allowed flex items-center justify-center group z-20"
                        aria-label="Next event"
                    >
                        <svg className="w-5 h-5 text-[#1196A9] group-hover:text-[#F2F2F2] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Carousel Position Indicator */}
                <div className="flex items-center justify-center gap-2 mt-6 md:mt-10">
                    {eventsData.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => handleJumpTo(index)}
                            aria-label={`Go to event ${index + 1}`}
                            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${index === currentIndex
                                ? 'w-8 md:w-10 bg-[#D24623]'
                                : 'w-1.5 bg-[#1196A9] hover:bg-[#1196A9]/80'
                                }`}
                        />
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes slideOutLeft {
                    0% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(-50%); opacity: 0; }
                }
                @keyframes slideInRight {
                    0% { transform: translateX(50%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    0% { transform: translateX(0); opacity: 1; }
                    100% { transform: translateX(50%); opacity: 0; }
                }
                @keyframes slideInLeft {
                    0% { transform: translateX(-50%); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                
                .animate-slideOutLeft { animation: slideOutLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .animate-slideInRight { animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .animate-slideOutRight { animation: slideOutRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                .animate-slideInLeft { animation: slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default Events;

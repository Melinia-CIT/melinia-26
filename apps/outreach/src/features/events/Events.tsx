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
        activeTab,
        isSliding,
        slideDirection,
        setActiveTab,
        handlePrevious,
        handleNext,
    } = useEventCarousel(eventsData.length);

    const currentEvent = eventsData[currentIndex];

    return (
        <div
            className="w-full min-h-screen relative bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50"
            style={{
                background: "url('/sections-bg.png') center center/cover no-repeat"
            }}
        >
            {/* Soft background gradient overlays */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-pink-100 to-transparent blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-blue-100 to-transparent blur-3xl"></div>
            </div>

            <div className="relative z-10 w-full max-w-[1800px] mx-auto px-8 py-20">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold text-[#050608] mb-3 tracking-tight">Featured Events</h2>
                    <p className="text-[#6F7FA3] text-lg">Discover our flagship competitions and workshops</p>
                </div>

                {/* Carousel Container - with padding for arrows */}
                <div className="relative px-12">
                    {/* Sliding content container */}
                    <div className="overflow-hidden">
                        <div
                            className={`transition-transform duration-300 ease-out ${isSliding
                                    ? slideDirection === 'right'
                                        ? '-translate-x-full'
                                        : 'translate-x-full'
                                    : 'translate-x-0'
                                }`}
                        >
                            {/* Two-column layout with proper spacing */}
                            <div className="grid grid-cols-[35%_65%] gap-8 px-10">
                                {/* LEFT COLUMN - Event Visual Card */}
                                <div className="space-y-6">
                                    <EventCard event={currentEvent} />
                                </div>

                                {/* RIGHT COLUMN - Event Details */}
                                <div className="space-y-5">
                                    {/* Header with Tabs and Register Button */}
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

                                        {/* Register Button */}
                                        <button
                                            className="px-6 py-2.5 rounded-xl font-semibold text-white bg-[#E1062C] transition-all duration-300 hover:shadow-lg hover:scale-105 shadow-md whitespace-nowrap flex-shrink-0"
                                            style={{
                                                boxShadow: '0 4px 12px rgba(225, 6, 44, 0.25)'
                                            }}
                                        >
                                            Register Now
                                        </button>
                                    </div>

                                    {/* Content Area */}
                                    <div className="min-h-[480px]">
                                        {activeTab === 'overview' && <EventOverview event={currentEvent} />}
                                        {activeTab === 'rounds' && <EventRounds event={currentEvent} />}
                                        {activeTab === 'prizes' && <EventPrizes event={currentEvent} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Arrows - Positioned OUTSIDE content area */}
                    <button
                        onClick={handlePrevious}
                        disabled={isSliding}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                        aria-label="Previous event"
                    >
                        <svg className="w-5 h-5 text-[#6F7FA3] group-hover:text-[#E1062C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <button
                        onClick={handleNext}
                        disabled={isSliding}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
                        aria-label="Next event"
                    >
                        <svg className="w-5 h-5 text-[#6F7FA3] group-hover:text-[#E1062C] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Carousel Position Indicator */}
                <div className="flex items-center justify-center gap-2 mt-10">
                    {eventsData.map((_, index) => (
                        <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'w-10 bg-[#E1062C]'
                                    : 'w-1.5 bg-[#6F7FA3]/30'
                                }`}
                        ></div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}

export default Events;

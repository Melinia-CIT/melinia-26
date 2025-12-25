import { useState, useEffect, useRef } from 'react';

interface Event {
    id: number;
    title: string;
    category: string;
    date: string;
    time: string;
    description: string;
    imageUrl: string;
}

const eventsData: Event[] = [
    {
        id: 1,
        title: "CYBER PROTOCOL",
        category: "TECHNICAL",
        date: "March '16",
        time: "10:00 AM",
        description: "Dive into the world of cybersecurity protocols and network defense strategies. Test your skills in this intense technical challenge.",
        imageUrl: "/api/placeholder/400/200"
    },
    {
        id: 2,
        title: "CODE SPRINT",
        category: "TECHNICAL",
        date: "March '18",
        time: "2:00 PM",
        description: "A high-speed coding competition where teams race against time to solve complex algorithmic challenges.",
        imageUrl: "/api/placeholder/400/200"
    },
    {
        id: 3,
        title: "TECH TALK",
        category: "WORKSHOP",
        date: "March '20",
        time: "11:00 AM",
        description: "Join industry experts as they share insights on emerging technologies and future trends in software development.",
        imageUrl: "/api/placeholder/400/200"
    },
    {
        id: 4,
        title: "HACKATHON",
        category: "TECHNICAL",
        date: "March '22",
        time: "9:00 AM",
        description: "24-hour innovation challenge where teams build groundbreaking solutions to real-world problems.",
        imageUrl: "/api/placeholder/400/200"
    },
    {
        id: 5,
        title: "AI WORKSHOP",
        category: "WORKSHOP",
        date: "March '24",
        time: "3:00 PM",
        description: "Hands-on workshop exploring machine learning algorithms and artificial intelligence applications.",
        imageUrl: "/api/placeholder/400/200"
    }
];

function Events() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-scroll functionality
    useEffect(() => {
        if (!isHovered) {
            scrollIntervalRef.current = setInterval(() => {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % eventsData.length);
            }, 3000); // Change slide every 3 seconds
        }

        return () => {
            if (scrollIntervalRef.current) {
                clearInterval(scrollIntervalRef.current);
            }
        };
    }, [isHovered]);

    const getCardStyle = (index: number) => {
        const position = (index - currentIndex + eventsData.length) % eventsData.length;

        if (position === 0) {
            // Center card - embossed
            return {
                transform: 'translateX(0%) scale(1.1)',
                opacity: 1,
                zIndex: 30,
                filter: 'brightness(1.2)'
            };
        } else if (position === 1) {
            // Right card
            return {
                transform: 'translateX(120%) scale(0.85)',
                opacity: 0.5,
                zIndex: 20,
                filter: 'brightness(0.7)'
            };
        } else if (position === eventsData.length - 1) {
            // Left card
            return {
                transform: 'translateX(-120%) scale(0.85)',
                opacity: 0.5,
                zIndex: 20,
                filter: 'brightness(0.7)'
            };
        } else {
            // Hidden cards
            return {
                transform: position < eventsData.length / 2 ? 'translateX(250%) scale(0.7)' : 'translateX(-250%) scale(0.7)',
                opacity: 0,
                zIndex: 10,
                filter: 'brightness(0.5)'
            };
        }
    };

    return (
        <div className="w-full min-h-screen bg-black py-20 overflow-hidden">
            {/* Section Title */}
            <div className="text-center mb-16">
                <h2 className="text-5xl font-bold text-white mb-4">UPCOMING EVENTS</h2>
                <div className="w-24 h-1 bg-cyan-500 mx-auto"></div>
            </div>

            {/* Carousel Container */}
            <div
                className="relative h-[600px] flex items-center justify-center"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {eventsData.map((event, index) => {
                    const style = getCardStyle(index);
                    const position = (index - currentIndex + eventsData.length) % eventsData.length;

                    return (
                        <div
                            key={event.id}
                            className="absolute w-[380px] transition-all duration-700 ease-in-out"
                            style={style}
                        >
                            {/* Red/Pink Border Layer (Base) */}
                            <div className="relative bg-gradient-to-br from-red-600 to-pink-600 p-2 rounded-sm shadow-2xl">
                                {/* White Card Layer (Offset to top-left) */}
                                <div className="relative -mt-5 -ml-5 bg-white p-2 rounded-sm shadow-lg">
                                    {/* Event Card Content */}
                                    <div className="bg-white rounded-sm overflow-hidden">
                                        {/* Code Background Image */}
                                        <div className="relative h-48 bg-gray-900 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black opacity-60"></div>
                                            <div className="p-4 font-mono text-xs text-green-400 opacity-40 leading-relaxed">
                                                <div>import &#123; useState &#125; from 'react';</div>
                                                <div>const [data, setData] = useState();</div>
                                                <div>function handleClick() &#123;</div>
                                                <div>&nbsp;&nbsp;console.log('event');</div>
                                                <div>&#125;</div>
                                                <div>export default Component;</div>
                                            </div>

                                            {/* Category Badge */}
                                            <div className="absolute top-4 right-4 z-10">
                                                <span className="bg-cyan-400 text-black px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                                                    {event.category}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="bg-white p-6 space-y-4">
                                            {/* Event Title */}
                                            <h3 className="text-2xl font-bold text-black uppercase tracking-wide">
                                                {event.title}
                                            </h3>

                                            {/* Date and Time */}
                                            <div className="flex items-center gap-6 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-gray-700 font-medium">{event.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                    </svg>
                                                    <span className="text-gray-700 font-medium">{event.time}</span>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                                                {event.description}
                                            </p>

                                            {/* Register Button */}
                                            <button
                                                className="w-full bg-black text-white py-3 px-6 font-bold uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2 group"
                                                disabled={position !== 0}
                                            >
                                                REGISTER TEAM
                                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-3 mt-12">
                {eventsData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`transition-all duration-300 ${index === currentIndex
                            ? 'w-12 h-3 bg-cyan-500'
                            : 'w-3 h-3 bg-gray-600 hover:bg-gray-500'
                            } rounded-full`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default Events;

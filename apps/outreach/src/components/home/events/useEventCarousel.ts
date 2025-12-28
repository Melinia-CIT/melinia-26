import { useState } from 'react';
import { TabType } from './types';

export const useEventCarousel = (totalEvents: number) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isSliding, setIsSliding] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

    const [incomingIndex, setIncomingIndex] = useState<number | null>(null);

    const handlePrevious = () => {
        if (isSliding) return;
        setIsSliding(true);
        setSlideDirection('left');
        const nextIndex = currentIndex === 0 ? totalEvents - 1 : currentIndex - 1;
        setIncomingIndex(nextIndex);

        setTimeout(() => {
            setCurrentIndex(nextIndex);
            setIncomingIndex(null);
            setActiveTab('overview');
            setIsSliding(false);
        }, 500); // Increased duration for smoother combined animation
    };

    const handleNext = () => {
        if (isSliding) return;
        setIsSliding(true);
        setSlideDirection('right');
        const nextIndex = currentIndex === totalEvents - 1 ? 0 : currentIndex + 1;
        setIncomingIndex(nextIndex);

        setTimeout(() => {
            setCurrentIndex(nextIndex);
            setIncomingIndex(null);
            setActiveTab('overview');
            setIsSliding(false);
        }, 500);
    };

    const handleJumpTo = (index: number) => {
        if (isSliding || index === currentIndex) return;
        setIsSliding(true);
        setSlideDirection(index > currentIndex ? 'right' : 'left');
        setIncomingIndex(index);

        setTimeout(() => {
            setCurrentIndex(index);
            setIncomingIndex(null);
            setActiveTab('overview');
            setIsSliding(false);
        }, 500);
    };

    return {
        currentIndex,
        incomingIndex,
        activeTab,
        isSliding,
        slideDirection,
        setActiveTab,
        handlePrevious,
        handleNext,
        handleJumpTo,
    };
};

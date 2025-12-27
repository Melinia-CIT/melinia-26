import { useState } from 'react';
import { TabType } from './types';

export const useEventCarousel = (totalEvents: number) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isSliding, setIsSliding] = useState(false);
    const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

    const handlePrevious = () => {
        if (isSliding) return;
        setIsSliding(true);
        setSlideDirection('left');
        setTimeout(() => {
            setCurrentIndex((prev) => (prev === 0 ? totalEvents - 1 : prev - 1));
            setActiveTab('overview');
            setIsSliding(false);
        }, 300);
    };

    const handleNext = () => {
        if (isSliding) return;
        setIsSliding(true);
        setSlideDirection('right');
        setTimeout(() => {
            setCurrentIndex((prev) => (prev === totalEvents - 1 ? 0 : prev + 1));
            setActiveTab('overview');
            setIsSliding(false);
        }, 300);
    };

    const handleJumpTo = (index: number) => {
        if (isSliding || index === currentIndex) return;
        setIsSliding(true);
        setSlideDirection(index > currentIndex ? 'right' : 'left');
        setTimeout(() => {
            setCurrentIndex(index);
            setActiveTab('overview');
            setIsSliding(false);
        }, 300);
    };

    return {
        currentIndex,
        activeTab,
        isSliding,
        slideDirection,
        setActiveTab,
        handlePrevious,
        handleNext,
        handleJumpTo,
    };
};

import React, { useEffect, useRef, useState, Suspense } from 'react';
import { Spinner } from '../ui/spinner';

interface LazyLoadProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    threshold?: number;
    rootMargin?: string;
    minHeight?: string;
}

const LazyLoad = ({
    children,
    fallback = <div className="flex h-32 w-full items-center justify-center"><Spinner h={24} w={24} /></div>,
    threshold = 0.1,
    rootMargin = "200px",
    minHeight = "10vh",
}: LazyLoadProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            {
                rootMargin,
                threshold,
            }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [rootMargin, threshold]);

    return (
        <div ref={ref} style={{ minHeight }} className="w-full">
            {isVisible ? (
                <Suspense fallback={fallback}>
                    {children}
                </Suspense>
            ) : (
                <div style={{ height: '100%' }} />
            )}
        </div>
    );
};

export default LazyLoad;

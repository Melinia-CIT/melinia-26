import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

export const PublicRoute = () => {
    const token = localStorage.getItem('accessToken');

    if (token) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
};

export const ProtectedRoute = () => {
    const token = localStorage.getItem('accessToken');

    useEffect(() => {
        // Handler for when connection is lost
        const handleOffline = () => {
            toast.error("Kindly check your internet connection", {
                id: 'network-status', // Unique ID to prevent duplicates
                duration: Infinity,   // Keeps the toast visible until fixed
            });
        };

        // Handler for when connection is restored
        const handleOnline = () => {
            toast.success("You are back Online!", {
                id: 'network-status', // Same ID to replace the error toast
                duration: 3000,
            });
        };

        // 1. Check status immediately on mount (in case user loaded page offline)
        if (!navigator.onLine) {
            handleOffline();
        }

        // 2. Add event listeners
        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        // 3. Cleanup listeners on unmount
        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            toast.dismiss('network-status');
        };
    }, []);

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

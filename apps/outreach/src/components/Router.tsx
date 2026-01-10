import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';

const useAuth = () => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        const accessToken = localStorage.getItem('accessToken');
        const hasRefreshToken = document.cookie
            .split('; ')
            .some(cookie => cookie.startsWith('refresh_token='));

        setAuthState({
            isAuthenticated: !!(accessToken || hasRefreshToken),
            isLoading: false,
        });
    }, []);

    return authState;
};

const useNetworkStatus = () => {
    useEffect(() => {
        const handleOffline = () => {
            toast.error('Check your internet connection', {
                id: 'network-status',
                duration: Infinity,
            });
        };

        const handleOnline = () => {
            toast.success('Back online!', {
                id: 'network-status',
                duration: 3000,
            });
        };

        if (!navigator.onLine) {
            handleOffline();
        }

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            toast.dismiss('network-status');
        };
    }, []);
};

const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
);

export const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    useNetworkStatus();

    if (isLoading) return <LoadingFallback />;

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) return <LoadingFallback />;

    return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />;
};

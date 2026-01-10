import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '../services/users';


const useAuth = () => {
    const accessToken = localStorage.getItem("accessToken");

    const { data, isLoading, isError } = useQuery({
        queryKey: ["userMe"],
        queryFn: fetchUser,
        retry: 1,
        staleTime: 5 * 60 * 1000,
        enabled: !!accessToken, 
    });

    const isAuthenticated = !!accessToken && !!data && !isError;

    return { isAuthenticated, isLoading, user: data };
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-silver-500" />
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

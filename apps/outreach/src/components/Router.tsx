import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoute = () => {
    const token = localStorage.getItem('accessToken');

    if (token) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
};

export const ProtectedRoute = () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

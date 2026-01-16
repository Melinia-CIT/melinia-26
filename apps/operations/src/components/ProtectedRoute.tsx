import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";

// Simple auth guard using accessToken presence
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
    const location = useLocation();
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (!token) {
        return <Navigate to="/admin" replace state={{ from: location }} />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;

import { type AdminLoginInput } from "@melinia/shared";
import api from "./api";

interface AdminLoginResponse {
    accessToken: string;
    userId: string;
    role: string;
}

export const adminLogin = async (credentials: AdminLoginInput): Promise<AdminLoginResponse> => {
    const response = await api.post<any>('/admin/auth/login', credentials);
    console.log("Full login response object:", response);
    console.log("response.data:", response.data);

    // Handle both wrapped and unwrapped responses
    let loginData = response.data;
    if (response.data?.data) {
        loginData = response.data.data;
    }
    
    const { accessToken, userId, role, email } = loginData;
    
    console.log("Extracted data:", { accessToken, userId, role, email });

    if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('userId', userId || "");
        const normalizedRole = (role || "admin").toLowerCase();
        localStorage.setItem('userRole', normalizedRole);
        localStorage.setItem('userEmail', email || "");
        
        console.log("localStorage after:", { 
            accessToken: localStorage.getItem('accessToken'),
            userId: localStorage.getItem('userId'),
            userRole: localStorage.getItem('userRole'),
            userEmail: localStorage.getItem('userEmail')
        });
    } else {
        console.error("No accessToken found in response!");
    }

    return loginData;
};

export const adminLogout = async () => {
    try {
        await api.post('/admin/auth/logout');
    } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
    }
};

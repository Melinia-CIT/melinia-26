export interface AuthData {
    accessToken: string;
    refreshToken: string;
    // other fields...
}

export interface RegisterationResponse{
    message: string;
    data:unknown;
    accessToken:string;
}
export interface LoginResponse{
    status: boolean,
    message:string,
    data:AuthData;
}

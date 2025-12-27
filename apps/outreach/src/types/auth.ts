export interface AuthData {
    accessToken: string;
    refreshToken: string;
    // other fields...
}

export interface LoginResponse{
    status: boolean,
    message:string,
    data:unknown;
}

export interface AuthData{
    token: string;
}
export interface LoginResponse{
    status: boolean,
    message:string,
    data:unknown;
}
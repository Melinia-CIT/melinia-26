
export interface ApiError {
    message: string;
    code?: string;
    status?: number;
  }

export interface TypicalResponse{
  status: boolean;
  message: string;
  data?: unknown;
}
  
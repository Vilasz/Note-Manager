import api from "./client";

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  gmail_address?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  gmail_address: string | null;
  gmail_connected: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export const authApi = {
  register: (data: RegisterData) =>
    api.post<TokenResponse>("/auth/register", data),

  login: (data: LoginData) =>
    api.post<TokenResponse>("/auth/login", data),

  getMe: () => api.get<User>("/auth/me"),

  updateMe: (data: { name?: string; gmail_address?: string }) =>
    api.patch<User>("/auth/me", data),
};

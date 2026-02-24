import api from "./client";

export const gmailApi = {
  getAuthUrl: () => api.get<{ auth_url: string }>("/gmail/auth-url"),

  connect: (refresh_token: string) =>
    api.post("/gmail/connect", null, { params: { refresh_token } }),

  disconnect: () => api.post("/gmail/disconnect"),
};

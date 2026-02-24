import api from "./client";

export interface Payment {
  id: string;
  boleto_id: string;
  user_id: string;
  stripe_payment_id: string | null;
  amount: number;
  status: string;
  created_at: string;
}

export interface PaymentIntent {
  payment_id: string;
  client_secret: string;
  amount: number;
}

export const paymentsApi = {
  create: (boleto_id: string) =>
    api.post<PaymentIntent>("/payments/create", { boleto_id }),

  list: () => api.get<Payment[]>("/payments"),

  get: (id: string) => api.get<Payment>(`/payments/${id}`),
};

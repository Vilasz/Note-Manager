import api from "./client";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

export interface Boleto {
  id: string;
  user_id: string;
  category_id: string | null;
  category: Category | null;
  status: string;
  sender_name: string | null;
  sender_document: string | null;
  amount: number;
  due_date: string | null;
  barcode: string | null;
  description: string | null;
  ai_extracted_data: Record<string, unknown> | null;
  gmail_message_id: string | null;
  attachment_filename: string | null;
  received_at: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface BoletoList {
  items: Boleto[];
  total: number;
  page: number;
  pages: number;
}

export interface BoletoFilters {
  status?: string;
  category_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export const boletosApi = {
  list: (filters: BoletoFilters = {}) =>
    api.get<BoletoList>("/boletos", { params: filters }),

  get: (id: string) => api.get<Boleto>(`/boletos/${id}`),

  update: (id: string, data: Partial<Boleto>) =>
    api.patch<Boleto>(`/boletos/${id}`, data),

  sync: () => api.post<{ synced: number; message: string }>("/boletos/sync"),

  getCategories: () => api.get<Category[]>("/boletos/categories"),
};

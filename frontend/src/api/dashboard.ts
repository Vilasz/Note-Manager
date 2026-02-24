import api from "./client";

export interface DashboardSummary {
  total_pending: number;
  total_paid: number;
  total_overdue: number;
  amount_pending: number;
  amount_paid: number;
  amount_overdue: number;
  monthly_spending: { year: number; month: number; total: number }[];
  spending_by_category: { name: string; color: string; total: number }[];
  recent_boletos: {
    id: string;
    sender_name: string | null;
    amount: number;
    status: string;
    due_date: string | null;
  }[];
  upcoming_due: {
    id: string;
    sender_name: string | null;
    amount: number;
    due_date: string | null;
  }[];
}

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>("/dashboard/summary"),
};

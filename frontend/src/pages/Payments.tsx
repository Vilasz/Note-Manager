import { useQuery } from "@tanstack/react-query";
import { CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react";
import { paymentsApi, type Payment } from "@/api/payments";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function Payments() {
  const { data: payments, isLoading } = useQuery<Payment[]>({
    queryKey: ["payments"],
    queryFn: async () => (await paymentsApi.list()).data,
  });

  const getPaymentStatus = (status: string) => {
    switch (status) {
      case "succeeded":
        return {
          label: "Confirmado",
          icon: CheckCircle2,
          class: "bg-success/15 text-success",
        };
      case "pending":
        return {
          label: "Pendente",
          icon: Clock,
          class: "bg-warning/15 text-warning",
        };
      default:
        return {
          label: "Falhou",
          icon: XCircle,
          class: "bg-destructive/15 text-destructive",
        };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
        <p className="text-sm text-muted-foreground">
          Histórico de pagamentos realizados via Stripe
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !payments?.length ? (
        <div className="card flex h-64 flex-col items-center justify-center text-muted-foreground">
          <CreditCard className="mb-3 h-12 w-12" />
          <p className="text-sm font-medium">Nenhum pagamento realizado</p>
          <p className="mt-1 text-xs">
            Pague boletos pendentes para vê-los aqui
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const statusInfo = getPaymentStatus(payment.status);
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={payment.id}
                className="card flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Pagamento #{payment.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(payment.created_at)} &middot; Stripe ID:{" "}
                      {payment.stripe_payment_id?.slice(0, 20) || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-base font-bold text-foreground">
                    {formatCurrency(payment.amount)}
                  </span>
                  <span
                    className={`badge flex items-center gap-1 ${statusInfo.class}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, CreditCard, FileText, Tag, Calendar, Hash } from "lucide-react";
import type { Boleto } from "@/api/boletos";
import { paymentsApi } from "@/api/payments";
import { formatCurrency, formatDate, getStatusClass, getStatusLabel } from "@/lib/utils";

interface Props {
  boleto: Boleto;
  onClose: () => void;
}

export default function BoletoDetail({ boleto, onClose }: Props) {
  const queryClient = useQueryClient();
  const [paymentStarted, setPaymentStarted] = useState(false);

  const payMutation = useMutation({
    mutationFn: () => paymentsApi.create(boleto.id),
    onSuccess: () => {
      setPaymentStarted(true);
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="card relative w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <h2 className="text-lg font-bold text-foreground">
            Detalhes do Boleto
          </h2>
          <p className="text-sm text-muted-foreground">
            {boleto.attachment_filename || "Sem anexo"}
          </p>
        </div>

        <div className="space-y-4">
          <DetailRow
            icon={FileText}
            label="Remetente"
            value={boleto.sender_name || "Desconhecido"}
          />
          <DetailRow
            icon={Hash}
            label="CNPJ/CPF"
            value={boleto.sender_document || "—"}
          />
          <DetailRow
            icon={CreditCard}
            label="Valor"
            value={formatCurrency(boleto.amount)}
            highlight
          />
          <DetailRow
            icon={Calendar}
            label="Vencimento"
            value={formatDate(boleto.due_date)}
          />
          <DetailRow
            icon={Tag}
            label="Categoria"
            value={boleto.category?.name || "Sem categoria"}
          />

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`badge ${getStatusClass(boleto.status)}`}>
              {getStatusLabel(boleto.status)}
            </span>
          </div>

          {boleto.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descrição</p>
              <p className="rounded-lg bg-background/50 px-3 py-2 text-sm text-foreground">
                {boleto.description}
              </p>
            </div>
          )}

          {boleto.barcode && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Código de barras
              </p>
              <p className="rounded-lg bg-background/50 px-3 py-2 font-mono text-xs text-foreground break-all">
                {boleto.barcode}
              </p>
            </div>
          )}

          {boleto.ai_extracted_data && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Dados extraídos pela IA
              </p>
              <pre className="rounded-lg bg-background/50 px-3 py-2 text-xs text-muted-foreground overflow-x-auto">
                {JSON.stringify(boleto.ai_extracted_data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {boleto.status === "pending" && (
          <div className="mt-6 border-t border-border pt-4">
            {paymentStarted ? (
              <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
                Pagamento iniciado com sucesso! Verifique a aba Pagamentos.
              </div>
            ) : (
              <button
                onClick={() => payMutation.mutate()}
                disabled={payMutation.isPending}
                className="btn btn-primary w-full gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {payMutation.isPending ? "Processando..." : `Pagar ${formatCurrency(boleto.amount)}`}
              </button>
            )}
            {payMutation.isError && (
              <p className="mt-2 text-center text-sm text-destructive">
                Erro ao processar pagamento. Tente novamente.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm text-muted-foreground">{label}:</span>
      <span
        className={`text-sm ${highlight ? "font-bold text-primary" : "font-medium text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

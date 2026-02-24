import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from "lucide-react";
import { boletosApi, type Boleto, type BoletoList, type Category } from "@/api/boletos";
import { paymentsApi } from "@/api/payments";
import { formatCurrency, formatDate, getStatusClass, getStatusLabel, cn } from "@/lib/utils";
import BoletoDetail from "./BoletoDetail";

export default function Boletos() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);

  const { data: boletosData, isLoading } = useQuery<BoletoList>({
    queryKey: ["boletos", status, categoryId, search, page],
    queryFn: async () =>
      (
        await boletosApi.list({
          status: status || undefined,
          category_id: categoryId || undefined,
          search: search || undefined,
          page,
          per_page: 15,
        })
      ).data,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => (await boletosApi.getCategories()).data,
  });

  const syncMutation = useMutation({
    mutationFn: () => boletosApi.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boletos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const statusFilters = [
    { value: "", label: "Todos" },
    { value: "pending", label: "Pendentes" },
    { value: "paid", label: "Pagos" },
    { value: "overdue", label: "Vencidos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boletos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus boletos e pagamentos
          </p>
        </div>
        <button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          className="btn btn-primary gap-2"
        >
          <RefreshCw
            className={cn("h-4 w-4", syncMutation.isPending && "animate-spin")}
          />
          {syncMutation.isPending ? "Sincronizando..." : "Sincronizar Gmail"}
        </button>
      </div>

      {syncMutation.isSuccess && (
        <div className="rounded-lg bg-success/10 px-4 py-3 text-sm text-success">
          {(syncMutation.data as any)?.data?.message || "Sincronização concluída"}
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="input pl-9"
              placeholder="Buscar por remetente ou descrição..."
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatus(f.value);
                  setPage(1);
                }}
                className={cn(
                  "btn text-xs",
                  status === f.value ? "btn-primary" : "btn-secondary"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="input w-auto"
          >
            <option value="">Todas categorias</option>
            {categories?.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !boletosData?.items.length ? (
          <div className="flex h-48 flex-col items-center justify-center text-muted-foreground">
            <FileText className="mb-2 h-10 w-10" />
            <p className="text-sm">Nenhum boleto encontrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Remetente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vencimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {boletosData.items.map((boleto) => (
                <tr
                  key={boleto.id}
                  className="border-b border-border/50 transition-colors hover:bg-muted/20"
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-foreground">
                      {boleto.sender_name || "Desconhecido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {boleto.description?.slice(0, 50) || "—"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    {boleto.category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: boleto.category.color }}
                        />
                        {boleto.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(boleto.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {formatDate(boleto.due_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusClass(boleto.status)}`}>
                      {getStatusLabel(boleto.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedBoleto(boleto)}
                      className="btn btn-ghost text-xs text-primary"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {boletosData && boletosData.pages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-6 py-3">
            <p className="text-xs text-muted-foreground">
              Página {boletosData.page} de {boletosData.pages} ({boletosData.total} itens)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-ghost p-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(boletosData.pages, p + 1))}
                disabled={page >= boletosData.pages}
                className="btn btn-ghost p-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedBoleto && (
        <BoletoDetail
          boleto={selectedBoleto}
          onClose={() => setSelectedBoleto(null)}
        />
      )}
    </div>
  );
}

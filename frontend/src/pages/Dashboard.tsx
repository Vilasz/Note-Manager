import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import { dashboardApi, type DashboardSummary } from "@/api/dashboard";
import { formatCurrency, formatDate, getStatusClass, getStatusLabel } from "@/lib/utils";

const MONTH_NAMES = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export default function Dashboard() {
  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ["dashboard"],
    queryFn: async () => (await dashboardApi.getSummary()).data,
  });

  if (isLoading || !summary) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const monthlyData = summary.monthly_spending.map((m) => ({
    name: `${MONTH_NAMES[m.month]}/${String(m.year).slice(-2)}`,
    total: m.total,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral dos seus gastos e boletos
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Pendentes"
          count={summary.total_pending}
          amount={summary.amount_pending}
          icon={Clock}
          color="text-warning"
          bgColor="bg-warning/10"
        />
        <KpiCard
          title="Pagos"
          count={summary.total_paid}
          amount={summary.amount_paid}
          icon={CheckCircle2}
          color="text-success"
          bgColor="bg-success/10"
        />
        <KpiCard
          title="Vencidos"
          count={summary.total_overdue}
          amount={summary.amount_overdue}
          icon={AlertTriangle}
          color="text-destructive"
          bgColor="bg-destructive/10"
        />
        <KpiCard
          title="Total Geral"
          count={summary.total_pending + summary.total_paid + summary.total_overdue}
          amount={summary.amount_pending + summary.amount_paid + summary.amount_overdue}
          icon={TrendingUp}
          color="text-primary"
          bgColor="bg-primary/10"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Gastos Mensais
          </h2>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "0.5rem",
                    color: "#fafafa",
                  }}
                  formatter={(value) => [formatCurrency(Number(value)), "Total"]}
                />
                <Bar dataKey="total" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Nenhum dado de pagamento ainda
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4 text-base font-semibold text-foreground">
            Gastos por Categoria
          </h2>
          {summary.spending_by_category.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={summary.spending_by_category}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {summary.spending_by_category.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "0.5rem",
                      color: "#fafafa",
                    }}
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {summary.spending_by_category.map((cat, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium text-foreground">
                      {formatCurrency(cat.total)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
              Nenhuma categoria ainda
            </div>
          )}
        </div>
      </div>

      {/* Recent & Upcoming */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Boletos Recentes
            </h2>
            <Link
              to="/boletos"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {summary.recent_boletos.length > 0 ? (
              summary.recent_boletos.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {b.sender_name || "Remetente desconhecido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence em {formatDate(b.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      {formatCurrency(b.amount)}
                    </p>
                    <span className={`badge ${getStatusClass(b.status)}`}>
                      {getStatusLabel(b.status)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum boleto encontrado
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Próximos Vencimentos
            </h2>
          </div>
          <div className="space-y-3">
            {summary.upcoming_due.length > 0 ? (
              summary.upcoming_due.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-lg bg-background/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {b.sender_name || "Remetente desconhecido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Vence em {formatDate(b.due_date)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatCurrency(b.amount)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum vencimento próximo
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  count,
  amount,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  count: number;
  amount: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="mt-1 text-2xl font-bold text-foreground">
          {formatCurrency(amount)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {count} {count === 1 ? "boleto" : "boletos"}
        </p>
      </div>
      <div className={`rounded-lg p-2.5 ${bgColor}`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
    </div>
  );
}

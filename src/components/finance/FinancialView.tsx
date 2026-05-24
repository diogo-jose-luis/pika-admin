"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faChartLine,
  faDollarSign,
  faPercent,
} from "@fortawesome/free-solid-svg-icons";
import { useAdminDate } from "@/components/providers/AdminDateProvider";
import { TransactionList } from "@/components/finance/TransactionList";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import type { FinanceData } from "@/lib/finance";

const EMPTY_FINANCE: FinanceData = {
  dailyRevenue: 0,
  weeklyRevenue: 0,
  platformCommission: 0,
  pendingPayments: 0,
  monthlyRevenue: [],
  categoryData: [
    { name: "Corridas Regulares", value: 0, color: "#00ced1" },
    { name: "Corridas Premium", value: 0, color: "#22c55e" },
    { name: "Entregas", value: 0, color: "#f97316" },
    { name: "Outros", value: 0, color: "#334155" },
  ],
  recentTransactions: [],
};

function ChartMount({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready) {
    return (
      <div
        className="h-full w-full min-h-[12rem] animate-pulse rounded-xl bg-pika-page"
        aria-hidden
      />
    );
  }
  return <>{children}</>;
}

function formatKzCompact(amount: number) {
  return `Kz ${amount.toLocaleString("pt-AO", { maximumFractionDigits: 0 })}`;
}

export function FinancialView() {
  const { selectedIso, dateLabel } = useAdminDate();
  const [data, setData] = useState<FinanceData>(EMPTY_FINANCE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadFinance = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch(`/api/financeiro?date=${selectedIso}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as FinanceData & { error?: string };

        if (!res.ok) {
          throw new Error(json.error ?? "Erro ao carregar dados financeiros.");
        }

        setData({
          dailyRevenue: json.dailyRevenue ?? 0,
          weeklyRevenue: json.weeklyRevenue ?? 0,
          platformCommission: json.platformCommission ?? 0,
          pendingPayments: json.pendingPayments ?? 0,
          monthlyRevenue: json.monthlyRevenue ?? [],
          categoryData: json.categoryData ?? EMPTY_FINANCE.categoryData,
          recentTransactions: json.recentTransactions ?? [],
        });
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Erro ao carregar dados financeiros.",
        );
        setData(EMPTY_FINANCE);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [selectedIso],
  );

  useEffect(() => {
    void loadFinance();
  }, [loadFinance]);

  const stat = (value: string) => (loading ? "…" : value);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex justify-end">
        <RefreshDataButton
          loading={refreshing}
          onClick={() => void loadFinance(true)}
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-pika-muted">Receita Diária</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                {stat(formatKzCompact(data.dailyRevenue))}
              </p>
              <p className="mt-2 text-xs text-pika-muted">{dateLabel}</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-pika-muted">Receita Semanal</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                {stat(formatKzCompact(data.weeklyRevenue))}
              </p>
              <p className="mt-2 text-xs text-pika-muted">Últimos 7 dias</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
              <FontAwesomeIcon icon={faChartLine} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-pika-muted">Comissão Plataforma</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                {stat(formatKzCompact(data.platformCommission))}
              </p>
              <p className="mt-2 text-xs text-pika-muted">{dateLabel}</p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pika-primary text-white shadow-sm">
              <FontAwesomeIcon icon={faPercent} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-pika-muted">Pagamentos Pendentes</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                {stat(formatKzCompact(data.pendingPayments))}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
              <FontAwesomeIcon icon={faArrowsRotate} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-pika-ink">Receita Mensal</h2>
              <p className="text-xs text-pika-muted">Últimos 6 meses</p>
            </div>
          </div>
          <div className="h-72 w-full min-h-[288px] min-w-0">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.monthlyRevenue}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  barGap={6}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eceb" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#636e72", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `Kz ${v}k`}
                    tick={{ fill: "#636e72", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, borderColor: "#e6eceb" }}
                    formatter={(value, name) => {
                      const n = typeof value === "number" ? value : Number(value);
                      const text = Number.isFinite(n)
                        ? `Kz ${n.toLocaleString("pt-AO")}k`
                        : "";
                      return [text, String(name)];
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="receita"
                    name="Receita"
                    fill="#00ced1"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="comissao"
                    name="Comissão"
                    fill="#7dd3fc"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-pika-ink">Receita Por Categoria</h2>
            <p className="text-xs text-pika-muted">Distribuição atual · {dateLabel}</p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="mx-auto h-48 w-full max-w-[220px] sm:h-52">
              <ChartMount>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="58%"
                      outerRadius="82%"
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {data.categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => {
                        const n = typeof value === "number" ? value : Number(value);
                        return Number.isFinite(n) ? `${n}%` : "";
                      }}
                      contentStyle={{ borderRadius: 12, borderColor: "#e6eceb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartMount>
            </div>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.categoryData.map((c) => (
                <li
                  key={c.name}
                  className="flex min-w-0 items-center gap-2 text-xs sm:text-sm"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-pika-muted">
                    {c.name}
                  </span>
                  <span className="shrink-0 font-semibold text-pika-ink">
                    {loading ? "…" : `${c.value}%`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="flex flex-col gap-2 border-b border-pika-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-pika-ink">Transações Recentes</h2>
            <p className="text-xs text-pika-muted">Corridas concluídas</p>
          </div>
          <Link
            href="/financeiro/transacoes"
            className="text-sm font-semibold text-pika-primary transition hover:text-pika-primary-dark"
          >
            Ver todas &gt;
          </Link>
        </div>
        {data.recentTransactions.length === 0 && !loading ? (
          <p className="px-5 py-8 text-center text-sm text-pika-muted">
            Sem transações para esta data.
          </p>
        ) : (
          <TransactionList items={data.recentTransactions} />
        )}
      </section>
    </div>
  );
}

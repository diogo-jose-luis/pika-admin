"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCar,
  faCircleCheck,
  faClock,
  faDollarSign,
  faGaugeHigh,
  faLocationDot,
  faStar,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { useAdminDate } from "@/components/providers/AdminDateProvider";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import type { DashboardData } from "@/lib/dashboard";
import { cn } from "@/lib/cn";

const EMPTY_DASHBOARD: DashboardData = {
  summary: {
    totalRevenueLabel: "Kz 0,00",
    totalRidesToday: 0,
    activeDrivers: 0,
    activePassengers: 0,
  },
  todayStats: { completed: 0, cancelled: 0, inProgress: 0 },
  weekRevenue: [],
  ridesByHour: [],
  recentRides: [],
  topDrivers: [],
};

function initialsFromName(name: string) {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ChartMount({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready) {
    return (
      <div
        className="h-64 w-full min-h-[256px] min-w-0 animate-pulse rounded-xl bg-pika-page"
        aria-hidden
      />
    );
  }
  return <>{children}</>;
}

function StatusPill({
  status,
}: {
  status: DashboardData["recentRides"][number]["status"];
}) {
  const map = {
    "Em andamento": "bg-blue-50 text-pika-info ring-1 ring-blue-100",
    Cancelada: "bg-red-50 text-pika-danger ring-1 ring-red-100",
    Concluída: "bg-emerald-50 text-pika-success ring-1 ring-emerald-100",
    Pendente: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        map[status],
      )}
    >
      {status}
    </span>
  );
}

function Avatar({ initials, className }: { initials: string; className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
        className,
      )}
    >
      {initials}
    </div>
  );
}

export function DashboardHome() {
  const { selectedIso, dateLabel } = useAdminDate();
  const [data, setData] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch(`/api/dashboard?date=${selectedIso}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as DashboardData & { error?: string };

      if (!res.ok) {
        throw new Error(json.error ?? "Erro ao carregar o dashboard.");
      }

      setData({
        summary: json.summary ?? EMPTY_DASHBOARD.summary,
        todayStats: json.todayStats ?? EMPTY_DASHBOARD.todayStats,
        weekRevenue: json.weekRevenue ?? [],
        ridesByHour: json.ridesByHour ?? [],
        recentRides: json.recentRides ?? [],
        topDrivers: json.topDrivers ?? [],
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar o dashboard.",
      );
      setData(EMPTY_DASHBOARD);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [selectedIso]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stat = (value: string | number) => (loading ? "…" : value);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex justify-end">
        <RefreshDataButton
          loading={refreshing}
          onClick={() => void loadDashboard(true)}
        />
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-pika-primary p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/90">Receita total ({dateLabel})</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {stat(data.summary.totalRevenueLabel)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white">
              <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Total de Corridas ({dateLabel})</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(data.summary.totalRidesToday.toLocaleString("pt-AO"))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pika-primary-dark/15 text-pika-primary-dark">
              <FontAwesomeIcon icon={faCar} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Motoristas Ativos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(data.summary.activeDrivers.toLocaleString("pt-AO"))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pika-lime/30 text-pika-ink">
              <FontAwesomeIcon icon={faGaugeHigh} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Passageiros Ativos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(data.summary.activePassengers.toLocaleString("pt-AO"))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pika-blue/15 text-pika-blue">
              <FontAwesomeIcon icon={faUser} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Corridas Concluídas</p>
              <p className="mt-2 text-2xl font-bold text-pika-ink">
                {stat(data.todayStats.completed.toLocaleString("pt-AO"))}
              </p>
              <p className="mt-2 text-xs text-pika-muted">{dateLabel}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-pika-success">
              <FontAwesomeIcon icon={faCircleCheck} className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Corridas Canceladas</p>
              <p className="mt-2 text-2xl font-bold text-pika-ink">
                {stat(data.todayStats.cancelled.toLocaleString("pt-AO"))}
              </p>
              <p className="mt-2 text-xs text-pika-muted">{dateLabel}</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-pika-danger">
              <FontAwesomeIcon icon={faBan} className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Corridas em Andamento</p>
              <p className="mt-2 text-2xl font-bold text-pika-ink">
                {stat(data.todayStats.inProgress.toLocaleString("pt-AO"))}
              </p>
              <p className="mt-2 text-xs text-pika-muted">Em tempo real</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-pika-info">
              <FontAwesomeIcon icon={faClock} className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-pika-ink">Receita Semanal</h2>
            <span className="text-xs text-pika-muted">Últimos 7 dias</span>
          </div>
          <div className="h-64 w-full min-h-[256px] min-w-0">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.weekRevenue}
                  margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00ced1" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00ced1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eceb" />
                  <XAxis
                    dataKey="day"
                    tick={{ fill: "#636e72", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `Kz ${(v / 1000).toFixed(0)}k`}
                    tick={{ fill: "#636e72", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const n = typeof value === "number" ? value : Number(value);
                      const text = Number.isFinite(n)
                        ? `Kz ${n.toLocaleString("pt-AO")}`
                        : "";
                      return [text, "Receita"];
                    }}
                    labelFormatter={(l) => l}
                    contentStyle={{ borderRadius: 12, borderColor: "#e6eceb" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="kz"
                    stroke="#00ced1"
                    strokeWidth={2}
                    fill="url(#fillRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-pika-ink">Corridas Por Horário</h2>
            <span className="text-xs text-pika-muted">Distribuição · {dateLabel}</span>
          </div>
          <div className="h-64 w-full min-h-[256px] min-w-0">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.ridesByHour}
                  margin={{ left: 0, right: 8, top: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6eceb" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tick={{ fill: "#636e72", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#636e72", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e6eceb" }} />
                  <Legend />
                  <Bar
                    dataKey="concluidas"
                    name="Concluídas"
                    fill="#22c55e"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="canceladas"
                    name="Canceladas"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
          <div className="border-b border-pika-border px-5 py-4">
            <h2 className="text-base font-semibold text-pika-ink">Corridas Recentes</h2>
          </div>
          <div className="overflow-x-auto scroll-pika">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="bg-pika-page/80 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                <tr>
                  <th className="px-5 py-3">Passageiro / Motorista</th>
                  <th className="px-5 py-3">Percurso</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Tempo</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pika-border">
                {data.recentRides.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-pika-muted">
                      {loading ? "A carregar…" : "Sem corridas recentes."}
                    </td>
                  </tr>
                ) : (
                  data.recentRides.map((r) => (
                    <tr key={r.id} className="hover:bg-pika-page/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar
                            initials={initialsFromName(r.passenger)}
                            className="bg-pika-primary"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-pika-ink">
                              {r.passenger}
                            </p>
                            <p className="truncate text-xs text-pika-muted">{r.driver}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex min-w-0 flex-col gap-1 text-xs text-pika-muted">
                          <span className="inline-flex items-center gap-1 text-pika-ink">
                            <FontAwesomeIcon
                              icon={faLocationDot}
                              className="h-3.5 w-3.5 shrink-0 text-pika-primary"
                            />
                            <span className="truncate">{r.from}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-pika-ink">
                            <FontAwesomeIcon
                              icon={faLocationDot}
                              className="h-3.5 w-3.5 shrink-0 text-pika-primary-dark"
                            />
                            <span className="truncate">{r.to}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={r.status} />
                      </td>
                      <td className="px-5 py-3 text-pika-muted">{r.when}</td>
                      <td className="px-5 py-3 text-right font-semibold text-pika-ink">
                        {r.value}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
          <div className="border-b border-pika-border px-5 py-4">
            <h2 className="text-base font-semibold text-pika-ink">Top Motoristas</h2>
          </div>
          {data.topDrivers.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-pika-muted">
              {loading ? "A carregar…" : "Sem dados de motoristas."}
            </p>
          ) : (
            <ul className="divide-y divide-pika-border">
              {data.topDrivers.map((d) => (
                <li key={d.rank} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-6 text-sm font-bold text-pika-muted">#{d.rank}</span>
                  <Avatar initials={d.initials} className="bg-pika-lime text-pika-ink" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-pika-ink">{d.name}</p>
                    <p className="flex items-center gap-1 text-xs text-pika-muted">
                      <FontAwesomeIcon
                        icon={faStar}
                        className="text-amber-400"
                        aria-hidden
                      />
                      <span>
                        {d.rating > 0 ? d.rating : "—"} · {d.rides} corridas
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-pika-ink">{d.earn}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

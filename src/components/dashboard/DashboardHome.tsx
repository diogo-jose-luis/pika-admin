"use client";

import { useEffect, useState } from "react";
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
import { cn } from "@/lib/cn";

const weekRevenue = [
  { day: "Seg", kz: 12000 },
  { day: "Ter", kz: 15000 },
  { day: "Qua", kz: 11000 },
  { day: "Qui", kz: 18000 },
  { day: "Sex", kz: 22000 },
  { day: "Sáb", kz: 25000 },
  { day: "Dom", kz: 19000 },
];

const ridesByHour = [
  { t: "00h", concluidas: 12, canceladas: 1 },
  { t: "03h", concluidas: 8, canceladas: 0 },
  { t: "06h", concluidas: 24, canceladas: 2 },
  { t: "09h", concluidas: 40, canceladas: 3 },
  { t: "12h", concluidas: 55, canceladas: 4 },
  { t: "15h", concluidas: 48, canceladas: 2 },
  { t: "18h", concluidas: 62, canceladas: 5 },
  { t: "21h", concluidas: 35, canceladas: 2 },
];

function initialsFromName(name: string) {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const recentRides = [
  {
    id: "1",
    passenger: "Maria L.",
    driver: "João K.",
    from: "Mutamba",
    to: "Ilha",
    status: "Em andamento" as const,
    when: "5 min atrás",
    value: "Kz 6.000,00",
  },
  {
    id: "2",
    passenger: "Carlos M.",
    driver: "Pedro S.",
    from: "Viana",
    to: "Centro",
    status: "Cancelada" as const,
    when: "12 min atrás",
    value: "Kz 0,00",
  },
  {
    id: "3",
    passenger: "Ana P.",
    driver: "Miguel T.",
    from: "Talatona",
    to: "Maianga",
    status: "Concluída" as const,
    when: "25 min atrás",
    value: "Kz 8.500,00",
  },
  {
    id: "4",
    passenger: "Helder R.",
    driver: "Bruno A.",
    from: "Cazenga",
    to: "Alvalade",
    status: "Concluída" as const,
    when: "40 min atrás",
    value: "Kz 4.200,00",
  },
];

const topDrivers = [
  { rank: 1, initials: "JK", name: "João K.", rating: 4.9, rides: 312, earn: "Kz 420.000", trend: "+3.2%" },
  { rank: 2, initials: "PS", name: "Pedro S.", rating: 4.8, rides: 298, earn: "Kz 395.000", trend: "+1.8%" },
  { rank: 3, initials: "MT", name: "Miguel T.", rating: 4.7, rides: 276, earn: "Kz 361.000", trend: "+2.4%" },
];

function Trend({
  value,
  variant = "default",
}: {
  value: string;
  variant?: "default" | "onPrimary";
}) {
  if (variant === "onPrimary") {
    return (
      <span className="text-xs font-medium">
        <span className="font-semibold text-neutral-950">{value}</span>
        <span className="text-white"> vs ontem</span>
      </span>
    );
  }
  const up = value.trim().startsWith("+");
  const down = value.trim().startsWith("-");
  return (
    <span
      className={cn(
        "text-xs font-medium",
        up && "text-pika-success",
        down && "text-pika-danger",
        !up && !down && "text-pika-muted",
      )}
    >
      {value} vs ontem
    </span>
  );
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

function StatusPill({ status }: { status: (typeof recentRides)[number]["status"] }) {
  const map = {
    "Em andamento": "bg-blue-50 text-pika-info ring-1 ring-blue-100",
    Cancelada: "bg-red-50 text-pika-danger ring-1 ring-red-100",
    Concluída: "bg-emerald-50 text-pika-success ring-1 ring-emerald-100",
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
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl bg-pika-primary p-5 text-white shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-white/90">Receita total</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">Kz 50.000</p>
              <p className="mt-2">
                <Trend value="+8.4%" variant="onPrimary" />
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
              <p className="text-sm font-medium text-pika-muted">Total de Corridas</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">2.200</p>
              <p className="mt-2">
                <Trend value="+2.1%" />
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
              <p className="mt-2 text-3xl font-bold text-pika-ink">10.000</p>
              <p className="mt-2">
                <Trend value="+1.5%" />
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
              <p className="mt-2 text-3xl font-bold text-pika-ink">30.000</p>
              <p className="mt-2">
                <Trend value="+5.0%" />
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
              <p className="mt-2 text-2xl font-bold text-pika-ink">1.500</p>
              <p className="mt-2">
                <Trend value="+2.1%" />
              </p>
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
              <p className="mt-2 text-2xl font-bold text-pika-ink">25</p>
              <p className="mt-2">
                <Trend value="-1.5%" />
              </p>
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
              <p className="mt-2 text-2xl font-bold text-pika-ink">100</p>
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
                <AreaChart data={weekRevenue} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ced1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#00ced1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eceb" />
                <XAxis dataKey="day" tick={{ fill: "#636e72", fontSize: 12 }} axisLine={false} tickLine={false} />
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
                <Area type="monotone" dataKey="kz" stroke="#00ced1" strokeWidth={2} fill="url(#fillRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartMount>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-pika-ink">Corridas Por Horário</h2>
            <span className="text-xs text-pika-muted">Distribuição hoje</span>
          </div>
          <div className="h-64 w-full min-h-[256px] min-w-0">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ridesByHour} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6eceb" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "#636e72", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#636e72", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#e6eceb" }} />
                <Legend />
                <Bar dataKey="concluidas" name="Concluídas" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="canceladas" name="Canceladas" fill="#ef4444" radius={[6, 6, 0, 0]} />
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
                {recentRides.map((r) => (
                  <tr key={r.id} className="hover:bg-pika-page/50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          initials={initialsFromName(r.passenger)}
                          className="bg-pika-primary"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-pika-ink">{r.passenger}</p>
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
                    <td className="px-5 py-3 text-right font-semibold text-pika-ink">{r.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
          <div className="border-b border-pika-border px-5 py-4">
            <h2 className="text-base font-semibold text-pika-ink">Top Motoristas</h2>
          </div>
          <ul className="divide-y divide-pika-border">
            {topDrivers.map((d) => (
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
                      {d.rating} · {d.rides} corridas
                    </span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-pika-ink">{d.earn}</p>
                  <p className="text-xs font-medium text-pika-success">{d.trend}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

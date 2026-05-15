"use client";

import { useEffect, useState } from "react";
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
  faArrowDown,
  faArrowUp,
  faArrowsRotate,
  faChartLine,
  faDollarSign,
  faPercent,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/cn";

const MONTHLY_REVENUE = [
  { month: "Jan", receita: 520, comissao: 150 },
  { month: "Fev", receita: 480, comissao: 135 },
  { month: "Mar", receita: 560, comissao: 160 },
  { month: "Abr", receita: 510, comissao: 145 },
  { month: "Mai", receita: 590, comissao: 170 },
  { month: "Jun", receita: 550, comissao: 155 },
];

const CATEGORY_DATA = [
  { name: "Corridas Regulares", value: 65, color: "#00ced1" },
  { name: "Corridas Premium", value: 20, color: "#22c55e" },
  { name: "Entregas", value: 10, color: "#f97316" },
  { name: "Outros", value: 5, color: "#334155" },
];

const TRANSACTIONS = [
  {
    id: "1",
    positive: true,
    label: "Corridas do Dia",
    when: "02/02/2026 23:59",
    amount: "Kz 100.000,00",
  },
  {
    id: "2",
    positive: false,
    label: "Corridas do Dia",
    when: "01/02/2026 00:00",
    amount: "Kz 100.000,00",
  },
  {
    id: "3",
    positive: true,
    label: "Corridas do Dia",
    when: "02/02/2026 23:59",
    amount: "Kz 100.000,00",
  },
];

function ChartMount({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(id);
  }, []);
  if (!ready) {
    return (
      <div
        className="h-72 w-full min-h-[288px] min-w-0 animate-pulse rounded-xl bg-pika-page"
        aria-hidden
      />
    );
  }
  return <>{children}</>;
}

function TrendPill() {
  return (
    <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
      <span>+2.1%</span>
      <span className="font-normal text-emerald-600/90">vs ontem</span>
    </span>
  );
}

export function FinancialView() {
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Receita Diária</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                {(395000).toLocaleString("pt-AO", { maximumFractionDigits: 0 })}
              </p>
              <TrendPill />
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
              <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Receita Semanal</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                Kz {(8200000).toLocaleString("pt-AO", { maximumFractionDigits: 0 })}
              </p>
              <TrendPill />
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
              <FontAwesomeIcon icon={faChartLine} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Comissão Plataforma</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                KZ {(123000).toLocaleString("pt-AO", { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pika-primary text-white shadow-sm">
              <FontAwesomeIcon icon={faPercent} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Pagamentos Pendentes</p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-pika-ink md:text-3xl">
                Kz {(300000).toLocaleString("pt-AO", { maximumFractionDigits: 0 })}
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
                  data={MONTHLY_REVENUE}
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
            <p className="text-xs text-pika-muted">Distribuição atual</p>
          </div>
          <div className="h-72 w-full min-h-[288px] min-w-0">
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CATEGORY_DATA}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={2}
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {CATEGORY_DATA.map((entry) => (
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
            <ul className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              {CATEGORY_DATA.map((c) => (
                <li key={c.name} className="flex items-center gap-2 text-pika-ink">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: c.color }}
                    aria-hidden
                  />
                  <span className="text-pika-muted">{c.name}:</span>
                  <span className="font-semibold">{c.value}%</span>
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
            <p className="text-xs text-pika-muted">Últimas movimentações</p>
          </div>
          <Link
            href="/financeiro"
            className="text-sm font-semibold text-pika-primary transition hover:text-pika-primary-dark"
          >
            Ver todas &gt;
          </Link>
        </div>
        <ul className="divide-y divide-pika-border bg-slate-50/50">
          {TRANSACTIONS.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-4 px-5 py-4 transition hover:bg-pika-card/80"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
                  t.positive ? "bg-emerald-500" : "bg-red-500",
                )}
              >
                <FontAwesomeIcon
                  icon={t.positive ? faArrowUp : faArrowDown}
                  className="h-4 w-4"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-pika-ink">{t.label}</p>
                <p className="text-sm text-pika-muted">{t.when}</p>
              </div>
              <p
                className={cn(
                  "shrink-0 text-sm font-bold tabular-nums",
                  t.positive ? "text-pika-success" : "text-pika-danger",
                )}
              >
                {t.positive ? "+ " : "- "}
                {t.amount}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

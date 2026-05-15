"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faCar,
  faDownload,
  faDollarSign,
  faFileLines,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/cn";

const RECENT_REPORTS = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
  title: "Relatório Mensal - Janeiro 2026",
  meta: "Completo • 01/02/2026 • 2.4 MB",
  format: "PDF",
}));

export function ReportsView() {
  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="flex gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
            <FontAwesomeIcon icon={faDollarSign} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-pika-ink md:text-base">
              Relatório Financeiro
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-pika-muted md:text-sm">
              Análise completa de todas as corridas do período
            </p>
          </div>
        </article>

        <article className="flex gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-700 text-white shadow-sm">
            <FontAwesomeIcon icon={faCar} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-pika-ink md:text-base">
              Relatório de Corridas
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-pika-muted md:text-sm">
              Análise completa de todas as corridas do período
            </p>
          </div>
        </article>

        <article className="flex gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm">
            <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-pika-ink md:text-base">
              Relatório de Motoristas
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-pika-muted md:text-sm">
              Performance e métricas dos motoristas
            </p>
          </div>
        </article>

        <article className="flex gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
            <FontAwesomeIcon icon={faArrowTrendUp} className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-pika-ink md:text-base">
              Análise de Tendências
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-pika-muted md:text-sm">
              Comparativos e projeções de crescimento
            </p>
          </div>
        </article>
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-page/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Tipo
              </span>
              <select className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2">
                <option>Relatório Completo</option>
                <option>Resumo executivo</option>
                <option>Personalizado</option>
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Período
              </span>
              <select className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2">
                <option>Este mês</option>
                <option>Mês anterior</option>
                <option>Últimos 90 dias</option>
              </select>
            </label>
            <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Formato
              </span>
              <select className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2">
                <option>PDF</option>
                <option>Excel</option>
                <option>CSV</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark lg:self-end"
          >
            <FontAwesomeIcon icon={faFileLines} className="h-4 w-4" />
            Gerar Relatório
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="border-b border-pika-border px-5 py-4">
          <h2 className="text-base font-semibold text-pika-ink">Relatórios Recentes</h2>
          <p className="text-xs text-pika-muted">Últimas relatórios gerados</p>
        </div>
        <ul className="divide-y divide-pika-border">
          {RECENT_REPORTS.map((r, idx) => (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                idx === 1 ? "bg-pika-page/90" : "bg-pika-card hover:bg-pika-page/80",
              )}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pika-primary/15 text-pika-primary">
                <FontAwesomeIcon icon={faFileLines} className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-pika-ink">{r.title}</p>
                <p className="text-sm text-pika-muted">{r.meta}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-lg border border-pika-border bg-pika-card px-2.5 py-1 text-xs font-semibold text-pika-muted">
                  {r.format}
                </span>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-pika-border text-pika-muted transition hover:border-pika-primary hover:bg-pika-primary/5 hover:text-pika-primary"
                  aria-label="Descarregar relatório"
                >
                  <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

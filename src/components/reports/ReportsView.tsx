"use client";

import { useCallback, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowTrendUp,
  faCar,
  faDollarSign,
  faDownload,
  faFileLines,
  faSpinner,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/context/AuthContext";
import {
  REPORT_FORMAT_OPTIONS,
  REPORT_TYPES,
  reportFilename,
  type ReportFormat,
  type ReportTypeId,
} from "@/lib/reports-meta";
import {
  MONTH_OPTIONS,
  REPORT_YEARS,
  formatGeneratedAt,
  monthLabel,
  periodLabel,
  previousCalendarMonth,
} from "@/lib/reports-period";
import { cn } from "@/lib/cn";

const REPORT_ICONS = {
  financeiro: faDollarSign,
  corridas: faCar,
  motoristas: faUsers,
  tendencias: faArrowTrendUp,
} as const;

export function ReportsView() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const defaultYear = REPORT_YEARS.includes(
    now.getFullYear() as (typeof REPORT_YEARS)[number],
  )
    ? now.getFullYear()
    : REPORT_YEARS[0];
  const [year, setYear] = useState(String(defaultYear));
  const [format, setFormat] = useState<ReportFormat>("pdf");
  const [exporting, setExporting] = useState<ReportTypeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exportedBy = user?.name?.trim() || "Administrador";

  const recentPeriod = useMemo(() => previousCalendarMonth(), []);

  const recentReports = useMemo(
    () =>
      REPORT_TYPES.map((t) => ({
        type: t.id,
        title: `${t.title} — ${periodLabel(recentPeriod.year, recentPeriod.month)}`,
        meta: `Período fechado • ${formatGeneratedAt()}`,
        format: "PDF" as const,
      })),
    [recentPeriod.month, recentPeriod.year],
  );

  const exportReport = useCallback(
    async (type: ReportTypeId, opts?: { month?: number; year?: number; format?: ReportFormat }) => {
      const m = opts?.month ?? Number(month);
      const y = opts?.year ?? Number(year);
      const fmt = opts?.format ?? format;

      setExporting(type);
      setError(null);

      try {
        const params = new URLSearchParams({
          type,
          format: fmt,
          month: String(m),
          year: String(y),
          exportedBy,
        });

        const res = await fetch(`/api/relatorios/export?${params.toString()}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(json.error ?? "Não foi possível gerar o relatório.");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = reportFilename(type, fmt, y, m);
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Não foi possível gerar o relatório.",
        );
      } finally {
        setExporting(null);
      }
    },
    [month, year, format, exportedBy],
  );

  const busy = exporting !== null;

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {REPORT_TYPES.map((report) => {
          const Icon = REPORT_ICONS[report.id];
          const isExporting = exporting === report.id;

          return (
            <button
              key={report.id}
              type="button"
              disabled={busy}
              onClick={() => void exportReport(report.id)}
              className={cn(
                "flex gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 text-left shadow-sm transition",
                "hover:border-pika-primary/40 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pika-primary",
                busy && !isExporting && "opacity-60",
                isExporting && "ring-2 ring-pika-primary/30",
              )}
            >
              <div
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-sm",
                  report.iconTone,
                )}
              >
                {isExporting ? (
                  <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={Icon} className="h-6 w-6" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-pika-ink md:text-base">
                  {report.title}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-pika-muted md:text-sm">
                  {report.description}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-pika-primary">
                  Clique para exportar ({format.toUpperCase()})
                </p>
              </div>
            </button>
          );
        })}
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-page/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col flex-wrap gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Mês
              </span>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                disabled={busy}
                className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={String(m.value)}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Ano
              </span>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={busy}
                className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
              >
                {REPORT_YEARS.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0 sm:col-span-2 lg:col-span-1">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Formato
              </span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ReportFormat)}
                disabled={busy}
                className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
              >
                {REPORT_FORMAT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs text-pika-muted lg:max-w-xs lg:text-right">
            Período seleccionado:{" "}
            <span className="font-semibold text-pika-ink">
              {periodLabel(Number(year), Number(month))}
            </span>
          </p>
        </div>
      </div>

      {error ? (
        <p
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <section className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="border-b border-pika-border px-5 py-4">
          <h2 className="text-base font-semibold text-pika-ink">Relatórios Recentes</h2>
          <p className="text-xs text-pika-muted">
            Referência ao mês anterior ({monthLabel(recentPeriod.month)}{" "}
            {recentPeriod.year}) — use o formato seleccionado nos filtros
          </p>
        </div>
        <ul className="divide-y divide-pika-border">
          {recentReports.map((r, idx) => (
            <li
              key={r.type}
              className={cn(
                "flex items-center gap-4 px-5 py-4 transition-colors",
                idx % 2 === 1 ? "bg-pika-page/90" : "bg-pika-card hover:bg-pika-page/80",
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
                  {format.toUpperCase()}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void exportReport(r.type, {
                      month: recentPeriod.month,
                      year: recentPeriod.year,
                      format,
                    })
                  }
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-pika-border text-pika-muted transition hover:border-pika-primary hover:bg-pika-primary/5 hover:text-pika-primary disabled:opacity-50"
                  aria-label={`Descarregar ${r.title}`}
                >
                  {exporting === r.type ? (
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

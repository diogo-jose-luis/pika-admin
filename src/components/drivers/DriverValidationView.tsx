"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClock,
  faDownload,
  faMagnifyingGlass,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import {
  DRIVER_VALIDATION_ALL,
  type DriverServiceCategory,
  type DriverValidationRow,
  type ValidationStatus,
} from "@/lib/driver-validation-mock";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

const QUEUE_FILTER_OPTIONS = ["Todos", "Novos cadastros"] as const;

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, "ellipsis", total];
  }
  if (current >= total - 2) {
    return [1, "ellipsis", total - 2, total - 1, total];
  }
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function categoryPillClass(c: DriverServiceCategory): string {
  switch (c) {
    case "VIP":
      return "bg-teal-50 text-teal-800 ring-1 ring-teal-100";
    case "Pika Padrão":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100";
    case "SUV":
      return "bg-lime-50 text-lime-900 ring-1 ring-lime-200";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
  }
}

function statusPillClass(s: ValidationStatus): string {
  switch (s) {
    case "Em revisão":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    case "Pendente":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
  }
}

export function DriverValidationView() {
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] =
    useState<(typeof QUEUE_FILTER_OPTIONS)[number]>("Todos");
  const [page, setPage] = useState(1);

  const newRegistrationsCount = useMemo(
    () => DRIVER_VALIDATION_ALL.filter((r) => r.isNewRegistration).length,
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DRIVER_VALIDATION_ALL.filter((r) => {
      if (queueFilter === "Novos cadastros" && !r.isNewRegistration) {
        return false;
      }
      if (!q) return true;
      return (
        r.driverName.toLowerCase().includes(q) ||
        r.requestCode.toLowerCase().includes(q) ||
        r.id.includes(q)
      );
    });
  }, [search, queueFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, queueFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
  const showingTo = startIdx + pageRows.length;
  const pages = pageNumbers(page, pageCount);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">SLA Médio</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              12h 22m
            </p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              +2.1% vs ontem
            </span>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"
            aria-hidden
          >
            <FontAwesomeIcon icon={faClock} className="h-6 w-6" />
          </div>
        </article>

        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">Aprovações Hoje</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              50
            </p>
            <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
              +12% vs ontem
            </span>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
            aria-hidden
          >
            <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6" />
          </div>
        </article>

        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">Atrasados (&gt;48h)</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              2
            </p>
            <p className="mt-2 text-xs font-semibold text-pika-danger">Ação imediata</p>
          </div>
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"
            aria-hidden
          >
            <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6" />
          </div>
        </article>
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-card p-4 shadow-sm md:p-6">
        <div className="mb-4 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por passageiro, motorista ou ID..."
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative min-w-[12rem]">
              <select
                value={queueFilter}
                onChange={(e) =>
                  setQueueFilter(
                    e.target.value as (typeof QUEUE_FILTER_OPTIONS)[number],
                  )
                }
                className="w-full appearance-none rounded-xl border-2 border-pika-primary bg-pika-card py-2.5 pl-3 pr-10 text-sm font-semibold text-pika-primary outline-none ring-pika-primary/20 transition hover:bg-pika-primary/5 focus:ring-2"
                aria-label="Fila de validação"
              >
                <option value="Todos">Todos</option>
                <option value="Novos cadastros">
                  Novos cadastros {newRegistrationsCount}
                </option>
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-pika-primary">
                <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
              </span>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white"
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
          <table className="min-w-[920px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                <th className="whitespace-nowrap px-4 py-3">Solicitação</th>
                <th className="whitespace-nowrap px-4 py-3">Motorista</th>
                <th className="whitespace-nowrap px-4 py-3">Categoria</th>
                <th className="whitespace-nowrap px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3">SLA — Tempo na fila</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <ValidationTableRow key={row.id} row={row} highlight={idx === 1} />
              ))}
            </tbody>
          </table>
        </div>

        {pageRows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-pika-muted">
            Nenhuma solicitação encontrada com estes critérios.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 border-t border-pika-border pt-4 text-sm text-pika-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {showingFrom}-{showingTo} de {filtered.length} solicitações
          </p>
          <div className="flex flex-wrap items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-pika-border px-3 py-1.5 font-medium text-pika-ink transition",
                page <= 1
                  ? "cursor-not-allowed opacity-40"
                  : "hover:border-pika-primary hover:text-pika-primary",
              )}
            >
              <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
              Anterior
            </button>
            <div className="mx-1 flex flex-wrap items-center gap-1">
              {pages.map((p, i) =>
                p === "ellipsis" ? (
                  <span
                    key={`e-${i}`}
                    className="px-2 py-1 text-pika-muted"
                    aria-hidden
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "min-w-[2.25rem] rounded-lg px-2 py-1.5 text-center font-semibold transition",
                      p === page
                        ? "bg-pika-primary text-white shadow-sm"
                        : "text-pika-ink hover:bg-pika-page",
                    )}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              disabled={page >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-pika-border px-3 py-1.5 font-medium text-pika-ink transition",
                page >= pageCount
                  ? "cursor-not-allowed opacity-40"
                  : "hover:border-pika-primary hover:text-pika-primary",
              )}
            >
              Próximo
              <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ValidationTableRow({
  row,
  highlight,
}: {
  row: DriverValidationRow;
  highlight: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-pika-border transition-colors last:border-b-0",
        highlight ? "bg-pika-page/90" : "bg-pika-card hover:bg-pika-page/80",
      )}
    >
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-pika-ink">{row.requestCode}</span>
          <span className="text-xs text-pika-muted">{row.requestAtLabel}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-pika-ink">{row.driverName}</span>
          <span className="text-xs text-pika-muted">{row.driverHint}</span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
            categoryPillClass(row.category),
          )}
        >
          {row.category}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
            statusPillClass(row.status),
          )}
        >
          {row.status}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
          {row.slaQueueLabel}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-xl bg-pika-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
        >
          Revisar
        </button>
      </td>
    </tr>
  );
}

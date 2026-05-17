"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircle,
  faDownload,
  faEye,
  faLocationDot,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import {
  rideMatchesDateRange,
  rideMatchesSearch,
  type RideRow,
  type RideStatus,
} from "@/lib/ride-history";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

const STATUS_FILTER_OPTIONS = ["Todos", "Em andamento", "Concluída", "Pendente", "Cancelada"] as const;

function statusPillClass(status: RideStatus) {
  const map: Record<RideStatus, string> = {
    "Em andamento": "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    Concluída: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    Pendente: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    Cancelada: "bg-red-50 text-red-700 ring-1 ring-red-100",
  };
  return map[status];
}

function StatusPill({ status }: { status: RideStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusPillClass(status),
      )}
    >
      {status}
    </span>
  );
}

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

export function RideHistoryView() {
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTER_OPTIONS)[number]>("Todos");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const loadRides = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/corridas/historico", {
        cache: "no-store",
      });
      const data = (await res.json()) as { rows?: RideRow[]; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar corridas.");
      }

      setRides(data.rows ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar corridas.",
      );
      setRides([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRides();
  }, [loadRides]);

  const filtered = useMemo(() => {
    return rides.filter((r) => {
      const matchStatus =
        statusFilter === "Todos" || r.status === statusFilter;
      if (!matchStatus) return false;
      if (!rideMatchesDateRange(r, dateFrom, dateTo)) return false;
      return rideMatchesSearch(r, search);
    });
  }, [rides, search, statusFilter, dateFrom, dateTo]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
  const showingTo = startIdx + pageRows.length;
  const pages = pageNumbers(page, pageCount);

  return (
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
            placeholder="Buscar por ID, passageiro, motorista, trajeto, valor, status, data..."
            className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              De
            </span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label="Data inicial"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Até
            </span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label="Data final"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as (typeof STATUS_FILTER_OPTIONS)[number])
            }
            className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <RefreshDataButton
            loading={refreshing}
            onClick={() => void loadRides(true)}
          />
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
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
              <th className="whitespace-nowrap px-4 py-3">ID</th>
              <th className="whitespace-nowrap px-4 py-3">Passageiro</th>
              <th className="whitespace-nowrap px-4 py-3">Motorista</th>
              <th className="min-w-[220px] px-4 py-3">Trajeto</th>
              <th className="whitespace-nowrap px-4 py-3">Valor</th>
              <th className="whitespace-nowrap px-4 py-3">Distância</th>
              <th className="whitespace-nowrap px-4 py-3">Duração</th>
              <th className="whitespace-nowrap px-4 py-3">Status</th>
              <th className="whitespace-nowrap px-4 py-3">Data</th>
              <th className="whitespace-nowrap px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-pika-border">
                    {Array.from({ length: 10 }, (_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-pika-page" />
                      </td>
                    ))}
                  </tr>
                ))
              : pageRows.map((row) => (
                  <RideTableRow key={`${row.id}-${row.dateLabel}`} row={row} />
                ))}
          </tbody>
        </table>
      </div>

      {loadError ? (
        <p className="mt-6 text-center text-sm text-red-600">{loadError}</p>
      ) : null}

      {!loading && !loadError && pageRows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-pika-muted">
          Nenhuma corrida encontrada com estes critérios.
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-pika-border pt-4 text-sm text-pika-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          Mostrando {showingFrom}-{showingTo} de {filtered.length} Corridas
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
  );
}

function RideTableRow({ row }: { row: RideRow }) {
  return (
    <tr className="border-b border-pika-border bg-pika-card transition-colors last:border-b-0 hover:bg-pika-page/80">
      <td className="whitespace-nowrap px-4 py-3 font-medium text-pika-ink">
        #{row.id}
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-semibold text-pika-ink">
        {row.passenger}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">{row.driver}</td>
      <td className="px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5 text-xs">
          <span className="inline-flex items-start gap-2 text-pika-ink">
            <FontAwesomeIcon
              icon={faCircle}
              className="mt-0.5 h-2 w-2 shrink-0 text-pika-primary"
            />
            <span className="leading-snug">{row.origin}</span>
          </span>
          <span className="inline-flex items-start gap-2 text-pika-ink">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="mt-0.5 h-3 w-3 shrink-0 text-pika-primary"
            />
            <span className="leading-snug">{row.destination}</span>
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-semibold text-pika-ink">
        {row.valueLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">
        {row.distanceLabel || "\u00a0"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">
        {row.durationLabel || "\u00a0"}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <StatusPill status={row.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">{row.dateLabel}</td>
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
          aria-label={`Ver corrida #${row.id}`}
        >
          <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

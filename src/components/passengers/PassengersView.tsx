"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCar,
  faChevronLeft,
  faChevronRight,
  faDollarSign,
  faEllipsisVertical,
  faEye,
  faMagnifyingGlass,
  faStar,
  faTriangleExclamation,
  faUserPlus,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import {
  PASSENGERS_ALL,
  PASSENGERS_SUMMARY,
  type PassengerRow,
  type PassengerStatus,
} from "@/lib/passengers-mock";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 30;

const STATUS_OPTIONS = ["Todos", "Ativo", "Inativo"] as const;

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

function StatusPill({ status }: { status: PassengerStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "Ativo"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-1 ring-red-100",
      )}
    >
      {status}
    </span>
  );
}

export function PassengersView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("Todos");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PASSENGERS_ALL.filter((p) => {
      if (statusFilter === "Ativo" && p.status !== "Ativo") return false;
      if (statusFilter === "Inativo" && p.status !== "Inativo") return false;
      if (!q) return true;
      const digits = q.replace(/\D/g, "");
      return (
        p.name.toLowerCase().includes(q) ||
        p.passengerId.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (digits.length > 0 && p.phone.replace(/\D/g, "").includes(digits))
      );
    });
  }, [search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
  const showingTo = startIdx + pageRows.length;
  const pages = pageNumbers(page, pageCount);
  const totalLabel = filtered.length.toLocaleString("pt-AO");

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Total Passageiros</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {PASSENGERS_SUMMARY.total.toLocaleString("pt-AO")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Novos (30 dias)</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {PASSENGERS_SUMMARY.novos30d.toLocaleString("pt-AO")}
              </p>
              <p className="mt-2 text-xs font-medium">
                <span className="font-semibold text-pika-success">
                  {PASSENGERS_SUMMARY.novosTrend}
                </span>
                <span className="text-pika-muted"> vs ontem</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FontAwesomeIcon icon={faUserPlus} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Avaliação Média</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {PASSENGERS_SUMMARY.avgRating}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FontAwesomeIcon icon={faStar} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Problemas Abertos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {PASSENGERS_SUMMARY.problemasAbertos}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-pika-border bg-slate-100/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por passageiro, motorista ou ID..."
              className="w-full rounded-xl border border-pika-border bg-white py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])
              }
              className="rounded-xl border border-pika-border bg-white px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-pika-border bg-white p-4 shadow-sm md:p-6">
        <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
          <table className="min-w-[1080px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                <th className="whitespace-nowrap px-4 py-3">Passageiro</th>
                <th className="min-w-[200px] px-4 py-3">Contato</th>
                <th className="whitespace-nowrap px-4 py-3">Corridas</th>
                <th className="whitespace-nowrap px-4 py-3">Total Gasto</th>
                <th className="whitespace-nowrap px-4 py-3">Avaliação</th>
                <th className="whitespace-nowrap px-4 py-3">Última Corrida</th>
                <th className="min-w-[140px] px-4 py-3">Status</th>
                <th className="whitespace-nowrap px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, idx) => (
                <PassengerTableRow
                  key={row.passengerId}
                  row={row}
                  zebra={(startIdx + idx) % 2 === 1}
                />
              ))}
            </tbody>
          </table>
        </div>

        {pageRows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-pika-muted">
            Nenhum passageiro encontrado com estes critérios.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 border-t border-pika-border pt-4 text-sm text-pika-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            Mostrando {showingFrom}-{showingTo} de {totalLabel} Passageiros
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
                  <span key={`e-${i}`} className="px-2 py-1 text-pika-muted" aria-hidden>
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

function PassengerTableRow({
  row,
  zebra,
}: {
  row: PassengerRow;
  zebra: boolean;
}) {
  return (
    <tr
      className={cn(
        "border-b border-pika-border transition-colors last:border-b-0",
        zebra ? "bg-slate-50/90" : "bg-white",
        "hover:bg-slate-100/80",
      )}
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              row.avatarClass,
            )}
          >
            {row.initials}
          </div>
          <div className="min-w-0">
            <p className="truncate font-bold text-pika-ink">{row.name}</p>
            <p className="truncate text-xs font-medium text-pika-muted">
              {row.passengerId}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <p className="break-all text-pika-ink">{row.email}</p>
        <p className="mt-0.5 text-pika-muted">{row.phone}</p>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-2 font-medium text-pika-ink">
          <FontAwesomeIcon icon={faCar} className="h-4 w-4 text-pika-primary" />
          {row.rides}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-2 font-semibold text-pika-ink">
          <FontAwesomeIcon icon={faDollarSign} className="h-4 w-4 text-pika-success" />
          {row.totalSpentLabel}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-1.5 font-medium text-pika-ink">
          <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5 text-amber-500" />
          {row.rating}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-2 text-pika-muted">
          <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 text-pika-primary" />
          {row.lastRideLabel}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={row.status} />
          {row.problemCount > 0 ? (
            <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
              {row.problemCount} Problemas
            </span>
          ) : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="inline-flex items-center justify-center gap-1">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
            aria-label={`Ver ${row.name}`}
          >
            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
            aria-label="Mais opções"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

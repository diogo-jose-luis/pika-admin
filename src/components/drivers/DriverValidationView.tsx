"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClock,
  faDownload,
  faMagnifyingGlass,
  faPlus,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { CreateValidationModal } from "@/components/drivers/CreateValidationModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { cn } from "@/lib/cn";
import {
  VALIDATION_STATUS_OPTIONS,
  normalizeValidacaoRows,
  requestAtToMs,
  validationMatchesSearch,
  type DriverSelectOption,
  type ValidacaoMotoristaRow,
  type ValidacaoMotoristaSummary,
} from "@/lib/validacao-motorista";

const PAGE_SIZE = 12;
const QUEUE_FILTER_OPTIONS = ["Todos", "Novos cadastros"] as const;

const EMPTY_SUMMARY: ValidacaoMotoristaSummary = {
  slaMedioLabel: "—",
  aprovacoesHoje: 0,
  atrasados48h: 0,
};

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

function statusPillClass(status: string): string {
  switch (status) {
    case "Aprovado":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "Rejeitado":
      return "bg-red-50 text-red-700 ring-1 ring-red-100";
    case "Em revisão":
      return "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
    case "Reenvio solicitado":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
    case "Pendente":
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
  }
}

function categoryPillClass(): string {
  return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
}

export function DriverValidationView() {
  const [rows, setRows] = useState<ValidacaoMotoristaRow[]>([]);
  const [summary, setSummary] = useState<ValidacaoMotoristaSummary>(EMPTY_SUMMARY);
  const [drivers, setDrivers] = useState<DriverSelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [queueFilter, setQueueFilter] =
    useState<(typeof QUEUE_FILTER_OPTIONS)[number]>("Todos");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("0");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createMotoristaId, setCreateMotoristaId] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/validacao-motoristas", { cache: "no-store" });
      const data = (await res.json()) as {
        rows?: ValidacaoMotoristaRow[];
        summary?: ValidacaoMotoristaSummary;
        drivers?: DriverSelectOption[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar validações.");
      }

      setRows(normalizeValidacaoRows(data.rows ?? []));
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setDrivers(data.drivers ?? []);
      setSelectedIds(new Set());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar validações.",
      );
      setRows([]);
      setSummary(EMPTY_SUMMARY);
      setDrivers([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const newRegistrationsCount = useMemo(
    () => rows.filter((r) => r.isNewRegistration).length,
    [rows],
  );

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (queueFilter === "Novos cadastros" && !r.isNewRegistration) {
        return false;
      }
      return validationMatchesSearch(r, search);
    });
  }, [rows, search, queueFilter]);

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

  const pageIds = pageRows.map((r) => r.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkStatus = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/validacao-motoristas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          status: Number(bulkStatus),
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar as solicitações.");
      }

      await loadData(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar as solicitações.",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const openCreateModal = () => {
    setCreateMotoristaId(drivers[0]?.id ?? "");
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!createMotoristaId) return;
    setCreateSaving(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/validacao-motoristas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motoristaId: createMotoristaId }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível criar a solicitação.");
      }

      setCreateOpen(false);
      setCreateMotoristaId("");
      await loadData(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Não foi possível criar a solicitação.",
      );
    } finally {
      setCreateSaving(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">SLA Médio</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              {loading ? "…" : summary.slaMedioLabel}
            </p>
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
              {loading ? "…" : summary.aprovacoesHoje}
            </p>
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
              {loading ? "…" : summary.atrasados48h}
            </p>
            {summary.atrasados48h > 0 ? (
              <p className="mt-2 text-xs font-semibold text-pika-danger">Ação imediata</p>
            ) : null}
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
              placeholder="Buscar por motorista, veículo ou ID..."
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <RefreshDataButton loading={refreshing} onClick={() => void loadData(true)} />
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
              onClick={openCreateModal}
              disabled={loading || drivers.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
              Nova solicitação
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white"
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {loadError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </p>
        ) : null}

        {selectedIds.size > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-pika-primary/30 bg-pika-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-pika-ink">
              {selectedIds.size} solicitação(ões) selecionada(s)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[11rem]">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  disabled={bulkSaving}
                  className="w-full appearance-none rounded-xl border border-pika-border bg-pika-card py-2 pl-3 pr-9 text-sm font-medium text-pika-ink outline-none focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/20 disabled:opacity-50"
                  aria-label="Novo estado"
                >
                  {VALIDATION_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-pika-muted">
                  <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
                </span>
              </div>
              <button
                type="button"
                onClick={() => void applyBulkStatus()}
                disabled={bulkSaving}
                className="inline-flex items-center justify-center rounded-xl bg-pika-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {bulkSaving ? "A aplicar…" : "Aplicar estado"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkSaving}
                className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
              >
                Limpar
              </button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-2 py-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-lg bg-pika-page"
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAllPage}
                      aria-label="Selecionar todas nesta página"
                      className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
                    />
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">Solicitação</th>
                  <th className="whitespace-nowrap px-4 py-3">Motorista</th>
                  <th className="whitespace-nowrap px-4 py-3">Veículo</th>
                  <th className="whitespace-nowrap px-4 py-3">Status</th>
                  <th className="whitespace-nowrap px-4 py-3">SLA — Tempo na fila</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <ValidationTableRow
                    key={row.id}
                    row={row}
                    selected={selectedIds.has(row.id)}
                    onToggle={() => toggleRow(row.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && pageRows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-pika-muted">
            Nenhuma solicitação encontrada com estes critérios.
          </p>
        ) : null}

        {!loading && filtered.length > 0 ? (
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
        ) : null}
      </div>

      <CreateValidationModal
        open={createOpen}
        drivers={drivers}
        motoristaId={createMotoristaId}
        saving={createSaving}
        onMotoristaIdChange={setCreateMotoristaId}
        onClose={() => {
          if (!createSaving) {
            setCreateOpen(false);
            setCreateMotoristaId("");
          }
        }}
        onSubmit={() => void submitCreate()}
      />
    </div>
  );
}

function ValidationTableRow({
  row,
  selected,
  onToggle,
}: {
  row: ValidacaoMotoristaRow;
  selected: boolean;
  onToggle: () => void;
}) {
  const requestMs = requestAtToMs(row.requestAt);
  const isDelayed =
    requestMs != null &&
    Date.now() - requestMs > 48 * 3600 * 1000 &&
    (row.statusCode === 0 || row.statusCode === 3);

  return (
    <tr
      className={cn(
        "border-b border-pika-border transition-colors last:border-b-0",
        selected ? "bg-pika-primary/5" : "bg-pika-card hover:bg-pika-page/80",
      )}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Selecionar ${row.requestCode}`}
          className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
        />
      </td>
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
            categoryPillClass(),
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
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
            isDelayed
              ? "bg-red-50 text-red-700 ring-red-100"
              : "bg-emerald-50 text-emerald-800 ring-emerald-100",
          )}
        >
          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
          {row.slaQueueLabel}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <Link
          href={`/validacao-motoristas/${row.id}`}
          className="inline-flex items-center justify-center rounded-xl bg-pika-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
        >
          Revisar
        </Link>
      </td>
    </tr>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClock,
  faEye,
  faHourglassHalf,
  faMagnifyingGlass,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { AlterarDadosDetailsModal } from "@/components/alterar-dados/AlterarDadosDetailsModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/cn";
import {
  ALTERAR_DADOS_STATUS_OPTIONS,
  alterarDadosMatchesSearch,
  hydrateAlterarDadosRow,
  type AlterarDadosDetail,
  type AlterarDadosRow,
  type AlterarDadosSummary,
} from "@/lib/alterar-dados";

const PAGE_SIZE = 12;

const EMPTY_SUMMARY: AlterarDadosSummary = {
  pendentes: 0,
  aprovadas: 0,
  rejeitadas: 0,
};

type StatusFilter = "all" | "0" | "1" | "2";
type ConfirmAction = { estado: 1 | 2; ids: string[] };

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
    default:
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
  }
}

export function AlterarDadosView() {
  const [rows, setRows] = useState<AlterarDadosRow[]>([]);
  const [summary, setSummary] = useState<AlterarDadosSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("0");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [detail, setDetail] = useState<AlterarDadosDetail | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/alterar-dados", { cache: "no-store" });
      const data = (await res.json()) as {
        rows?: AlterarDadosRow[];
        summary?: AlterarDadosSummary;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar solicitações.");
      }
      setRows((data.rows ?? []).map(hydrateAlterarDadosRow));
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setSelectedIds(new Set());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar solicitações.",
      );
      setRows([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.statusCode !== Number(statusFilter)) {
        return false;
      }
      return alterarDadosMatchesSearch(r, search);
    });
  }, [rows, search, statusFilter]);

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

  const openDetail = async (id: string) => {
    setDetailLoadingId(id);
    setLoadError(null);
    try {
      const res = await fetch(`/api/alterar-dados/${id}`, { cache: "no-store" });
      const data = (await res.json()) as {
        detail?: AlterarDadosDetail;
        error?: string;
      };
      if (!res.ok || !data.detail) {
        throw new Error(data.error ?? "Não foi possível abrir a solicitação.");
      }
      setDetail(data.detail);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Não foi possível abrir a solicitação.",
      );
    } finally {
      setDetailLoadingId(null);
    }
  };

  const applyDecision = async (estado: 1 | 2, ids: string[]) => {
    if (ids.length === 0) return;
    setBusy(true);
    setLoadError(null);
    try {
      const endpoint =
        ids.length === 1 ? `/api/alterar-dados/${ids[0]}` : "/api/alterar-dados";
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          ids.length === 1 ? { estado } : { ids, estado },
        ),
      });
      const data = (await res.json()) as {
        error?: string;
        failures?: Array<{ id: string; error: string }>;
        detail?: AlterarDadosDetail;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar as solicitações.");
      }
      if (data.failures && data.failures.length > 0) {
        setLoadError(
          `${data.failures.length} solicitação(ões) falharam: ${data.failures[0]?.error}`,
        );
      }
      setConfirm(null);
      setSelectedIds(new Set());
      if (data.detail) setDetail(data.detail);
      else setDetail(null);
      await loadData(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar as solicitações.",
      );
    } finally {
      setBusy(false);
    }
  };

  const selectedCount = selectedIds.size;
  const confirmIsApprove = confirm?.estado === 1;

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">Pendentes</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              {loading ? "…" : summary.pendentes}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <FontAwesomeIcon icon={faHourglassHalf} className="h-6 w-6" />
          </div>
        </article>
        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">Aprovadas</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              {loading ? "…" : summary.aprovadas}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <FontAwesomeIcon icon={faCircleCheck} className="h-6 w-6" />
          </div>
        </article>
        <article className="flex items-start justify-between gap-4 rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="min-w-0">
            <p className="text-sm font-medium text-pika-muted">Rejeitadas</p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-pika-ink md:text-[1.65rem]">
              {loading ? "…" : summary.rejeitadas}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
            <FontAwesomeIcon icon={faXmark} className="h-6 w-6" />
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
              placeholder="Buscar por nome, telefone, UID ou IBAN..."
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <RefreshDataButton loading={refreshing} onClick={() => void loadData(true)} />
            <div className="relative min-w-[12rem]">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full appearance-none rounded-xl border-2 border-pika-primary bg-pika-card py-2.5 pl-3 pr-10 text-sm font-semibold text-pika-primary outline-none ring-pika-primary/20 transition hover:bg-pika-primary/5 focus:ring-2"
                aria-label="Filtrar por estado"
              >
                <option value="all">Todos</option>
                {ALTERAR_DADOS_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                    {opt.value === 0 ? ` (${summary.pendentes})` : ""}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-pika-primary">
                <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>

        {loadError ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </p>
        ) : null}

        {selectedCount > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-pika-primary/30 bg-pika-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-pika-ink">
              {selectedCount} solicitação(ões) selecionada(s)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirm({ estado: 1, ids: [...selectedIds] })}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => setConfirm({ estado: 2, ids: [...selectedIds] })}
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-pika-card px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
                Rejeitar
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={busy}
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
              <div key={i} className="h-12 animate-pulse rounded-lg bg-pika-page" />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto scroll-pika rounded-xl border border-pika-border lg:block">
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
                    <th className="whitespace-nowrap px-4 py-3">Utilizador</th>
                    <th className="whitespace-nowrap px-4 py-3">Contacto</th>
                    <th className="whitespace-nowrap px-4 py-3">Empresa</th>
                    <th className="whitespace-nowrap px-4 py-3">Pedido</th>
                    <th className="whitespace-nowrap px-4 py-3">Estado</th>
                    <th className="whitespace-nowrap px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <RequestTableRow
                      key={row.id}
                      row={row}
                      selected={selectedIds.has(row.id)}
                      opening={detailLoadingId === row.id}
                      onToggle={() => toggleRow(row.id)}
                      onOpen={() => void openDetail(row.id)}
                      onApprove={() => setConfirm({ estado: 1, ids: [row.id] })}
                      onReject={() => setConfirm({ estado: 2, ids: [row.id] })}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 lg:hidden">
              {pageRows.map((row) => (
                <RequestCard
                  key={row.id}
                  row={row}
                  selected={selectedIds.has(row.id)}
                  opening={detailLoadingId === row.id}
                  onToggle={() => toggleRow(row.id)}
                  onOpen={() => void openDetail(row.id)}
                  onApprove={() => setConfirm({ estado: 1, ids: [row.id] })}
                  onReject={() => setConfirm({ estado: 2, ids: [row.id] })}
                />
              ))}
            </div>
          </>
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
                    <span key={`e-${i}`} className="px-2 py-1 text-pika-muted">
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

      {detail ? (
        <AlterarDadosDetailsModal
          detail={detail}
          busy={busy}
          onClose={() => {
            if (!busy) setDetail(null);
          }}
          onApprove={() => setConfirm({ estado: 1, ids: [detail.id] })}
          onReject={() => setConfirm({ estado: 2, ids: [detail.id] })}
        />
      ) : null}

      <DeleteConfirmModal
        open={confirm !== null}
        onCancel={() => {
          if (!busy) setConfirm(null);
        }}
        onConfirm={() => {
          if (confirm) void applyDecision(confirm.estado, confirm.ids);
        }}
        variant={confirmIsApprove ? "success" : "danger"}
        title={confirmIsApprove ? "Aprovar alterações?" : "Rejeitar alterações?"}
        description={
          confirmIsApprove
            ? "Os dados desta solicitação serão copiados para o perfil do utilizador em users."
            : "A solicitação será marcada como rejeitada. Os dados atuais em users não são alterados."
        }
        entityLabel={
          confirm
            ? confirm.ids.length === 1
              ? rows.find((r) => r.id === confirm.ids[0])?.nome
              : `${confirm.ids.length} solicitações`
            : undefined
        }
        confirmLabel={confirmIsApprove ? "Aprovar" : "Rejeitar"}
        busy={busy}
        busyLabel="A aplicar…"
      />
    </div>
  );
}

function RequestTableRow({
  row,
  selected,
  opening,
  onToggle,
  onOpen,
  onApprove,
  onReject,
}: {
  row: AlterarDadosRow;
  selected: boolean;
  opening: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pending = row.statusCode === 0;
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
          aria-label={`Selecionar ${row.nome}`}
          className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-pika-ink">{row.nome}</span>
          <span className="text-xs text-pika-muted">
            {row.userFound ? row.uid || "—" : "UID não encontrado em users"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-pika-ink">{row.telefone}</span>
          <span className="text-xs text-pika-muted">{row.iban}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-pika-ink">{row.nomeEmpresa}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-pika-muted">
          <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
          {row.createdAtLabel}
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
      <td className="whitespace-nowrap px-4 py-3 text-right">
        <div className="inline-flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onOpen}
            disabled={opening}
            className="inline-flex items-center gap-1.5 rounded-xl border border-pika-border px-3 py-2 text-xs font-semibold text-pika-ink transition hover:border-pika-primary hover:text-pika-primary disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
            {opening ? "…" : "Ver"}
          </button>
          {pending ? (
            <>
              <button
                type="button"
                onClick={onApprove}
                disabled={!row.userFound}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Aprovar
              </button>
              <button
                type="button"
                onClick={onReject}
                className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              >
                Rejeitar
              </button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

function RequestCard({
  row,
  selected,
  opening,
  onToggle,
  onOpen,
  onApprove,
  onReject,
}: {
  row: AlterarDadosRow;
  selected: boolean;
  opening: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const pending = row.statusCode === 0;
  return (
    <article
      className={cn(
        "rounded-2xl border bg-pika-card p-4 shadow-sm",
        selected ? "border-pika-primary ring-2 ring-pika-primary/20" : "border-pika-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            aria-label={`Selecionar ${row.nome}`}
            className="mt-1 h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
          />
          <div>
            <p className="font-semibold text-pika-ink">{row.nome}</p>
            <p className="text-xs text-pika-muted">{row.createdAtLabel}</p>
          </div>
        </label>
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
            statusPillClass(row.status),
          )}
        >
          {row.status}
        </span>
      </div>
      <p className="mt-3 text-sm text-pika-ink">{row.telefone}</p>
      <p className="text-xs text-pika-muted">{row.nomeEmpresa}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onOpen}
          disabled={opening}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pika-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:opacity-50"
        >
          {opening ? "A abrir…" : "Revisar"}
        </button>
        {pending ? (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={!row.userFound}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              Aprovar
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex items-center rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600"
            >
              Rejeitar
            </button>
          </>
        ) : null}
      </div>
    </article>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PassengerDetailsModal } from "@/components/passengers/PassengerDetailsModal";
import { PushNotificationOffCanvas } from "@/components/notifications/PushNotificationOffCanvas";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCar,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faDollarSign,
  faEllipsisVertical,
  faEye,
  faList,
  faMagnifyingGlass,
  faPaperPlane,
  faStar,
  faTableCells,
  faTriangleExclamation,
  faUserPlus,
  faUsers,
  faUserTag,
} from "@fortawesome/free-solid-svg-icons";
import {
  passengerMatchesSearch,
  type PassengerRow,
  type PassengerStatus,
  type PassengersSummary,
} from "@/lib/passengers";
import { canManageAdminUsers } from "@/lib/permissions";
import { USER_ESTADO_BULK_OPTIONS } from "@/lib/users-estado";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 30;

const STATUS_OPTIONS = ["Todos", "Ativo", "Inativo"] as const;

type ViewMode = "cards" | "table";

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

const EMPTY_SUMMARY: PassengersSummary = {
  total: 0,
  novos30d: 0,
  avgRating: "—",
  problemasAbertos: 0,
};

export function PassengersView() {
  const { user } = useAuth();
  const isSuperAdmin = user ? canManageAdminUsers(user.nivel) : false;
  const [passengers, setPassengers] = useState<PassengerRow[]>([]);
  const [summary, setSummary] = useState<PassengersSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_OPTIONS)[number]>("Todos");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [detailPassenger, setDetailPassenger] = useState<PassengerRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PassengerRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState("1");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [pushOpen, setPushOpen] = useState(false);

  const loadPassengers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/passageiros", { cache: "no-store" });
      const data = (await res.json()) as {
        passengers?: PassengerRow[];
        summary?: PassengersSummary;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar passageiros.");
      }

      setPassengers(data.passengers ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setSelectedIds(new Set());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar passageiros.",
      );
      setPassengers([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPassengers();
  }, [loadPassengers]);

  const filtered = useMemo(() => {
    return passengers.filter((p) => {
      if (statusFilter === "Ativo" && p.status !== "Ativo") return false;
      if (statusFilter === "Inativo" && p.status !== "Inativo") return false;
      return passengerMatchesSearch(p, search);
    });
  }, [passengers, search, statusFilter]);

  const confirmDeletePassenger = useCallback(async () => {
    if (!deleteTarget || deleteBusy || !isSuperAdmin) return;

    setDeleteBusy(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/passageiros", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [deleteTarget.userDocId] }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível eliminar o passageiro.",
        );
      }

      const id = deleteTarget.userDocId;
      setPassengers((prev) => prev.filter((p) => p.userDocId !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDetailPassenger((current) =>
        current?.userDocId === id ? null : current,
      );
      setDeleteTarget(null);
      await loadPassengers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível eliminar o passageiro.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, deleteBusy, isSuperAdmin, loadPassengers]);

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

  const pageIds = pageRows.map((r) => r.userDocId);
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

  const toggleRow = (userDocId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userDocId)) next.delete(userDocId);
      else next.add(userDocId);
      return next;
    });
  };

  const applyBulkEstado = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/passageiros/estado", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          estado: Number(bulkEstado),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar o estado.");
      }
      await loadPassengers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Não foi possível atualizar o estado.",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkToDriver = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/users/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          isDriver: 1,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível converter para motorista.",
        );
      }
      await loadPassengers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível converter para motorista.",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Total Passageiros</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.total.toLocaleString("pt-AO")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <FontAwesomeIcon icon={faUsers} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Novos (30 dias)</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.novos30d.toLocaleString("pt-AO")}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FontAwesomeIcon icon={faUserPlus} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Avaliação Média</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.avgRating}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FontAwesomeIcon icon={faStar} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Problemas Abertos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.problemasAbertos}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-page/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone, ID, corridas, gastos, avaliação..."
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])
              }
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <RefreshDataButton
              loading={refreshing}
              onClick={() => void loadPassengers(true)}
            />
            <button
              type="button"
              onClick={() => setPushOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
            >
              <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4" />
              Push notification
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-pika-border bg-pika-card p-4 shadow-sm md:p-6">
        {selectedIds.size > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-pika-primary/30 bg-pika-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-pika-ink">
              {selectedIds.size} passageiro(s) selecionado(s)
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[10rem]">
                <select
                  value={bulkEstado}
                  onChange={(e) => setBulkEstado(e.target.value)}
                  disabled={bulkSaving}
                  className="w-full appearance-none rounded-xl border border-pika-border bg-pika-card py-2 pl-3 pr-9 text-sm font-medium text-pika-ink outline-none focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/20 disabled:opacity-50"
                  aria-label="Novo estado"
                >
                  {USER_ESTADO_BULK_OPTIONS.map((opt) => (
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
                onClick={() => void applyBulkToDriver()}
                disabled={bulkSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-pika-card px-4 py-2 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faUserTag} className="h-3.5 w-3.5" />
                {bulkSaving ? "A converter…" : "Converter para motorista"}
              </button>
              <button
                type="button"
                onClick={() => void applyBulkEstado()}
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

        {viewMode === "table" ? (
        <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
          <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                    disabled={loading || pageRows.length === 0}
                    aria-label="Selecionar todos nesta página"
                    className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
                  />
                </th>
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
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="border-b border-pika-border">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="h-10 animate-pulse rounded-lg bg-pika-page" />
                      </td>
                    </tr>
                  ))
                : null}
              {!loading
                ? pageRows.map((row, idx) => (
                    <PassengerTableRow
                      key={row.passengerId}
                      row={row}
                      zebra={(startIdx + idx) % 2 === 1}
                      selected={selectedIds.has(row.userDocId)}
                      onToggleSelect={() => toggleRow(row.userDocId)}
                      onViewDetails={() => setDetailPassenger(row)}
                      onDelete={
                        isSuperAdmin ? () => setDeleteTarget(row) : undefined
                      }
                    />
                  ))
                : null}
            </tbody>
          </table>
        </div>
        ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`sk-card-${i}`}
                  className="h-60 animate-pulse rounded-2xl border border-pika-border bg-pika-page"
                />
              ))
            : pageRows.map((row, idx) => (
                <PassengerCard
                  key={row.passengerId}
                  row={row}
                  zebra={(startIdx + idx) % 2 === 1}
                  selected={selectedIds.has(row.userDocId)}
                  onToggleSelect={() => toggleRow(row.userDocId)}
                  onViewDetails={() => setDetailPassenger(row)}
                  onDelete={
                    isSuperAdmin ? () => setDeleteTarget(row) : undefined
                  }
                />
              ))}
        </div>
        )}

        {loadError ? (
          <p className="mt-6 text-center text-sm text-red-600">{loadError}</p>
        ) : null}

        {!loading && !loadError && pageRows.length === 0 ? (
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

      {detailPassenger ? (
        <PassengerDetailsModal
          passenger={detailPassenger}
          onClose={() => setDetailPassenger(null)}
        />
      ) : null}

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onConfirm={() => void confirmDeletePassenger()}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
        title="Eliminar passageiro?"
        entityLabel={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.passengerId})`
            : undefined
        }
        description="Tem certeza de que deseja eliminar este passageiro? Esta ação é irreversível e remove o registo do utilizador."
        confirmLabel="Eliminar passageiro"
        busy={deleteBusy}
      />

      <PushNotificationOffCanvas
        open={pushOpen}
        onClose={() => setPushOpen(false)}
        selectedIds={[...selectedIds]}
        defaultAudience="passageiros"
        contextLabel="passageiro"
      />
    </div>
  );
}

function ViewModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  const options: { mode: ViewMode; label: string; icon: typeof faTableCells }[] = [
    { mode: "cards", label: "Cards", icon: faTableCells },
    { mode: "table", label: "Tabela", icon: faList },
  ];

  return (
    <div
      role="group"
      aria-label="Alternar visualização"
      className="inline-flex items-center rounded-xl border border-pika-border bg-pika-card p-1"
    >
      {options.map((opt) => {
        const active = value === opt.mode;
        return (
          <button
            key={opt.mode}
            type="button"
            onClick={() => onChange(opt.mode)}
            aria-pressed={active}
            title={`Ver em ${opt.label.toLowerCase()}`}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition",
              active
                ? "bg-pika-primary text-white shadow-sm"
                : "text-pika-muted hover:text-pika-ink",
            )}
          >
            <FontAwesomeIcon icon={opt.icon} className="h-4 w-4" />
            <span className="hidden sm:inline">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PassengerCard({
  row,
  zebra,
  selected,
  onToggleSelect,
  onViewDetails,
  onDelete,
}: {
  row: PassengerRow;
  zebra: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onDelete?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  return (
    <article
      className={cn(
        "rounded-2xl border p-4 shadow-sm",
        selected
          ? "border-pika-primary ring-2 ring-pika-primary/20 bg-pika-card"
          : zebra
            ? "border-pika-border bg-pika-page/90"
            : "border-pika-border bg-pika-card",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={`Selecionar ${row.name}`}
            className="h-4 w-4 shrink-0 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
          />
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
            <p className="truncate text-xs text-pika-muted">{row.passengerId}</p>
          </div>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onViewDetails}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
            aria-label={`Ver ${row.name}`}
          >
            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
          </button>
          {onDelete ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink",
                  menuOpen && "bg-pika-page text-pika-ink",
                )}
                aria-label="Mais opções"
              >
                <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-pika-border bg-pika-card p-2 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Eliminar Passageiro
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={row.status} />
        {row.problemCount > 0 ? (
          <span className="rounded-full bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
            {row.problemCount} Problemas
          </span>
        ) : null}
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <p className="break-all text-pika-ink">{row.email}</p>
        <p className="text-pika-muted">{row.phone}</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-pika-border pt-3 text-sm">
        <div>
          <p className="text-xs text-pika-muted">Corridas</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 font-semibold text-pika-ink">
            <FontAwesomeIcon icon={faCar} className="h-3.5 w-3.5 text-pika-primary" />
            {row.rides}
          </p>
        </div>
        <div>
          <p className="text-xs text-pika-muted">Total gasto</p>
          <p className="mt-0.5 font-semibold text-pika-ink">{row.totalSpentLabel}</p>
        </div>
        <div>
          <p className="text-xs text-pika-muted">Avaliação</p>
          <p className="mt-0.5 inline-flex items-center gap-1 font-medium text-pika-ink">
            <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5 text-amber-500" />
            {row.rating}
          </p>
        </div>
        <div>
          <p className="text-xs text-pika-muted">Última corrida</p>
          <p className="mt-0.5 text-pika-muted">{row.lastRideLabel}</p>
        </div>
      </div>
    </article>
  );
}

function PassengerTableRow({
  row,
  zebra,
  selected,
  onToggleSelect,
  onViewDetails,
  onDelete,
}: {
  row: PassengerRow;
  zebra: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onDelete?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  return (
    <tr
      className={cn(
        "border-b border-pika-border transition-colors last:border-b-0",
        selected ? "bg-pika-primary/5" : zebra ? "bg-pika-page/90" : "bg-pika-card",
        "hover:bg-slate-100/80",
      )}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${row.name}`}
          className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
        />
      </td>
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
            onClick={onViewDetails}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
            aria-label={`Ver ${row.name}`}
          >
            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
          </button>
          {onDelete ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink",
                  menuOpen && "bg-pika-page text-pika-ink",
                )}
                aria-label="Mais opções"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
              </button>
              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-pika-border bg-pika-card p-2 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete();
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-center text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    Eliminar Passageiro
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </td>
    </tr>
  );
}

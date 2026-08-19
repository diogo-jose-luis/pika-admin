"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RideDetailsModal } from "@/components/rides/RideDetailsModal";
import { RideNoteModal } from "@/components/rides/RideNoteModal";
import { RideStatusOffCanvas } from "@/components/rides/RideStatusOffCanvas";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { StarRating } from "@/components/ui/StarRating";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/components/providers/LocaleProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faCircle,
  faClock,
  faDownload,
  faCar,
  faEye,
  faIdCard,
  faList,
  faLocationDot,
  faMagnifyingGlass,
  faNoteSticky,
  faPalette,
  faPenToSquare,
  faRobot,
  faTableCells,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { canManageAdminUsers } from "@/lib/permissions";
import {
  rideMatchesDateRange,
  rideMatchesSearch,
  type RideRow,
  type RideStatus,
} from "@/lib/ride-history";
import { translateRideStatus } from "@/lib/i18n";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;

const STATUS_FILTER_OPTIONS = ["Todos", "Em solicitação", "Em andamento", "Concluída", "Pendente", "Cancelada"] as const;

type DeleteConfirmState =
  | { mode: "single"; row: RideRow }
  | { mode: "bulk" }
  | null;

type ViewMode = "cards" | "table";

function statusPillClass(status: RideStatus) {
  const map: Record<RideStatus, string> = {
    "Em andamento": "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    "Em solicitação": "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    Concluída: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    Pendente: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    Cancelada: "bg-red-50 text-red-700 ring-1 ring-red-100",
  };
  return map[status];
}

function StatusPill({ status }: { status: RideStatus }) {
  const { t } = useLocale();
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusPillClass(status),
      )}
    >
      {translateRideStatus(status, t)}
    </span>
  );
}

function SystemClosedBadge() {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
      <FontAwesomeIcon icon={faRobot} className="h-3 w-3" />
      {t("rides.closedBySystem")}
    </span>
  );
}

function RideTimingBlock({ row }: { row: RideRow }) {
  const hasTimes = Boolean(row.startTimeLabel || row.endTimeLabel);
  if (!hasTimes && !row.durationLabel) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-pika-muted">
      {hasTimes ? (
        <span className="inline-flex items-center gap-1.5">
          <FontAwesomeIcon icon={faClock} className="h-3 w-3 text-pika-primary" />
          <span>
            {row.startTimeLabel || "—"}
            <span className="mx-1 text-pika-muted/70">→</span>
            {row.endTimeLabel || "—"}
          </span>
        </span>
      ) : null}
      {row.durationLabel ? (
        <span className="font-semibold text-pika-ink">{row.durationLabel}</span>
      ) : null}
    </div>
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
  const { user } = useAuth();
  const { t } = useLocale();
  const isSuperAdmin = user ? canManageAdminUsers(user.nivel) : false;
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
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [detailRide, setDetailRide] = useState<RideRow | null>(null);
  const [noteRide, setNoteRide] = useState<RideRow | null>(null);
  const [editRide, setEditRide] = useState<RideRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const applyRideUpdate = useCallback((updated: RideRow) => {
    setRides((prev) =>
      prev.map((r) =>
        r.docId === updated.docId ? { ...updated, id: r.id } : r,
      ),
    );
    setDetailRide((prev) =>
      prev && prev.docId === updated.docId
        ? { ...updated, id: prev.id }
        : prev,
    );
  }, []);

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
        throw new Error(data.error ?? t("rides.loadError"));
      }

      setRides(data.rows ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("rides.loadError"),
      );
      setRides([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [t]);

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

  const pageDocIds = pageRows.map((r) => r.docId);
  const allPageSelected =
    pageDocIds.length > 0 && pageDocIds.every((id) => selectedIds.has(id));

  const toggleSelectAllPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const id of pageDocIds) next.delete(id);
      } else {
        for (const id of pageDocIds) next.add(id);
      }
      return next;
    });
  };

  const toggleRowSelection = (docId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm || deleteBusy || !isSuperAdmin) return;

    const ids =
      deleteConfirm.mode === "single"
        ? [deleteConfirm.row.docId]
        : [...selectedIds];

    if (ids.length === 0) return;

    setDeleteBusy(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/corridas/historico", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? t("rides.deleteError"));
      }

      const deletedSet = new Set(ids);
      if (detailRide && deletedSet.has(detailRide.docId)) {
        setDetailRide(null);
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      setDeleteConfirm(null);
      await loadRides(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("rides.deleteGenericError"),
      );
    } finally {
      setDeleteBusy(false);
    }
  }, [
    deleteConfirm,
    deleteBusy,
    isSuperAdmin,
    selectedIds,
    detailRide,
    loadRides,
    t,
  ]);

  const deleteModalTitle =
    deleteConfirm?.mode === "single"
      ? t("rides.deleteTitleSingle", { id: deleteConfirm.row.id })
      : deleteConfirm?.mode === "bulk"
        ? t("rides.deleteTitleBulk", { count: selectedIds.size })
        : "";

  const deleteModalEntityLabel =
    deleteConfirm?.mode === "single"
      ? `${deleteConfirm.row.passenger} → ${deleteConfirm.row.driver}`
      : deleteConfirm?.mode === "bulk"
        ? t("rides.deleteEntityBulk", { count: selectedIds.size })
        : undefined;

  const deleteModalDescription =
    deleteConfirm?.mode === "single"
      ? t("rides.deleteDescSingle")
      : deleteConfirm?.mode === "bulk"
        ? t("rides.deleteDescBulk", { count: selectedIds.size })
        : "";

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
            placeholder={t("rides.searchPlaceholder")}
            className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
          />
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("common.from")}
            </span>
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label={t("common.dateFrom")}
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("common.to")}
            </span>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label={t("common.dateTo")}
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
                {opt === "Todos" ? t("common.all") : translateRideStatus(opt, t)}
              </option>
            ))}
          </select>
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <RefreshDataButton
            loading={refreshing}
            onClick={() => void loadRides(true)}
          />
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white"
          >
            <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
            {t("rides.export")}
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && isSuperAdmin ? (
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-red-200/80 bg-red-50/60 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-pika-ink">
            {t("rides.selectedCount", { count: selectedIds.size })}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setDeleteConfirm({ mode: "bulk" })}
              disabled={deleteBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
              {deleteBusy ? t("common.deleting") : t("rides.deleteSelected")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={deleteBusy}
              className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
            >
              {t("rides.clearSelection")}
            </button>
          </div>
        </div>
      ) : null}

      {viewMode === "table" ? (
      <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
        <table className="min-w-[1400px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleSelectAllPage}
                  disabled={loading || pageRows.length === 0}
                  aria-label={t("rides.selectAllPage")}
                  className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary disabled:opacity-40"
                />
              </th>
              <th className="whitespace-nowrap px-4 py-3">ID</th>
              <th className="whitespace-nowrap px-4 py-3 text-center">{t("rides.details")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("common.passenger")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("common.driver")}</th>
              <th className="min-w-[220px] px-4 py-3">{t("rides.route")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.value")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.commission")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.distance")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.duration")}</th>
              <th className="min-w-[180px] px-4 py-3">{t("rides.vehicle")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.rating")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.status")}</th>
              <th className="whitespace-nowrap px-4 py-3">{t("rides.date")}</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={`sk-${i}`} className="border-b border-pika-border">
                    {Array.from({ length: 14 }, (_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-pika-page" />
                      </td>
                    ))}
                  </tr>
                ))
              : pageRows.map((row) => (
                  <RideTableRow
                    key={row.docId}
                    row={row}
                    selected={selectedIds.has(row.docId)}
                    onToggleSelect={() => toggleRowSelection(row.docId)}
                    onViewDetails={() => setDetailRide(row)}
                    onViewNote={() => setNoteRide(row)}
                    onEditStatus={
                      isSuperAdmin ? () => setEditRide(row) : undefined
                    }
                    onDelete={
                      isSuperAdmin
                        ? () => setDeleteConfirm({ mode: "single", row })
                        : undefined
                    }
                    deleteDisabled={deleteBusy}
                  />
                ))}
          </tbody>
        </table>
      </div>
      ) : (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={`sk-card-${i}`}
                className="h-52 animate-pulse rounded-2xl border border-pika-border bg-pika-page"
              />
            ))
          : pageRows.map((row) => (
              <RideHistoryCard
                key={row.docId}
                row={row}
                selected={selectedIds.has(row.docId)}
                onToggleSelect={() => toggleRowSelection(row.docId)}
                onViewDetails={() => setDetailRide(row)}
                onViewNote={() => setNoteRide(row)}
                onEditStatus={
                  isSuperAdmin ? () => setEditRide(row) : undefined
                }
                onDelete={
                  isSuperAdmin
                    ? () => setDeleteConfirm({ mode: "single", row })
                    : undefined
                }
                deleteDisabled={deleteBusy}
              />
            ))}
      </div>
      )}

      {loadError ? (
        <p className="mt-6 text-center text-sm text-red-600">{loadError}</p>
      ) : null}

      {!loading && !loadError && pageRows.length === 0 ? (
        <p className="mt-6 text-center text-sm text-pika-muted">
          {t("rides.empty")}
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 border-t border-pika-border pt-4 text-sm text-pika-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {t("rides.showing", { from: showingFrom, to: showingTo, total: filtered.length })}
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
            {t("common.previous")}
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
            {t("common.next")}
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </button>
        </div>
      </div>

      {detailRide ? (
        <RideDetailsModal ride={detailRide} onClose={() => setDetailRide(null)} />
      ) : null}

      {noteRide ? (
        <RideNoteModal
          rideId={noteRide.id}
          note={noteRide.note}
          onClose={() => setNoteRide(null)}
        />
      ) : null}

      {editRide && isSuperAdmin ? (
        <RideStatusOffCanvas
          ride={editRide}
          onClose={() => setEditRide(null)}
          onSaved={applyRideUpdate}
        />
      ) : null}

      <DeleteConfirmModal
        open={deleteConfirm !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleteBusy) setDeleteConfirm(null);
        }}
        title={deleteModalTitle}
        entityLabel={deleteModalEntityLabel}
        description={deleteModalDescription}
        confirmLabel={
          deleteConfirm?.mode === "bulk"
            ? t("rides.deleteSelected")
            : t("rides.deleteRide")
        }
        busy={deleteBusy}
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
  const { t } = useLocale();
  const options: { mode: ViewMode; label: string; icon: typeof faTableCells }[] = [
    { mode: "cards", label: t("rides.cards"), icon: faTableCells },
    { mode: "table", label: t("rides.table"), icon: faList },
  ];

  return (
    <div
      role="group"
      aria-label={t("rides.viewMode")}
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
            title={t("rides.viewAs", { mode: opt.label.toLowerCase() })}
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

function RideHistoryCard({
  row,
  selected,
  onToggleSelect,
  onViewDetails,
  onViewNote,
  onEditStatus,
  onDelete,
  deleteDisabled,
}: {
  row: RideRow;
  selected: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onViewNote: () => void;
  onEditStatus?: () => void;
  onDelete?: () => void;
  deleteDisabled: boolean;
}) {
  const { t } = useLocale();
  return (
    <article
      className={cn(
        "rounded-2xl border bg-pika-card p-4 shadow-sm",
        selected ? "border-pika-primary ring-2 ring-pika-primary/20" : "border-pika-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            disabled={deleteDisabled}
            aria-label={t("rides.selectRide", { id: row.id })}
            className="h-4 w-4 shrink-0 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
          />
          <div>
            <p className="font-bold text-pika-ink">#{row.id}</p>
            <p className="text-xs text-pika-muted">{row.dateLabel}</p>
          </div>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onViewNote}
            disabled={deleteDisabled}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
              row.note
                ? "text-amber-700 hover:bg-amber-50"
                : "text-pika-muted hover:bg-pika-page hover:text-pika-primary",
            )}
            aria-label={t("rides.viewNoteAria", { id: row.id })}
            title={t("rides.viewNote")}
          >
            <FontAwesomeIcon icon={faNoteSticky} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onViewDetails}
            disabled={deleteDisabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
            aria-label={t("rides.viewDetailsAria", { id: row.id })}
          >
            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
          </button>
          {onEditStatus ? (
            <button
              type="button"
              onClick={onEditStatus}
              disabled={deleteDisabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
              aria-label={t("rides.editStatusAria", { id: row.id })}
              title={t("rides.editStatus")}
            >
              <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteDisabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-red-50 hover:text-red-600"
              aria-label={t("rides.deleteAria", { id: row.id })}
            >
              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusPill status={row.status} />
        {row.closedBySystem ? <SystemClosedBadge /> : null}
        <span className="text-sm font-semibold text-pika-ink">{row.valueLabel}</span>
        <span className="text-sm text-pika-muted">
          {t("rides.commission")} {row.commissionLabel}
        </span>
      </div>

      <div className="mt-3">
        <RideTimingBlock row={row} />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
            {t("common.passenger")}
          </p>
          <p className="font-medium text-pika-ink">{row.passenger}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
            {t("common.driver")}
          </p>
          <p className="text-pika-ink">{row.driver}</p>
        </div>
      </div>

      <div className="mt-3 flex min-w-0 flex-col gap-1.5 text-xs">
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

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-pika-muted">
        {row.distanceLabel ? <span>{row.distanceLabel}</span> : null}
      </div>

      <div className="mt-3 border-t border-pika-border pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
          {t("rides.vehicle")}
        </p>
        <p className="mt-1 text-sm font-medium text-pika-ink">{row.vehicleModel}</p>
        <p className="text-xs text-pika-muted">
          {row.vehiclePlate} · {row.vehicleColor}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-pika-border pt-3">
        <span className="text-xs font-semibold text-pika-muted">{t("rides.rating")}</span>
        <StarRating
          value={row.passengerToDriverStars}
          iconClassName="h-3.5 w-3.5"
          emptyLabel="—"
        />
      </div>
    </article>
  );
}

function RideTableRow({
  row,
  selected,
  onToggleSelect,
  onViewDetails,
  onViewNote,
  onEditStatus,
  onDelete,
  deleteDisabled,
}: {
  row: RideRow;
  selected: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onViewNote: () => void;
  onEditStatus?: () => void;
  onDelete?: () => void;
  deleteDisabled: boolean;
}) {
  const { t } = useLocale();
  return (
    <tr
      className={cn(
        "border-b border-pika-border bg-pika-card transition-colors last:border-b-0 hover:bg-pika-page/80",
        selected && "bg-pika-primary/5",
      )}
    >
      <td className="px-3 py-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={deleteDisabled}
          aria-label={t("rides.selectRide", { id: row.id })}
          className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary disabled:opacity-40"
        />
      </td>
      <td className="whitespace-nowrap px-4 py-3 font-medium text-pika-ink">
        #{row.id}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-center">
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={onViewNote}
            disabled={deleteDisabled}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg transition disabled:opacity-40",
              row.note
                ? "text-amber-700 hover:bg-amber-50"
                : "text-pika-muted hover:bg-pika-page hover:text-pika-primary",
            )}
            aria-label={t("rides.viewNoteAria", { id: row.id })}
            title={t("rides.viewNote")}
          >
            <FontAwesomeIcon icon={faNoteSticky} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onViewDetails}
            disabled={deleteDisabled}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary disabled:opacity-40"
            aria-label={t("rides.viewMoreAria", { id: row.id })}
            title={t("rides.viewMore")}
          >
            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
          </button>
          {onEditStatus ? (
            <button
              type="button"
              onClick={onEditStatus}
              disabled={deleteDisabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary disabled:opacity-40"
              aria-label={t("rides.editStatusAria", { id: row.id })}
              title={t("rides.editStatus")}
            >
              <FontAwesomeIcon icon={faPenToSquare} className="h-4 w-4" />
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteDisabled}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              aria-label={t("rides.deleteAria", { id: row.id })}
              title={t("rides.deleteRide")}
            >
              <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
            </button>
          ) : null}
        </div>
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
      <td className="whitespace-nowrap px-4 py-3 font-medium text-pika-ink">
        {row.commissionLabel}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">
        {row.distanceLabel || "\u00a0"}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">
        <div className="flex flex-col gap-0.5">
          {row.startTimeLabel || row.endTimeLabel ? (
            <span>
              {row.startTimeLabel || "—"} → {row.endTimeLabel || "—"}
            </span>
          ) : null}
          <span className="font-medium text-pika-ink">
            {row.durationLabel || "\u00a0"}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1.5 text-xs">
          <span className="inline-flex items-start gap-2 text-pika-ink">
            <FontAwesomeIcon
              icon={faCar}
              className="mt-0.5 h-3 w-3 shrink-0 text-pika-primary"
            />
            <span className="leading-snug font-medium">{row.vehicleModel}</span>
          </span>
          <span className="inline-flex items-start gap-2 text-pika-ink">
            <FontAwesomeIcon
              icon={faIdCard}
              className="mt-0.5 h-3 w-3 shrink-0 text-pika-primary"
            />
            <span className="leading-snug">{row.vehiclePlate}</span>
          </span>
          <span className="inline-flex items-start gap-2 text-pika-muted">
            <FontAwesomeIcon
              icon={faPalette}
              className="mt-0.5 h-3 w-3 shrink-0 text-pika-primary"
            />
            <span className="leading-snug">{row.vehicleColor}</span>
          </span>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <StarRating
          value={row.passengerToDriverStars}
          iconClassName="h-3.5 w-3.5"
          emptyLabel="—"
        />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <div className="flex flex-col items-start gap-1.5">
          <StatusPill status={row.status} />
          {row.closedBySystem ? <SystemClosedBadge /> : null}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-pika-muted">{row.dateLabel}</td>
    </tr>
  );
}

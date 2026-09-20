"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleCheck,
  faClockRotateLeft,
  faList,
  faMagnifyingGlass,
  faTableCells,
  faUser,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";
import { RefundDriverOffCanvas } from "@/components/reembolsos/RefundDriverOffCanvas";
import { RefundRideOffCanvas } from "@/components/reembolsos/RefundRideOffCanvas";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";
import { formatKz } from "@/lib/format-kz";
import {
  refundMatchesFilters,
  uniqueRefundDrivers,
  uniqueRefundMethods,
  type RefundColumnFilters,
  type RefundRow,
  type RefundsSummary,
} from "@/lib/reembolsos";

const PAGE_SIZE = 20;
const EMPTY_SUMMARY: RefundsSummary = {
  total: 0,
  reimbursed: 0,
  pending: 0,
  totalAmount: 0,
  reimbursedAmount: 0,
  pendingAmount: 0,
};

const EMPTY_FILTERS: RefundColumnFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  driverId: "",
  metodo: "",
  jaRecebido: "all",
  referencia: "",
  referenciaPagamento: "",
  descricao: "",
  montanteMin: "",
  montanteMax: "",
  totalCorridaMin: "",
  totalCorridaMax: "",
};

type ViewMode = "cards" | "table";
type DetailTarget =
  | { kind: "ride"; row: RefundRow }
  | { kind: "driver"; row: RefundRow }
  | null;

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

function ReimbursedPill({ value }: { value: boolean }) {
  const { t } = useLocale();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        value
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
      )}
    >
      <FontAwesomeIcon
        icon={value ? faCircleCheck : faClockRotateLeft}
        className="h-3 w-3"
      />
      {value ? t("refunds.statusYes") : t("refunds.statusNo")}
    </span>
  );
}

export function RefundsView() {
  const { t } = useLocale();
  const [rows, setRows] = useState<RefundRow[]>([]);
  const [summary, setSummary] = useState<RefundsSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<RefundColumnFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);
  const [detail, setDetail] = useState<DetailTarget>(null);

  const loadRefunds = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const res = await fetch("/api/reembolsos", { cache: "no-store" });
        const data = (await res.json()) as {
          rows?: RefundRow[];
          summary?: RefundsSummary;
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error ?? t("refunds.loadError"));
        }

        setRows(data.rows ?? []);
        setSummary(data.summary ?? EMPTY_SUMMARY);
        setSelectedIds(new Set());
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : t("refunds.loadError"),
        );
        setRows([]);
        setSummary(EMPTY_SUMMARY);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void loadRefunds();
  }, [loadRefunds]);

  const filtered = useMemo(
    () => rows.filter((row) => refundMatchesFilters(row, filters)),
    [rows, filters],
  );

  const drivers = useMemo(() => uniqueRefundDrivers(rows), [rows]);
  const methods = useMemo(() => uniqueRefundMethods(rows), [rows]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const startIdx = (page - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(startIdx, startIdx + PAGE_SIZE);
  const showingFrom = filtered.length === 0 ? 0 : startIdx + 1;
  const showingTo = startIdx + pageRows.length;
  const pages = pageNumbers(page, pageCount);

  const pageIds = pageRows.map((row) => row.id);
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

  const patchFilter = <K extends keyof RefundColumnFilters>(
    key: K,
    value: RefundColumnFilters[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyBulk = async (jaRecebido: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/reembolsos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          jaRecebido,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? t("refunds.updateError"));
      }
      await loadRefunds(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("refunds.updateError"),
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const stat = (value: string) => (loading ? "…" : value);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={t("refunds.total")}
          value={stat(summary.total.toLocaleString("pt-AO"))}
          hint={loading ? "…" : formatKz(summary.totalAmount)}
          icon={faWallet}
          iconClass="bg-sky-100 text-sky-600"
        />
        <StatCard
          label={t("refunds.reimbursed")}
          value={stat(summary.reimbursed.toLocaleString("pt-AO"))}
          hint={loading ? "…" : formatKz(summary.reimbursedAmount)}
          icon={faCircleCheck}
          iconClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label={t("refunds.pending")}
          value={stat(summary.pending.toLocaleString("pt-AO"))}
          hint={loading ? "…" : formatKz(summary.pendingAmount)}
          icon={faClockRotateLeft}
          iconClass="bg-amber-100 text-amber-700"
        />
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-page/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => patchFilter("search", e.target.value)}
              placeholder={t("refunds.searchPlaceholder")}
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <ViewModeToggle value={viewMode} onChange={setViewMode} />
            <RefreshDataButton
              loading={refreshing}
              onClick={() => void loadRefunds(true)}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("common.from")}
            </span>
            <input
              type="date"
              value={filters.dateFrom}
              max={filters.dateTo || undefined}
              onChange={(e) => patchFilter("dateFrom", e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label={t("common.dateFrom")}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("common.to")}
            </span>
            <input
              type="date"
              value={filters.dateTo}
              min={filters.dateFrom || undefined}
              onChange={(e) => patchFilter("dateTo", e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label={t("common.dateTo")}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("refunds.driver")}
            </span>
            <select
              value={filters.driverId}
              onChange={(e) => patchFilter("driverId", e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              <option value="">{t("refunds.allDrivers")}</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("refunds.status")}
            </span>
            <select
              value={filters.jaRecebido}
              onChange={(e) =>
                patchFilter(
                  "jaRecebido",
                  e.target.value as RefundColumnFilters["jaRecebido"],
                )
              }
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              <option value="all">{t("refunds.statusAll")}</option>
              <option value="yes">{t("refunds.statusYes")}</option>
              <option value="no">{t("refunds.statusNo")}</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              {t("refunds.method")}
            </span>
            <select
              value={filters.metodo}
              onChange={(e) => patchFilter("metodo", e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              <option value="">{t("refunds.allMethods")}</option>
              {methods.map((method) => (
                <option key={method} value={String(method)}>
                  {t("refunds.methodValue", { value: method })}
                </option>
              ))}
            </select>
          </label>
          <FilterInput
            label={t("refunds.reference")}
            value={filters.referencia}
            onChange={(value) => patchFilter("referencia", value)}
          />
          <FilterInput
            label={t("refunds.paymentRef")}
            value={filters.referenciaPagamento}
            onChange={(value) => patchFilter("referenciaPagamento", value)}
          />
          <FilterInput
            label={t("refunds.description")}
            value={filters.descricao}
            onChange={(value) => patchFilter("descricao", value)}
          />
          <FilterInput
            label={t("refunds.amountMin")}
            value={filters.montanteMin}
            onChange={(value) => patchFilter("montanteMin", value)}
            type="number"
          />
          <FilterInput
            label={t("refunds.amountMax")}
            value={filters.montanteMax}
            onChange={(value) => patchFilter("montanteMax", value)}
            type="number"
          />
          <FilterInput
            label={t("refunds.rideTotalMin")}
            value={filters.totalCorridaMin}
            onChange={(value) => patchFilter("totalCorridaMin", value)}
            type="number"
          />
          <FilterInput
            label={t("refunds.rideTotalMax")}
            value={filters.totalCorridaMax}
            onChange={(value) => patchFilter("totalCorridaMax", value)}
            type="number"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-pika-border bg-pika-card p-4 shadow-sm md:p-6">
        {selectedIds.size > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-pika-primary/30 bg-pika-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-pika-ink">
              {t("refunds.selectedCount", { count: selectedIds.size })}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void applyBulk(true)}
                disabled={bulkSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
                {bulkSaving ? t("refunds.applying") : t("refunds.markReimbursed")}
              </button>
              <button
                type="button"
                onClick={() => void applyBulk(false)}
                disabled={bulkSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-pika-card px-4 py-2 text-sm font-semibold text-amber-800 shadow-sm transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faClockRotateLeft} className="h-3.5 w-3.5" />
                {bulkSaving ? t("refunds.applying") : t("refunds.markPending")}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkSaving}
                className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
              >
                {t("refunds.clearSelection")}
              </button>
            </div>
          </div>
        ) : null}

        {viewMode === "table" ? (
          <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
            <table className="min-w-[1280px] w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAllPage}
                      disabled={loading || pageRows.length === 0}
                      aria-label={t("refunds.selectAllPage")}
                      className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary disabled:opacity-40"
                    />
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.date")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.driver")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.amount")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.rideTotal")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.method")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.reference")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.paymentRef")}</th>
                  <th className="min-w-[180px] px-4 py-3">{t("refunds.description")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("refunds.status")}</th>
                  <th className="whitespace-nowrap px-4 py-3 text-center">
                    {t("refunds.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={`sk-${i}`} className="border-b border-pika-border">
                        {Array.from({ length: 11 }, (_, j) => (
                          <td key={j} className="px-4 py-3">
                            <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-pika-page" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : pageRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-pika-border last:border-b-0 hover:bg-pika-page/60"
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggleRow(row.id)}
                            aria-label={t("refunds.selectRow", {
                              name: row.motoristaNome,
                            })}
                            className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-pika-ink">
                          {row.criadoEmLabel}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              photoUrl={row.driver?.photoUrl}
                              name={row.motoristaNome}
                              className="h-8 w-8"
                            />
                            <span className="font-semibold text-pika-ink">
                              {row.motoristaNome}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-pika-ink">
                          {row.montanteLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-pika-ink">
                          {row.totalDaCorridaLabel}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-pika-ink">
                          {row.metodo == null
                            ? "—"
                            : t("refunds.methodValue", { value: row.metodo })}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-pika-ink">
                          {row.referencia}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] text-pika-ink">
                          {row.referenciaPagamento}
                        </td>
                        <td className="px-4 py-3 text-pika-ink">{row.descricao}</td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <ReimbursedPill value={row.jaRecebido} />
                        </td>
                        <td className="px-4 py-3">
                          <RowActions
                            onViewRide={() => setDetail({ kind: "ride", row })}
                            onViewDriver={() => setDetail({ kind: "driver", row })}
                          />
                        </td>
                      </tr>
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
                    className="h-64 animate-pulse rounded-2xl border border-pika-border bg-pika-page"
                  />
                ))
              : pageRows.map((row) => (
                  <RefundCard
                    key={row.id}
                    row={row}
                    selected={selectedIds.has(row.id)}
                    onToggleSelect={() => toggleRow(row.id)}
                    onViewRide={() => setDetail({ kind: "ride", row })}
                    onViewDriver={() => setDetail({ kind: "driver", row })}
                  />
                ))}
          </div>
        )}

        {loadError ? (
          <p className="mt-6 text-center text-sm text-red-600" role="alert">
            {loadError}
          </p>
        ) : null}

        {!loading && !loadError && pageRows.length === 0 ? (
          <p className="mt-6 text-center text-sm text-pika-muted">
            {t("refunds.empty")}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 border-t border-pika-border pt-4 text-sm text-pika-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("refunds.showing", {
              from: showingFrom,
              to: showingTo,
              total: filtered.length,
            })}
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
      </div>

      <RefundRideOffCanvas
        ride={detail?.kind === "ride" ? detail.row.ride : null}
        missing={detail?.kind === "ride" && !detail.row.ride}
        onClose={() => setDetail(null)}
      />
      <RefundDriverOffCanvas
        driver={detail?.kind === "driver" ? detail.row.driver : null}
        missing={detail?.kind === "driver" && !detail.row.driver}
        onClose={() => setDetail(null)}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof faWallet;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-pika-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-pika-ink">{value}</p>
          <p className="mt-1 text-xs font-medium text-pika-muted">{hint}</p>
        </div>
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            iconClass,
          )}
        >
          <FontAwesomeIcon icon={icon} className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "number";
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
      />
    </label>
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
    { mode: "table", label: t("rides.table"), icon: faList },
    { mode: "cards", label: t("rides.cards"), icon: faTableCells },
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

function RowActions({
  onViewRide,
  onViewDriver,
}: {
  onViewRide: () => void;
  onViewDriver: () => void;
}) {
  const { t } = useLocale();
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={onViewRide}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
        aria-label={t("refunds.viewRideAria")}
        title={t("refunds.viewRide")}
      >
        <FontAwesomeIcon icon={faCar} className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onViewDriver}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
        aria-label={t("refunds.viewDriverAria")}
        title={t("refunds.viewDriver")}
      >
        <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
      </button>
    </div>
  );
}

function RefundCard({
  row,
  selected,
  onToggleSelect,
  onViewRide,
  onViewDriver,
}: {
  row: RefundRow;
  selected: boolean;
  onToggleSelect: () => void;
  onViewRide: () => void;
  onViewDriver: () => void;
}) {
  const { t } = useLocale();
  const ride = row.ride;

  return (
    <article
      className={cn(
        "rounded-2xl border bg-pika-card p-4 shadow-sm",
        selected
          ? "border-pika-primary ring-2 ring-pika-primary/20"
          : "border-pika-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggleSelect}
            aria-label={t("refunds.selectRow", { name: row.motoristaNome })}
            className="h-4 w-4 shrink-0 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
          />
          <UserAvatar
            photoUrl={row.driver?.photoUrl}
            name={row.motoristaNome}
            className="h-10 w-10"
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-pika-ink">{row.motoristaNome}</p>
            <p className="truncate text-xs text-pika-muted">{row.criadoEmLabel}</p>
          </div>
        </label>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onViewRide}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
            aria-label={t("refunds.viewRideAria")}
            title={t("refunds.viewRide")}
          >
            <FontAwesomeIcon icon={faCar} className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onViewDriver}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-primary"
            aria-label={t("refunds.viewDriverAria")}
            title={t("refunds.viewDriver")}
          >
            <FontAwesomeIcon icon={faUser} className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ReimbursedPill value={row.jaRecebido} />
        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
          {t("refunds.entryType")}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-pika-muted">{t("refunds.amount")}</p>
          <p className="mt-0.5 font-bold text-pika-ink">{row.montanteLabel}</p>
        </div>
        <div>
          <p className="text-xs text-pika-muted">{t("refunds.rideTotal")}</p>
          <p className="mt-0.5 font-semibold text-pika-ink">
            {row.totalDaCorridaLabel}
          </p>
        </div>
        <div>
          <p className="text-xs text-pika-muted">{t("refunds.method")}</p>
          <p className="mt-0.5 text-pika-ink">
            {row.metodo == null
              ? "—"
              : t("refunds.methodValue", { value: row.metodo })}
          </p>
        </div>
        <div>
          <p className="text-xs text-pika-muted">{t("refunds.ridesCount")}</p>
          <p className="mt-0.5 font-semibold text-pika-ink">
            {row.driver?.totalRides.toLocaleString("pt-AO") ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1 border-t border-pika-border pt-3 text-sm">
        <p className="text-pika-ink">
          <span className="text-pika-muted">{t("refunds.reference")}: </span>
          <span className="font-mono text-[13px]">{row.referencia}</span>
        </p>
        <p className="text-pika-ink">
          <span className="text-pika-muted">{t("refunds.paymentRef")}: </span>
          <span className="font-mono text-[13px]">{row.referenciaPagamento}</span>
        </p>
        <p className="text-pika-ink">
          <span className="text-pika-muted">{t("refunds.description")}: </span>
          {row.descricao}
        </p>
        {row.driver?.phone ? (
          <p className="text-pika-muted">{row.driver.phone}</p>
        ) : null}
        {row.driver?.email ? (
          <p className="break-all text-pika-muted">{row.driver.email}</p>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl bg-pika-page/70 p-3 text-sm">
        {ride ? (
          <>
            <p className="font-semibold text-pika-ink">
              {ride.passenger} → {ride.driver}
            </p>
            <p className="mt-1 text-pika-muted">
              {ride.origin} → {ride.destination}
            </p>
            <p className="mt-1 text-xs text-pika-muted">{ride.valueLabel}</p>
          </>
        ) : (
          <p className="text-pika-muted">{t("refunds.noRideRoute")}</p>
        )}
      </div>
    </article>
  );
}

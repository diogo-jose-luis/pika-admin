"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faChevronLeft,
  faChevronRight,
  faCircleXmark,
  faClock,
  faCopy,
  faCreditCard,
  faEye,
  faLocationDot,
  faMagnifyingGlass,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import {
  DEFAULT_TABLE_PAGE_SIZE,
  PageSizeSelect,
  RecordExportControls,
  type ExportField,
} from "@/components/export/RecordExportControls";
import { OffCanvas } from "@/components/ui/OffCanvas";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/components/providers/LocaleProvider";
import { extractApiErrorMessage, isBotChallengeError } from "@/lib/api-error";
import {
  APPYPAY_STATUSES,
  chargeDisplayReference,
  chargeLookupKeys,
  chargeMatchesSearch,
  computeChargesSummary,
  parseAppyPayChargesResponse,
  type AppyPayCharge,
  type AppyPayChargesSummary,
} from "@/lib/appypay-charges";
import { cn } from "@/lib/cn";
import { formatKz } from "@/lib/format-kz";
import { translateAppyPayStatus, translateRideStatus, type TranslateFn } from "@/lib/i18n";
import {
  formatRideDate,
  type PaymentRideDetails,
} from "@/lib/ride-history";

function paymentKey(row: AppyPayCharge): string {
  if (row.chargeId) return `c:${row.chargeId}`;
  if (row.merchantTransactionId) return `m:${row.merchantTransactionId}`;
  if (row.id != null) return `i:${row.id}`;
  return `r:${row.createdAt ?? ""}:${row.amount}:${row.phoneNumber ?? ""}`;
}

function paymentExportValue(
  row: AppyPayCharge,
  key: string,
  t: TranslateFn,
): string {
  const dash = "—";
  switch (key) {
    case "reference":
      return chargeDisplayReference(row);
    case "description":
      return row.description?.trim() || dash;
    case "providerRef":
      return row.providerTransactionId ?? row.referenceNumber ?? dash;
    case "amount":
      return `${formatKz(row.amount)} ${row.currency}`.trim();
    case "currency":
      return row.currency || dash;
    case "phone":
      return row.phoneNumber ?? dash;
    case "status":
      return translateAppyPayStatus(row.status, t);
    case "createdAt":
      return formatRideDate(row.createdAt) || row.createdAt || dash;
    case "paidAt":
      return formatRideDate(row.paidAt) || row.paidAt || dash;
    case "method":
      return row.paymentMethod ?? dash;
    case "source":
      return row.source ?? dash;
    case "chargeId":
      return row.chargeId ?? dash;
    case "message":
      return row.statusMessage ?? dash;
    case "paid":
      return row.paid ? t("payments.paidFlag") : t("payments.notPaidFlag");
    case "final":
      return row.final ? t("payments.finalFlag") : t("payments.openFlag");
    default:
      return dash;
  }
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

function statusPillClass(status: string) {
  switch (status) {
    case "Success":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "Requested":
    case "Pending":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-100";
    case "Failed":
    case "Cancelled":
    case "Expired":
      return "bg-red-50 text-red-700 ring-1 ring-red-100";
    default:
      return "bg-slate-50 text-slate-700 ring-1 ring-slate-100";
  }
}

function StatusPill({ status, t }: { status: string; t: TranslateFn }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
        statusPillClass(status),
      )}
    >
      {translateAppyPayStatus(status, t)}
    </span>
  );
}

function CopyButton({
  value,
  label,
  copiedLabel,
}: {
  value: string;
  label: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-pika-border text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
    >
      <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="h-3.5 w-3.5" />
    </button>
  );
}

function DetailRow({
  label,
  value,
  copyLabel,
  copiedLabel,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  copyLabel?: string;
  copiedLabel?: string;
  mono?: boolean;
}) {
  const display = value?.trim() ? value : "—";
  const canCopy = Boolean(value?.trim() && copyLabel && copiedLabel);
  return (
    <div className="flex items-start justify-between gap-3 border-b border-pika-border py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 break-all text-sm font-medium text-pika-ink",
            mono && "font-mono text-[13px]",
          )}
        >
          {display}
        </p>
      </div>
      {canCopy ? (
        <CopyButton
          value={value!}
          label={copyLabel!}
          copiedLabel={copiedLabel!}
        />
      ) : null}
    </div>
  );
}

function RideSchedule({ ride }: { ride: PaymentRideDetails }) {
  const times =
    ride.startTimeLabel || ride.endTimeLabel
      ? `${ride.startTimeLabel || "—"} – ${ride.endTimeLabel || "—"}`
      : "";
  if (ride.scheduled && ride.scheduledDateLabel) {
    return (
      <>
        {ride.scheduledDateLabel}
        {times ? ` · ${times}` : ""}
      </>
    );
  }
  if (ride.dateLabel && times) return <>{ride.dateLabel} · {times}</>;
  return <>{ride.dateLabel || times || "—"}</>;
}

function PaymentRideSection({
  ride,
  loading,
  error,
  t,
}: {
  ride: PaymentRideDetails | null;
  loading: boolean;
  error: string | null;
  t: TranslateFn;
}) {
  return (
    <section className="mb-3 rounded-xl border border-pika-border bg-pika-page/70 p-4">
      <h3 className="text-sm font-bold text-pika-ink">{t("payments.ride")}</h3>
      {loading ? (
        <p className="mt-2 text-sm text-pika-muted">{t("payments.rideLoading")}</p>
      ) : error ? (
        <p className="mt-2 text-sm text-red-700">{error}</p>
      ) : !ride ? (
        <p className="mt-2 text-sm text-pika-muted">{t("payments.rideNotFound")}</p>
      ) : (
        <dl className="mt-3 space-y-3">
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faUser}
              className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
            />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                {t("common.driver")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-pika-ink">
                {ride.driver}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faUser}
              className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
            />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                {t("common.passenger")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-pika-ink">
                {ride.passenger}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faLocationDot}
              className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
            />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                {t("payments.pickup")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-pika-ink">
                {ride.origin}
              </dd>
              <dt className="mt-2 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                {t("common.destination")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-pika-ink">
                {ride.destination}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <FontAwesomeIcon
              icon={faClock}
              className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
            />
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                {t("payments.schedule")}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-pika-ink">
                <RideSchedule ride={ride} />
              </dd>
              <p className="mt-1 text-xs text-pika-muted">
                {translateRideStatus(ride.status, t)}
              </p>
            </div>
          </div>
        </dl>
      )}
    </section>
  );
}

export function PaymentsView() {
  const { http } = useAuth();
  const { t } = useLocale();
  const [items, setItems] = useState<AppyPayCharge[]>([]);
  const [summary, setSummary] = useState<AppyPayChargesSummary | null>(null);
  const [paginated, setPaginated] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [listPerPage, setListPerPage] = useState(DEFAULT_TABLE_PAGE_SIZE);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Map<string, AppyPayCharge>>(new Map());
  const [selected, setSelected] = useState<AppyPayCharge | null>(null);
  const [ride, setRide] = useState<PaymentRideDetails | null>(null);
  const [rideLoading, setRideLoading] = useState(false);
  const [rideError, setRideError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, dateFrom, dateTo, pageSize]);

  useEffect(() => {
    setPicked(new Map());
  }, [debouncedSearch, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (!selected) {
      setRide(null);
      setRideError(null);
      setRideLoading(false);
      return;
    }

    const refs = chargeLookupKeys(selected);
    if (refs.length === 0) {
      setRide(null);
      setRideError(null);
      setRideLoading(false);
      return;
    }

    let cancelled = false;
    setRideLoading(true);
    setRideError(null);
    setRide(null);

    const params = new URLSearchParams();
    for (const ref of refs) params.append("ref", ref);

    void fetch(`/api/pagamentos/corrida?${params.toString()}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = (await res.json()) as {
          ride?: PaymentRideDetails | null;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data.error ?? t("payments.rideNotFound"));
        }
        if (!cancelled) setRide(data.ride ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setRide(null);
        setRideError(
          err instanceof Error ? err.message : t("payments.rideNotFound"),
        );
      })
      .finally(() => {
        if (!cancelled) setRideLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selected, t]);

  const loadPayments = useCallback(
    async (isRefresh = false) => {
      const showRefresh = isRefresh || hasLoadedRef.current;
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const params: Record<string, string | number> = {
          page,
          per_page: pageSize,
        };
        if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
        if (statusFilter !== "all") params.status = statusFilter;
        if (dateFrom) params.from = dateFrom;
        if (dateTo) params.to = dateTo;

        const { data } = await http.get("/appypay/charges", { params });
        if (typeof data === "string") {
          throw new Error(data);
        }
        const parsed = parseAppyPayChargesResponse(data);

        setItems(parsed.items);
        setPaginated(parsed.paginated);
        setListPerPage(parsed.paginated ? parsed.perPage : pageSize);
        setLastPage(parsed.paginated ? parsed.lastPage : 1);
        setTotal(parsed.total);
        setSummary(parsed.summary);
        hasLoadedRef.current = true;
        if (parsed.paginated && parsed.page !== page) {
          setPage(parsed.page);
        }
      } catch (err) {
        const status =
          err && typeof err === "object" && "response" in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
        setLoadError(
          isBotChallengeError(err)
            ? t("payments.botBlocked")
            : status === 404
              ? t("payments.endpointMissing")
              : extractApiErrorMessage(err, t("payments.loadError")),
        );
        setItems([]);
        setSummary(null);
        setTotal(0);
        setLastPage(1);
        setPaginated(false);
      } finally {
        if (showRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [debouncedSearch, dateFrom, dateTo, http, page, pageSize, statusFilter, t],
  );

  useEffect(() => {
    void loadPayments();
  }, [loadPayments]);

  const visibleItems = useMemo(() => {
    if (paginated) return items;
    return items.filter((item) => {
      if (!chargeMatchesSearch(item, debouncedSearch)) return false;
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (dateFrom && (item.createdAt ?? "") < `${dateFrom}T00:00:00`) return false;
      if (dateTo && (item.createdAt ?? "") > `${dateTo}T23:59:59.999`) return false;
      return true;
    });
  }, [debouncedSearch, dateFrom, dateTo, items, paginated, statusFilter]);

  const clientPageItems = useMemo(() => {
    if (paginated) return visibleItems;
    const start = (page - 1) * pageSize;
    return visibleItems.slice(start, start + pageSize);
  }, [page, pageSize, paginated, visibleItems]);

  const clientLastPage = paginated
    ? lastPage
    : Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const clientTotal = paginated ? total : visibleItems.length;
  const displaySummary = summary ?? computeChargesSummary(paginated ? items : visibleItems);
  const summaryFromPageOnly = paginated && !summary;
  const pages = pageNumbers(page, clientLastPage);
  const rangeSize = paginated ? listPerPage : pageSize;
  const showingFrom = clientTotal === 0 ? 0 : (page - 1) * rangeSize + 1;
  const showingTo =
    clientTotal === 0
      ? 0
      : paginated
        ? Math.min((page - 1) * rangeSize + clientPageItems.length, clientTotal)
        : Math.min(page * pageSize, clientTotal);
  const pageKeys = clientPageItems.map(paymentKey);
  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every((key) => picked.has(key));

  const paymentFields = useMemo<ExportField[]>(
    () => [
      { key: "reference", label: t("payments.reference") },
      { key: "description", label: t("payments.description") },
      { key: "providerRef", label: t("payments.providerRef") },
      { key: "amount", label: t("payments.amount") },
      { key: "phone", label: t("payments.phone") },
      { key: "status", label: t("payments.status") },
      { key: "createdAt", label: t("payments.createdAt") },
      { key: "paidAt", label: t("payments.paidAt"), defaultSelected: false },
      { key: "method", label: t("payments.method"), defaultSelected: false },
      { key: "source", label: t("payments.source"), defaultSelected: false },
      { key: "chargeId", label: t("payments.chargeId"), defaultSelected: false },
      { key: "message", label: t("payments.message"), defaultSelected: false },
      { key: "paid", label: t("payments.paidFlag"), defaultSelected: false },
      { key: "final", label: t("payments.finalFlag"), defaultSelected: false },
      { key: "currency", label: t("payments.currency"), defaultSelected: false },
    ],
    [t],
  );

  const togglePicked = (row: AppyPayCharge) => {
    const key = paymentKey(row);
    setPicked((prev) => {
      const next = new Map(prev);
      if (next.has(key)) next.delete(key);
      else next.set(key, row);
      return next;
    });
  };

  const toggleSelectAllPage = () => {
    setPicked((prev) => {
      const next = new Map(prev);
      if (allPageSelected) {
        for (const key of pageKeys) next.delete(key);
      } else {
        for (const row of clientPageItems) next.set(paymentKey(row), row);
      }
      return next;
    });
  };

  const stat = (value: string) => (loading ? "…" : value);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">
                {t("payments.total")}
              </p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(displaySummary.total.toLocaleString("pt-AO"))}
              </p>
              {summaryFromPageOnly ? (
                <p className="mt-1 text-xs text-pika-muted">
                  {t("payments.summaryPageHint")}
                </p>
              ) : null}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <FontAwesomeIcon icon={faCreditCard} className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">
                {t("payments.paid")}
              </p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(displaySummary.success.toLocaleString("pt-AO"))}
              </p>
              <p className="mt-1 text-xs text-pika-muted">
                {loading ? "…" : formatKz(displaySummary.amountPaid)}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FontAwesomeIcon icon={faCheck} className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">
                {t("payments.pending")}
              </p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(displaySummary.pending.toLocaleString("pt-AO"))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <FontAwesomeIcon icon={faClock} className="h-6 w-6" />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">
                {t("payments.failed")}
              </p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {stat(displaySummary.failed.toLocaleString("pt-AO"))}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faCircleXmark} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-page/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("payments.searchPlaceholder")}
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
              aria-label={t("payments.status")}
            >
              <option value="all">{t("common.all")}</option>
              {APPYPAY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {translateAppyPayStatus(status, t)}
                </option>
              ))}
            </select>
            <label className="flex flex-col gap-1">
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
            <label className="flex flex-col gap-1">
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
            <RecordExportControls
              title={t("nav.payments")}
              fileBase="pika-pagamentos"
              fields={paymentFields}
              selectedCount={picked.size}
              buildRows={(keys) =>
                [...picked.values()].map((row) =>
                  keys.map((key) => paymentExportValue(row, key, t)),
                )
              }
            />
            <RefreshDataButton
              loading={refreshing}
              onClick={() => void loadPayments(true)}
              className="mb-0.5"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-pika-border bg-pika-card p-4 shadow-sm md:p-6">
        {loadError ? (
          <p
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}

        {picked.size > 0 ? (
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-pika-primary/30 bg-pika-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-pika-ink">
              {t("payments.selectedCount", { count: picked.size })}
            </p>
            <button
              type="button"
              onClick={() => setPicked(new Map())}
              className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-muted transition hover:text-pika-ink"
            >
              {t("payments.clearSelection")}
            </button>
          </div>
        ) : null}

        <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
          <table className="min-w-[1160px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectAllPage}
                    disabled={loading || clientPageItems.length === 0}
                    aria-label={t("payments.selectAllPage")}
                    className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary disabled:opacity-40"
                  />
                </th>
                <th className="whitespace-nowrap px-4 py-3">
                  {t("payments.reference")}
                </th>
                <th className="min-w-[220px] px-4 py-3">
                  {t("payments.description")}
                </th>
                <th className="whitespace-nowrap px-4 py-3">
                  {t("payments.providerRef")}
                </th>
                <th className="whitespace-nowrap px-4 py-3">
                  {t("payments.amount")}
                </th>
                <th className="whitespace-nowrap px-4 py-3">
                  {t("payments.phone")}
                </th>
                <th className="whitespace-nowrap px-4 py-3">
                  {t("payments.status")}
                </th>
                <th className="whitespace-nowrap px-4 py-3">
                  {t("payments.createdAt")}
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-center">
                  {t("payments.viewDetails")}
                </th>
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
                : clientPageItems.map((row, idx) => {
                    const reference = chargeDisplayReference(row);
                    const key = paymentKey(row);
                    return (
                      <tr
                        key={key}
                        className={cn(
                          "border-b border-pika-border",
                          idx % 2 === 1 ? "bg-pika-page/40" : "bg-pika-card",
                        )}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            checked={picked.has(key)}
                            onChange={() => togglePicked(row)}
                            aria-label={t("payments.selectRow", { ref: reference })}
                            className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
                          />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px] font-semibold text-pika-ink">
                          {reference}
                        </td>
                        <td className="max-w-[280px] px-4 py-3 text-pika-ink">
                          <p className="truncate" title={row.description ?? undefined}>
                            {row.description?.trim() ? row.description : "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-[13px] text-pika-ink">
                          {row.providerTransactionId ?? row.referenceNumber ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-pika-ink">
                          {formatKz(row.amount)}
                          <span className="ml-1 text-xs font-medium text-pika-muted">
                            {row.currency}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-pika-ink">
                          {row.phoneNumber ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill status={row.status} t={t} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-pika-muted">
                          {formatRideDate(row.createdAt) || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => setSelected(row)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-pika-muted transition hover:bg-pika-card hover:text-pika-ink"
                            aria-label={t("payments.viewDetails")}
                          >
                            <FontAwesomeIcon icon={faEye} className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && !loadError && clientPageItems.length === 0 ? (
          <p className="mt-6 text-center text-sm text-pika-muted">
            {t("payments.empty")}
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 border-t border-pika-border pt-4 text-sm text-pika-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <p>
              {t("payments.showing", {
                from: showingFrom,
                to: showingTo,
                total: clientTotal.toLocaleString("pt-AO"),
              })}
            </p>
            <PageSizeSelect value={pageSize} onChange={setPageSize} />
          </div>
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
              disabled={page >= clientLastPage}
              onClick={() => setPage((p) => Math.min(clientLastPage, p + 1))}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border border-pika-border px-3 py-1.5 font-medium text-pika-ink transition",
                page >= clientLastPage
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

      <OffCanvas
        open={selected != null}
        onClose={() => setSelected(null)}
        title={t("payments.details")}
        subtitle={selected ? chargeDisplayReference(selected) : undefined}
        wide
      >
        {selected ? (
          <div className="px-5 py-2">
            <div className="flex flex-wrap items-center gap-2 py-3">
              <StatusPill status={selected.status} t={t} />
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                  selected.paid
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
                )}
              >
                {selected.paid ? t("payments.paidFlag") : t("payments.notPaidFlag")}
              </span>
              <span className="inline-flex rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-100">
                {selected.final ? t("payments.finalFlag") : t("payments.openFlag")}
              </span>
            </div>
            <PaymentRideSection
              ride={ride}
              loading={rideLoading}
              error={rideError}
              t={t}
            />
            <DetailRow
              label={t("payments.reference")}
              value={selected.merchantTransactionId}
              copyLabel={t("payments.copy")}
              copiedLabel={t("payments.copied")}
              mono
            />
            <DetailRow
              label={t("payments.providerRef")}
              value={selected.providerTransactionId ?? selected.referenceNumber}
              copyLabel={t("payments.copy")}
              copiedLabel={t("payments.copied")}
              mono
            />
            <DetailRow
              label={t("payments.chargeId")}
              value={selected.chargeId}
              copyLabel={t("payments.copy")}
              copiedLabel={t("payments.copied")}
              mono
            />
            <DetailRow
              label={t("payments.amount")}
              value={`${formatKz(selected.amount)} ${selected.currency}`}
            />
            <DetailRow label={t("payments.phone")} value={selected.phoneNumber} />
            <DetailRow label={t("payments.method")} value={selected.paymentMethod} />
            <DetailRow label={t("payments.source")} value={selected.source} />
            <DetailRow label={t("payments.description")} value={selected.description} />
            <DetailRow label={t("payments.message")} value={selected.statusMessage} />
            <DetailRow
              label={t("payments.createdAt")}
              value={formatRideDate(selected.createdAt) || selected.createdAt}
            />
            <DetailRow
              label={t("payments.paidAt")}
              value={formatRideDate(selected.paidAt) || selected.paidAt}
            />
          </div>
        ) : null}
      </OffCanvas>
    </div>
  );
}

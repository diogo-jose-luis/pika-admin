"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { TransactionList } from "@/components/finance/TransactionList";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { useLocale } from "@/components/providers/LocaleProvider";
import {
  defaultTransactionDateRange,
  type FinanceTransaction,
} from "@/lib/finance";

export function TransactionsView() {
  const { t } = useLocale();
  const defaults = defaultTransactionDateRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadTransactions = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);

      try {
        const params = new URLSearchParams({ from: dateFrom, to: dateTo });
        const res = await fetch(`/api/financeiro/transacoes?${params}`, {
          cache: "no-store",
        });
        const json = (await res.json()) as {
          transactions?: FinanceTransaction[];
          error?: string;
        };

        if (!res.ok) {
          throw new Error(json.error ?? t("finance.txLoadError"));
        }

        setTransactions(json.transactions ?? []);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : t("finance.txLoadError"),
        );
        setTransactions([]);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [dateFrom, dateTo, t],
  );

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="flex flex-col gap-4 border-b border-pika-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-pika-ink">
              {t("finance.recentTransactions")}
            </h2>
            <p className="text-xs text-pika-muted">
              {t("finance.txHint")}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                {t("common.from")}
              </span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={loading && !refreshing}
                className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
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
                disabled={loading && !refreshing}
                className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
                aria-label={t("common.dateTo")}
              />
            </label>
            <RefreshDataButton
              loading={refreshing}
              onClick={() => void loadTransactions(true)}
              className="mb-0.5"
            />
          </div>
        </div>

        {loadError ? (
          <p
            className="border-b border-red-200 bg-red-50 px-5 py-3 text-sm text-red-800"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-pika-muted">
            <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">{t("finance.txLoading")}</span>
          </div>
        ) : transactions.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-pika-muted">
            {t("finance.txEmpty")}
          </p>
        ) : (
          <>
            <p className="border-b border-pika-border bg-pika-page/50 px-5 py-2 text-xs text-pika-muted">
              {t("finance.txCount", { count: transactions.length })}
            </p>
            <TransactionList items={transactions} />
          </>
        )}
      </section>
    </div>
  );
}

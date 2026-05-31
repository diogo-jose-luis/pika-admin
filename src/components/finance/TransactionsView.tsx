"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { TransactionList } from "@/components/finance/TransactionList";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import {
  defaultTransactionDateRange,
  type FinanceTransaction,
} from "@/lib/finance";

export function TransactionsView() {
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
          throw new Error(json.error ?? "Erro ao carregar transações.");
        }

        setTransactions(json.transactions ?? []);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Erro ao carregar transações.",
        );
        setTransactions([]);
      } finally {
        if (isRefresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [dateFrom, dateTo],
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
              Transações Recentes
            </h2>
            <p className="text-xs text-pika-muted">
              Corridas concluídas e comissões associadas (valores do Firestore)
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                De
              </span>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={loading && !refreshing}
                className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
                aria-label="Data inicial"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Até
              </span>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={loading && !refreshing}
                className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-50"
                aria-label="Data final"
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
            <span className="text-sm font-medium">A carregar transações…</span>
          </div>
        ) : transactions.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-pika-muted">
            Nenhuma transação encontrada para o período seleccionado.
          </p>
        ) : (
          <>
            <p className="border-b border-pika-border bg-pika-page/50 px-5 py-2 text-xs text-pika-muted">
              {transactions.length} movimentação(ões) • mais recentes primeiro
            </p>
            <TransactionList items={transactions} />
          </>
        )}
      </section>
    </div>
  );
}

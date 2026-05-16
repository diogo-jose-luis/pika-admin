"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { TransactionList } from "@/components/finance/TransactionList";
import {
  TRANSACTION_DATE_FILTERS,
  TRANSACTION_TODAY_KEY,
  TRANSACTIONS_ALL,
  type TransactionDateFilter,
} from "@/lib/transactions-mock";

function filterByDate(
  items: typeof TRANSACTIONS_ALL,
  filter: TransactionDateFilter,
): typeof TRANSACTIONS_ALL {
  if (filter === "Todos") return items;

  const today = new Date(`${TRANSACTION_TODAY_KEY}T12:00:00`);
  const todayKey = TRANSACTION_TODAY_KEY;

  if (filter === "Hoje") {
    return items.filter((t) => t.dateKey === todayKey);
  }

  if (filter === "Ontem") {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const key = yesterday.toISOString().slice(0, 10);
    return items.filter((t) => t.dateKey === key);
  }

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return items.filter((t) => new Date(`${t.dateKey}T12:00:00`) >= weekAgo);
}

export function TransactionsView() {
  const [dateFilter, setDateFilter] = useState<TransactionDateFilter>("Hoje");

  const filtered = useMemo(
    () => filterByDate(TRANSACTIONS_ALL, dateFilter),
    [dateFilter],
  );

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-pika-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-pika-ink">Transações Recentes</h2>
            <p className="text-xs text-pika-muted">Últimas movimentações</p>
          </div>
          <div className="relative shrink-0">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4" />
            </span>
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as TransactionDateFilter)
              }
              className="appearance-none rounded-xl border border-pika-border bg-pika-card py-2.5 pl-10 pr-8 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              {TRANSACTION_DATE_FILTERS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-pika-muted">
            Nenhuma transação encontrada para este período.
          </p>
        ) : (
          <TransactionList items={filtered} />
        )}
      </section>
    </div>
  );
}

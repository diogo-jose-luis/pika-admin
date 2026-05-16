"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import type { FinanceTransaction } from "@/lib/finance";
import { cn } from "@/lib/cn";

type TransactionListProps = {
  items: FinanceTransaction[];
  className?: string;
};

export function TransactionList({ items, className }: TransactionListProps) {
  return (
    <ul className={cn("divide-y divide-pika-border bg-slate-50/50", className)}>
      {items.map((t) => (
        <li
          key={t.id}
          className="flex items-center gap-4 px-5 py-4 transition hover:bg-pika-card/80"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
              t.positive ? "bg-emerald-500" : "bg-red-500",
            )}
          >
            <FontAwesomeIcon
              icon={t.positive ? faArrowUp : faArrowDown}
              className="h-4 w-4"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-pika-ink">{t.label}</p>
            <p className="text-sm text-pika-muted">{t.when}</p>
          </div>
          <p
            className={cn(
              "shrink-0 text-sm font-bold tabular-nums",
              t.positive ? "text-pika-success" : "text-pika-danger",
            )}
          >
            {t.positive ? "+ " : "- "}
            {t.amount}
          </p>
        </li>
      ))}
    </ul>
  );
}

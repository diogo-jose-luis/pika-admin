"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowDown, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { FinanceTransaction } from "@/lib/finance";
import { translateFinanceTransactionLabel } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type TransactionListProps = {
  items: FinanceTransaction[];
  className?: string;
};

export function TransactionList({ items, className }: TransactionListProps) {
  const { t } = useLocale();
  return (
    <ul className={cn("divide-y divide-pika-border bg-slate-50/50", className)}>
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center gap-4 px-5 py-4 transition hover:bg-pika-card/80"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white",
              item.positive ? "bg-emerald-500" : "bg-red-500",
            )}
          >
            <FontAwesomeIcon
              icon={item.positive ? faArrowUp : faArrowDown}
              className="h-4 w-4"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-pika-ink">
              {translateFinanceTransactionLabel(item.label, t)}
            </p>
            {item.subtitle ? (
              <p className="truncate text-sm text-pika-muted">{item.subtitle}</p>
            ) : null}
            <p className="text-xs text-pika-muted/90">{item.when}</p>
          </div>
          <p
            className={cn(
              "shrink-0 text-sm font-bold tabular-nums",
              item.positive ? "text-pika-success" : "text-pika-danger",
            )}
          >
            {item.positive ? "+ " : "- "}
            {item.amount}
          </p>
        </li>
      ))}
    </ul>
  );
}

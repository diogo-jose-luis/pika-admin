"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleXmark,
  faCreditCard,
} from "@fortawesome/free-solid-svg-icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import { ridePaymentMethodKey, type RideRow } from "@/lib/ride-history";
import { cn } from "@/lib/cn";

export function ridePaymentMethodLabel(
  row: Pick<RideRow, "paymentMethodId" | "paymentMethodName">,
  t: (path: string) => string,
): string {
  const key = ridePaymentMethodKey(row.paymentMethodId);
  if (key) return t(key);
  return row.paymentMethodName || "—";
}

export function PaymentMethodBadge({
  row,
}: {
  row: Pick<RideRow, "paymentMethodId" | "paymentMethodName">;
}) {
  const { t } = useLocale();
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-pika-page px-2.5 py-1 text-xs font-semibold text-pika-ink ring-1 ring-pika-border">
      <FontAwesomeIcon icon={faCreditCard} className="h-3 w-3 text-pika-primary" />
      {ridePaymentMethodLabel(row, t)}
    </span>
  );
}

export function PaymentStatusPill({ paid }: { paid: boolean | null }) {
  const { t } = useLocale();
  if (paid == null) {
    return <span className="text-xs text-pika-muted">—</span>;
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        paid
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-red-100",
      )}
    >
      <FontAwesomeIcon
        icon={paid ? faCircleCheck : faCircleXmark}
        className="h-3 w-3"
      />
      {paid ? t("rides.paymentPaid") : t("rides.paymentUnpaid")}
    </span>
  );
}

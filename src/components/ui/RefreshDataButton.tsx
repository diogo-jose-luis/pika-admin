"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";

type RefreshDataButtonProps = {
  onClick: () => void;
  loading?: boolean;
  className?: string;
};

export function RefreshDataButton({
  onClick,
  loading = false,
  className,
}: RefreshDataButtonProps) {
  const { t } = useLocale();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      aria-label={t("common.refresh")}
      title={t("common.refresh")}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pika-border bg-pika-card text-pika-ink transition hover:border-pika-primary hover:text-pika-primary disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <FontAwesomeIcon
        icon={faArrowsRotate}
        className={cn("h-4 w-4", loading && "animate-spin")}
      />
    </button>
  );
}

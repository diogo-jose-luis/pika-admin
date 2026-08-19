"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";

type DeleteConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
  /** Nome ou referência da entidade a eliminar (ex.: "Carlos Pedro"). */
  entityLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
};

export function DeleteConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  entityLabel,
  confirmLabel,
  cancelLabel,
  busy = false,
}: DeleteConfirmModalProps) {
  const { t } = useLocale();
  const resolvedTitle = title ?? t("deleteModal.title");
  const resolvedDescription = description ?? t("deleteModal.description");
  const resolvedConfirm = confirmLabel ?? t("deleteModal.confirm");
  const resolvedCancel = cancelLabel ?? t("common.cancel");
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, busy]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        aria-describedby="delete-confirm-desc"
        className="w-full max-w-md rounded-2xl bg-pika-card px-6 py-8 text-center shadow-xl sm:px-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100">
          <FontAwesomeIcon icon={faTriangleExclamation} className="h-6 w-6" />
        </div>

        <h2
          id="delete-confirm-title"
          className="mt-5 text-xl font-bold text-pika-ink sm:text-2xl"
        >
          {resolvedTitle}
        </h2>

        {entityLabel ? (
          <p className="mt-2 truncate text-sm font-semibold text-pika-primary">
            {entityLabel}
          </p>
        ) : null}

        <p
          id="delete-confirm-desc"
          className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pika-muted"
        >
          {resolvedDescription}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={cn(
              "min-w-[8rem] flex-1 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 sm:flex-none",
              busy && "cursor-not-allowed opacity-60",
            )}
          >
            {busy ? t("common.deleting") : resolvedConfirm}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className={cn(
              "min-w-[8rem] flex-1 rounded-xl bg-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-300 sm:flex-none",
              busy && "cursor-not-allowed opacity-60",
            )}
          >
            {resolvedCancel}
          </button>
        </div>
      </div>
    </div>
  );
}

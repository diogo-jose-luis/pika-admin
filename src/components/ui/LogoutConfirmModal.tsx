"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/components/providers/LocaleProvider";
import { FaIcon } from "@/components/ui/FaIcon";

type LogoutConfirmModalProps = {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function LogoutConfirmModal({
  open,
  pending = false,
  onConfirm,
  onCancel,
}: LogoutConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, pending]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !pending) onCancel();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        aria-describedby="logout-confirm-desc"
        className="w-full max-w-md rounded-2xl bg-pika-card px-6 py-8 text-center shadow-xl sm:px-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pika-primary/15 text-pika-primary">
          <FaIcon name="sign-out" className="h-7 w-7" title={t("logout.label")} />
        </div>
        <h2
          id="logout-confirm-title"
          className="mt-5 text-xl font-bold text-pika-ink sm:text-2xl"
        >
          {t("logout.title")}
        </h2>
        <p
          id="logout-confirm-desc"
          className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pika-muted"
        >
          {t("logout.description")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="min-w-[8rem] flex-1 rounded-xl bg-pika-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
          >
            {pending ? t("logout.leaving") : t("logout.label")}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="min-w-[8rem] flex-1 rounded-xl bg-slate-300 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none"
          >
            {t("common.cancel")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

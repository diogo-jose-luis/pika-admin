"use client";

import { useEffect } from "react";

type DeleteConfirmModalProps = {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
};

export function DeleteConfirmModal({
  open,
  onConfirm,
  onCancel,
  title = "Eliminar Usuário?",
  description = "Tem certeza de que deseja eliminar este usuário? Esta ação é irreversível e removerá todas as informações associadas a ela.",
}: DeleteConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
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
        <h2
          id="delete-confirm-title"
          className="text-xl font-bold text-pika-ink sm:text-2xl"
        >
          {title}
        </h2>
        <p
          id="delete-confirm-desc"
          className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-pika-ink"
        >
          {description}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onConfirm}
            className="min-w-[8rem] flex-1 rounded-xl bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-600 sm:flex-none"
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-w-[8rem] flex-1 rounded-xl bg-slate-300 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-400 sm:flex-none"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

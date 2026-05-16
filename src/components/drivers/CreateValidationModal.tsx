"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useId } from "react";
import type { DriverSelectOption } from "@/lib/validacao-motorista";

type CreateValidationModalProps = {
  open: boolean;
  drivers: DriverSelectOption[];
  motoristaId: string;
  saving: boolean;
  onMotoristaIdChange: (id: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function CreateValidationModal({
  open,
  drivers,
  motoristaId,
  saving,
  onMotoristaIdChange,
  onClose,
  onSubmit,
}: CreateValidationModalProps) {
  const titleId = useId();
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        id={panelId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl bg-pika-card p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-bold text-pika-ink">
            Nova solicitação de validação
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pika-border text-pika-muted transition hover:bg-pika-page disabled:opacity-50"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-pika-muted">
          Cria um registo pendente quando o motorista reporta submissão sem registo
          na fila.
        </p>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium text-pika-ink">Motorista</span>
          <select
            value={motoristaId}
            onChange={(e) => onMotoristaIdChange(e.target.value)}
            className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card"
          >
            <option value="">Selecionar motorista</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} — {d.email}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex flex-1 items-center justify-center rounded-xl border border-pika-border bg-pika-page px-4 py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-pika-card disabled:opacity-50 sm:flex-none"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!motoristaId || saving}
            className="inline-flex flex-1 items-center justify-center rounded-xl bg-pika-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            {saving ? "A criar…" : "Criar solicitação"}
          </button>
        </div>
      </div>
    </div>
  );
}

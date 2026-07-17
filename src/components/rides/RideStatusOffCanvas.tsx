"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import type { RideRow } from "@/lib/ride-history";
import { cn } from "@/lib/cn";

export type RideEstadoUpdate = 1 | 2;

type RideStatusOffCanvasProps = {
  ride: RideRow;
  onClose: () => void;
  onSaved: (updated: RideRow) => void;
};

export function RideStatusOffCanvas({
  ride,
  onClose,
  onSaved,
}: RideStatusOffCanvasProps) {
  const initialEstado: RideEstadoUpdate =
    ride.estado === 2 ? 2 : 1;
  const [estado, setEstado] = useState<RideEstadoUpdate>(initialEstado);
  const [nota, setNota] = useState(ride.note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, busy]);

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/corridas/historico", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ride.docId,
          estado,
          nota: nota.trim(),
        }),
      });
      const data = (await res.json()) as { row?: RideRow; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar a corrida.");
      }

      if (!data.row) {
        throw new Error("Resposta inválida do servidor.");
      }

      onSaved(data.row);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar a corrida.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/40"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="ride-status-offcanvas-title"
        className="flex h-full w-full max-w-md flex-col bg-pika-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-pika-border p-5">
          <div>
            <h2
              id="ride-status-offcanvas-title"
              className="text-lg font-bold text-pika-ink"
            >
              Alterar estado #{ride.id}
            </h2>
            <p className="mt-0.5 text-xs text-pika-muted">
              {ride.passenger} · {ride.driver}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pika-border text-pika-muted transition hover:bg-pika-page hover:text-pika-ink disabled:opacity-50"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-5">
          <fieldset>
            <legend className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Estado da corrida
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <EstadoOption
                label="Concluída"
                description="Estado 1"
                selected={estado === 1}
                onSelect={() => setEstado(1)}
                disabled={busy}
                tone="success"
              />
              <EstadoOption
                label="Cancelada"
                description="Estado 2"
                selected={estado === 2}
                onSelect={() => setEstado(2)}
                disabled={busy}
                tone="danger"
              />
            </div>
          </fieldset>

          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Nota
            </span>
            <textarea
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              disabled={busy}
              rows={6}
              placeholder="Descreva o motivo da alteração ou informação relevante…"
              className="mt-2 w-full resize-y rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2 disabled:opacity-60"
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-pika-border p-5">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-pika-border bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={busy}
            className="rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "A guardar…" : "Guardar alterações"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function EstadoOption({
  label,
  description,
  selected,
  onSelect,
  disabled,
  tone,
}: {
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
  tone: "success" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "rounded-xl border px-3 py-3 text-left transition disabled:opacity-50",
        selected
          ? tone === "success"
            ? "border-emerald-300 bg-emerald-50 ring-2 ring-emerald-100"
            : "border-red-300 bg-red-50 ring-2 ring-red-100"
          : "border-pika-border bg-pika-card hover:bg-pika-page",
      )}
    >
      <span
        className={cn(
          "block text-sm font-semibold",
          selected
            ? tone === "success"
              ? "text-emerald-800"
              : "text-red-800"
            : "text-pika-ink",
        )}
      >
        {label}
      </span>
      <span className="mt-0.5 block text-xs text-pika-muted">{description}</span>
    </button>
  );
}

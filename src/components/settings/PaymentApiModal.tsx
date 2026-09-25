"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";
import {
  apiPagamentoToInput,
  type ApiPagamento,
  type ApiPagamentoInput,
} from "@/lib/api-pagamentos";
import { cn } from "@/lib/cn";

const EMPTY_FORM: ApiPagamentoInput = {
  provedor: "",
  base_url: "",
  api_key: "",
};

type PaymentApiModalProps = {
  open: boolean;
  mode: "create" | "edit";
  record?: ApiPagamento | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: ApiPagamentoInput) => void;
};

function fieldClass(extra?: string) {
  return cn(
    "mt-1.5 w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:bg-pika-card focus:ring-2 focus:ring-pika-primary/20",
    extra,
  );
}

export function PaymentApiModal({
  open,
  mode,
  record,
  saving = false,
  onClose,
  onSubmit,
}: PaymentApiModalProps) {
  const [form, setForm] = useState<ApiPagamentoInput>(EMPTY_FORM);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(record ? apiPagamentoToInput(record) : { ...EMPTY_FORM });
    setShowKey(false);
  }, [open, record]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const title = mode === "create" ? "Nova API de pagamentos" : "Editar API de pagamentos";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-api-modal-title"
        className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-pika-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-pika-border px-5 py-4">
          <h2 id="payment-api-modal-title" className="text-lg font-bold text-pika-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink disabled:opacity-50"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Provedor
            </label>
            <input
              type="text"
              required
              value={form.provedor}
              onChange={(e) => setForm((f) => ({ ...f, provedor: e.target.value }))}
              className={fieldClass()}
              placeholder="Ex.: AppyPay"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              URL base
            </label>
            <input
              type="url"
              required
              value={form.base_url}
              onChange={(e) => setForm((f) => ({ ...f, base_url: e.target.value }))}
              className={fieldClass()}
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Chave da API
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                required
                autoComplete="off"
                value={form.api_key}
                onChange={(e) => setForm((f) => ({ ...f, api_key: e.target.value }))}
                className={fieldClass("pr-11")}
                placeholder="Chave secreta do provedor"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute inset-y-0 right-0 mt-1.5 flex w-11 items-center justify-center text-pika-muted transition hover:text-pika-ink"
                aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
              >
                <FontAwesomeIcon icon={showKey ? faEyeSlash : faEye} className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-pika-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-pika-border px-4 py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-pika-page disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:opacity-50"
            >
              {saving ? "A guardar…" : mode === "create" ? "Registar API" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

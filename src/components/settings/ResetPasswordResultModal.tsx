"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCopy,
  faEye,
  faEyeSlash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { AuthUser } from "@/lib/auth-types";
import { cn } from "@/lib/cn";

type ResetPasswordResultModalProps = {
  open: boolean;
  user: AuthUser | null;
  password: string;
  onClose: () => void;
};

export function ResetPasswordResultModal({
  open,
  user,
  password,
  onClose,
}: ResetPasswordResultModalProps) {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open || !user) return null;

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-result-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-pika-border bg-pika-card p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="reset-password-result-title"
              className="text-lg font-bold text-pika-ink"
            >
              Nova palavra-passe
            </h2>
            <p className="mt-1 text-sm text-pika-muted">
              {user.name} · {user.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-pika-muted">
          A palavra-passe foi alterada na API. Copie e comunique ao utilizador —
          <strong className="font-semibold text-pika-ink"> não foi enviada por e-mail</strong>.
        </p>

        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
            Palavra-passe gerada
          </label>
          <div className="mt-1.5 flex gap-2">
            <input
              type={visible ? "text" : "password"}
              readOnly
              value={password}
              className="min-w-0 flex-1 rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 font-mono text-sm text-pika-ink"
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-pika-border text-pika-ink transition hover:bg-pika-page"
              aria-label={visible ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
            >
              <FontAwesomeIcon
                icon={visible ? faEyeSlash : faEye}
                className="h-4 w-4"
              />
            </button>
            <button
              type="button"
              onClick={() => void copyPassword()}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition",
                copied
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-pika-primary text-white hover:bg-pika-primary-dark",
              )}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="h-4 w-4" />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-pika-primary-dark"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

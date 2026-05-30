"use client";

import { useState } from "react";
import axios from "axios";
import { FaIcon } from "@/components/ui/FaIcon";
import { API_PROXY_PATH } from "@/lib/apiBaseUrl";
import { cn } from "@/lib/cn";

const inputClassName =
  "w-full rounded-xl border border-pika-primary bg-[#f0f0f0] py-3 pl-4 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-500 focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/25 disabled:cursor-not-allowed disabled:opacity-60";

type ForgotPasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ForgotPasswordModal({ open, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);

    try {
      await axios.post(`${API_PROXY_PATH}/forgot-password`, {
        email: email.trim(),
      });
      setMessage(
        "Se o e-mail estiver registado, receberá em breve uma nova palavra-passe.",
      );
      setEmail("");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        const errors = err.response.data?.errors as Record<string, string[]> | undefined;
        const first = errors ? Object.values(errors).flat()[0] : null;
        setError(first ?? "Verifique o e-mail introduzido.");
      } else {
        setError("Não foi possível processar o pedido. Tente novamente.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="forgot-password-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id="forgot-password-title"
              className="text-lg font-bold text-neutral-900"
            >
              Recuperar palavra-passe
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              Indique o e-mail da sua conta. Enviaremos uma nova palavra-passe se
              estiver registado.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition hover:bg-neutral-100"
            aria-label="Fechar"
          >
            <FaIcon name="times" className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-neutral-900">
              E-mail
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending}
              autoComplete="email"
              className={inputClassName}
            />
          </label>

          {error ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {message ? (
            <p
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
              role="status"
            >
              {message}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-pika-primary-dark disabled:opacity-70",
              )}
            >
              {pending ? (
                <>
                  <FaIcon name="spinner" className="h-4 w-4 animate-spin" />
                  A enviar…
                </>
              ) : (
                "Enviar pedido"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

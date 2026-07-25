"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { OffCanvas } from "@/components/ui/OffCanvas";
import {
  PUSH_AUDIENCE_OPTIONS,
  PUSH_MAX_BODY,
  PUSH_MAX_TITLE,
  type PushAudience,
} from "@/lib/push-audience";

type PushNotificationOffCanvasProps = {
  open: boolean;
  onClose: () => void;
  /** IDs dos utilizadores selecionados nas listas. */
  selectedIds: string[];
  /** Audiência pré-selecionada quando não há seleção. */
  defaultAudience: PushAudience;
  /** Rótulo do contexto (ex.: "motoristas" / "passageiros"). */
  contextLabel: string;
};

export function PushNotificationOffCanvas({
  open,
  onClose,
  selectedIds,
  defaultAudience,
  contextLabel,
}: PushNotificationOffCanvasProps) {
  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [audience, setAudience] = useState<PushAudience>(defaultAudience);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const hasSelection = selectedIds.length > 0;

  useEffect(() => {
    if (!open) return;
    setTitulo("");
    setMensagem("");
    setAudience(defaultAudience);
    setError(null);
    setSuccess(null);
    setBusy(false);
  }, [open, defaultAudience]);

  const subtitle = useMemo(() => {
    if (hasSelection) {
      const n = selectedIds.length;
      return `${n} ${contextLabel} selecionado${n === 1 ? "" : "s"}`;
    }
    const label =
      PUSH_AUDIENCE_OPTIONS.find((o) => o.value === audience)?.label ?? audience;
    return `Enviar para: ${label}`;
  }, [hasSelection, selectedIds.length, contextLabel, audience]);

  const canSend =
    titulo.trim().length > 0 &&
    mensagem.trim().length > 0 &&
    !busy &&
    (hasSelection || Boolean(audience));

  async function send() {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: {
        titulo: string;
        mensagem: string;
        ids?: string[];
        audience?: PushAudience;
      } = {
        titulo: titulo.trim(),
        mensagem: mensagem.trim(),
      };

      if (hasSelection) {
        payload.ids = selectedIds;
      } else {
        payload.audience = audience;
      }

      const res = await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        processed?: number;
        requested?: number;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível enviar a notificação.");
      }

      const processed = data.processed ?? 0;
      const requested = data.requested ?? processed;
      setSuccess(
        `Push enviado para ${processed} de ${requested} destinatário${requested === 1 ? "" : "s"}.`,
      );
      setTitulo("");
      setMensagem("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar a notificação.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <OffCanvas
      open={open}
      onClose={onClose}
      title="Enviar push notification"
      subtitle={subtitle}
      busy={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-pika-border bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
            className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faPaperPlane} className="h-3.5 w-3.5" />
            {busy ? "A enviar…" : "Enviar push"}
          </button>
        </>
      }
    >
      <div className="space-y-4 p-5 text-sm">
        {!hasSelection ? (
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Destinatários
            </span>
            <div className="relative mt-2">
              <select
                value={audience}
                onChange={(e) => setAudience(e.target.value as PushAudience)}
                disabled={busy}
                className="w-full appearance-none rounded-xl border border-pika-border bg-pika-card py-2.5 pl-3 pr-10 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2 disabled:opacity-60"
              >
                {PUSH_AUDIENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-pika-muted">
                <FontAwesomeIcon icon={faChevronDown} className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1.5 text-xs text-pika-muted">
              Sem seleção na lista, o envio usa este destinatário. Mais tarde
              poderá também notificar por e-mail.
            </p>
          </label>
        ) : (
          <p className="rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-xs text-pika-muted">
            A notificação será enviada apenas aos{" "}
            <span className="font-semibold text-pika-ink">
              {selectedIds.length}
            </span>{" "}
            {contextLabel} selecionado{selectedIds.length === 1 ? "" : "s"}.
          </p>
        )}

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
            Título
          </span>
          <input
            type="text"
            value={titulo}
            maxLength={PUSH_MAX_TITLE}
            disabled={busy}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Atualização PIKA"
            className="mt-2 w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2 disabled:opacity-60"
          />
          <span className="mt-1 block text-right text-[11px] text-pika-muted">
            {titulo.length}/{PUSH_MAX_TITLE}
          </span>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
            Mensagem
          </span>
          <textarea
            value={mensagem}
            maxLength={PUSH_MAX_BODY}
            disabled={busy}
            rows={6}
            onChange={(e) => setMensagem(e.target.value)}
            placeholder="Escreva a mensagem que aparece no telemóvel…"
            className="mt-2 w-full resize-y rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2 disabled:opacity-60"
          />
          <span className="mt-1 block text-right text-[11px] text-pika-muted">
            {mensagem.length}/{PUSH_MAX_BODY}
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        ) : null}
      </div>
    </OffCanvas>
  );
}

"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCheck,
  faIdCard,
  faPhone,
  faBuildingColumns,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/cn";
import type { AlterarDadosDetail } from "@/lib/alterar-dados";

type AlterarDadosDetailsModalProps = {
  detail: AlterarDadosDetail;
  busy: boolean;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
};

function statusPillClass(status: string): string {
  switch (status) {
    case "Aprovado":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    case "Rejeitado":
      return "bg-red-50 text-red-700 ring-1 ring-red-100";
    default:
      return "bg-orange-50 text-orange-700 ring-1 ring-orange-100";
  }
}

function Field({
  label,
  requested,
  current,
}: {
  label: string;
  requested: string;
  current?: string;
}) {
  const changed = current != null && current !== "—" && requested !== "—" && requested !== current;
  return (
    <div className="rounded-xl border border-pika-border bg-pika-page/60 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-pika-ink">
        {requested || "—"}
      </p>
      {current != null ? (
        <p
          className={cn(
            "mt-0.5 text-xs",
            changed ? "font-medium text-pika-primary" : "text-pika-muted",
          )}
        >
          Atual: {current}
        </p>
      ) : null}
    </div>
  );
}

function boolLabel(value: boolean | null): string {
  if (value == null) return "—";
  return value ? "Sim" : "Não";
}

export function AlterarDadosDetailsModal({
  detail,
  busy,
  onClose,
  onApprove,
  onReject,
}: AlterarDadosDetailsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const pending = detail.statusCode === 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="alterar-dados-title"
        className="max-h-[min(92vh,860px)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-pika-card p-6 shadow-xl sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2
              id="alterar-dados-title"
              className="text-xl font-bold text-pika-ink"
            >
              {detail.nome}
            </h2>
            <p className="mt-1 text-sm text-pika-muted">
              {detail.createdAtLabel} · UID {detail.uid || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                statusPillClass(detail.status),
              )}
            >
              {detail.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-pika-border text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
              aria-label="Fechar"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!detail.userFound ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Não foi encontrado um utilizador em <code>users</code> com este UID.
            Aprovar não copiará os dados até o uid estar correto.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Nome"
            requested={detail.nome}
            current={detail.current?.displayName}
          />
          <Field
            label="Telefone"
            requested={detail.telefone}
            current={detail.current?.phone}
          />
          <Field
            label="IBAN"
            requested={detail.iban}
            current={detail.current?.iban}
          />
          <Field
            label="Nº do bilhete"
            requested={detail.bilheteNumero}
            current={detail.current?.bilheteNumero}
          />
          <Field
            label="Nome da empresa"
            requested={detail.nomeEmpresa}
            current={detail.current?.nomeEmpresa}
          />
          <Field
            label="Sobre"
            requested={detail.sobre || "—"}
            current={detail.current?.sobre}
          />
          <Field
            label="Mostrar trânsito no mapa"
            requested={boolLabel(detail.mostrarTransitoMapa)}
          />
          <Field
            label="Mostrar a minha localização"
            requested={boolLabel(detail.mostrarMinhaLocalizacao)}
          />
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold text-pika-primary">Documentos</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {detail.images.map((img) => (
              <figure
                key={img.key}
                className="overflow-hidden rounded-xl border border-pika-border bg-pika-page"
              >
                <figcaption className="flex items-center gap-2 border-b border-pika-border px-3 py-2 text-xs font-semibold text-pika-ink">
                  <FontAwesomeIcon icon={faIdCard} className="h-3.5 w-3.5 text-pika-muted" />
                  {img.label}
                </figcaption>
                {img.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.url}
                    alt={img.label}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <p className="px-3 py-10 text-center text-sm text-pika-muted">
                    Sem documento
                  </p>
                )}
              </figure>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 text-xs text-pika-muted">
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUser} className="h-3 w-3" />
            {detail.currentName}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faPhone} className="h-3 w-3" />
            {detail.telefone}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faBuildingColumns} className="h-3 w-3" />
            {detail.iban}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FontAwesomeIcon icon={faBuilding} className="h-3 w-3" />
            {detail.nomeEmpresa}
          </span>
        </div>

        {pending ? (
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onReject}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-pika-card px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              Rejeitar
            </button>
            <button
              type="button"
              onClick={onApprove}
              disabled={busy || !detail.userFound}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
              {busy ? "A aplicar…" : "Aprovar e copiar para users"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

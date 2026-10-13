"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPhone } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import type { DefinicaoChamadaRecord } from "@/lib/definicao-chamada";

function SettingsSwitch({
  checked,
  onChange,
  labelledBy,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pika-primary disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-pika-primary" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function CallDefinitionTab() {
  const internaId = useId();
  const movelId = useId();

  const [docId, setDocId] = useState<string | null>(null);
  const [chamadaInterna, setChamadaInterna] = useState(false);
  const [chamadaOperadoraMovel, setChamadaOperadoraMovel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/definicao-chamada", { cache: "no-store" });
      const data = (await res.json()) as {
        record?: DefinicaoChamadaRecord | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível carregar a definição de chamadas.",
        );
      }

      if (data.record) {
        setDocId(data.record.id);
        setChamadaInterna(data.record.chamadaInterna);
        setChamadaOperadoraMovel(data.record.chamadaOperadoraMovel);
      } else {
        setDocId(null);
        setChamadaInterna(false);
        setChamadaOperadoraMovel(false);
      }
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erro ao carregar a definição de chamadas.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    const hadRecord = Boolean(docId);

    try {
      const res = await fetch("/api/definicao-chamada", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: docId,
          chamadaInterna,
          chamadaOperadoraMovel,
        }),
      });
      const data = (await res.json()) as {
        record?: DefinicaoChamadaRecord;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível guardar a definição de chamadas.",
        );
      }

      if (data.record) {
        setDocId(data.record.id);
        setChamadaInterna(data.record.chamadaInterna);
        setChamadaOperadoraMovel(data.record.chamadaOperadoraMovel);
      }

      setMessage({
        type: "success",
        text: hadRecord
          ? "Definição de chamadas atualizada."
          : "Definição de chamadas registada.",
      });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Erro ao guardar a definição de chamadas.",
      });
    } finally {
      setSaving(false);
    }
  };

  const rows = [
    {
      id: internaId,
      title: "Chamada interna",
      desc: "Chamada através da API do Agora.io. Ative para disponibilizar esta opção na app.",
      checked: chamadaInterna,
      set: setChamadaInterna,
    },
    {
      id: movelId,
      title: "Chamada por operadora móvel",
      desc: "Chamada normal usando o número de telefone do utilizador. Ative para disponibilizar esta opção na app.",
      checked: chamadaOperadoraMovel,
      set: setChamadaOperadoraMovel,
    },
  ];

  return (
    <section className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pika-primary/10 text-pika-primary">
          <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-base font-bold text-pika-ink md:text-lg">
            Definição de chamadas
          </h2>
          <p className="mt-1 text-sm text-pika-muted">
            Escolha quais tipos de chamada ficam disponíveis na aplicação. Sim
            ativa a opção e Não desativa.
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-pika-border">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="min-w-0">
              <p id={row.id} className="font-semibold text-pika-ink">
                {row.title}
              </p>
              <p className="mt-1 text-sm text-pika-muted">{row.desc}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span
                className={cn(
                  "text-sm font-semibold",
                  row.checked ? "text-pika-primary" : "text-pika-muted",
                )}
              >
                {row.checked ? "Sim" : "Não"}
              </span>
              <SettingsSwitch
                checked={row.checked}
                onChange={row.set}
                labelledBy={row.id}
                disabled={loading || saving}
              />
            </div>
          </div>
        ))}
      </div>

      {message ? (
        <p
          className={cn(
            "mt-2 text-xs font-medium",
            message.type === "error" ? "text-red-600" : "text-emerald-700",
          )}
        >
          {message.text}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end border-t border-pika-border pt-5">
        <button
          type="button"
          onClick={() => void save()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
          {saving
            ? "A guardar…"
            : docId
              ? "Atualizar definição"
              : "Registar definição"}
        </button>
      </div>
    </section>
  );
}

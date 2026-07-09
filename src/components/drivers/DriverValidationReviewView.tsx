"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRotateLeft,
  faCheck,
  faFileLines,
  faMagnifyingGlassMinus,
  faMagnifyingGlassPlus,
  faPen,
  faRotateRight,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type {
  ValidacaoMotoristaDetail,
  ValidationDocumentId,
} from "@/lib/validacao-motorista";
import { cn } from "@/lib/cn";

type DriverValidationReviewViewProps = {
  detail: ValidacaoMotoristaDetail;
  onStatusUpdated?: () => void;
};

function tabIconClass(active: boolean) {
  return cn("h-4 w-4 shrink-0", active ? "text-white" : "text-pika-muted");
}

export function DriverValidationReviewView({
  detail,
  onStatusUpdated,
}: DriverValidationReviewViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ValidationDocumentId>("cnh");
  const [zoom, setZoom] = useState(100);
  const [saving, setSaving] = useState(false);
  const [vehicleSaving, setVehicleSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [vehicleForm, setVehicleForm] = useState({
    marca: detail.marca,
    modelo: detail.modelo,
    matricula: detail.matricula,
    ano: detail.ano,
  });

  useEffect(() => {
    setVehicleForm({
      marca: detail.marca,
      modelo: detail.modelo,
      matricula: detail.matricula,
      ano: detail.ano,
    });
  }, [detail.marca, detail.modelo, detail.matricula, detail.ano]);

  const saveVehicle = async () => {
    setVehicleSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/validacao-motoristas/${detail.id}/veiculo`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicleForm),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível guardar o veículo.");
      }
      onStatusUpdated?.();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível guardar o veículo.",
      );
    } finally {
      setVehicleSaving(false);
    }
  };

  const updateStatus = async (status: number) => {
    setSaving(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/validacao-motoristas/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar o estado.");
      }
      onStatusUpdated?.();
      if (status === 1) {
        router.push("/validacao-motoristas");
        router.refresh();
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível atualizar o estado.",
      );
    } finally {
      setSaving(false);
    }
  };

  const doc = detail.documents[activeTab];
  const activeTabMeta = detail.documentTabs.find((t) => t.id === activeTab);

  return (
    <div className="space-y-5 md:space-y-6">
      <Link
        href="/validacao-motoristas"
        className="inline-flex items-center gap-2 text-sm font-medium text-pika-primary transition hover:text-pika-primary-dark"
      >
        ← Voltar à fila
      </Link>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(280px,340px)_1fr] xl:gap-6">
        {/* Painel esquerdo — dados do motorista */}
        <aside className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
          <div className="flex flex-col items-center border-b border-pika-border pb-6">
            <div className="relative">
              {detail.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detail.photoUrl}
                  alt={`Fotografia de ${detail.driverDisplayName}`}
                  className="h-28 w-28 rounded-full border-2 border-white object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-amber-300 text-3xl font-bold text-amber-950">
                  {detail.driverDisplayName
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
              )}
              <button
                type="button"
                className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-pika-card text-pika-muted shadow-sm transition hover:text-pika-ink"
                aria-label="Editar foto"
              >
                <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
              </button>
            </div>
            <h2 className="mt-4 text-center text-lg font-bold text-pika-ink">
              {detail.driverDisplayName}
            </h2>
            <p className="mt-1 text-xs text-pika-muted">{detail.row.requestCode}</p>
          </div>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-pika-primary">Dados pessoais</h3>
            <dl className="mt-3 space-y-3">
              <Field label="B.I" value={detail.bi} />
              <Field label="Telefone" value={detail.phone} />
              <Field label="E-mail" value={detail.email} />
              <Field label="IBAN" value={detail.iban} />
              <Field label="Ano" value={detail.ano || "—"} />
              <Field label="Cidade" value={detail.city} />
            </dl>
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-bold text-pika-primary">Veículo</h3>
            <div className="mt-3 space-y-3">
              <VehicleInput
                label="Marca"
                value={vehicleForm.marca}
                onChange={(marca) => setVehicleForm((f) => ({ ...f, marca }))}
              />
              <VehicleInput
                label="Modelo"
                value={vehicleForm.modelo}
                onChange={(modelo) => setVehicleForm((f) => ({ ...f, modelo }))}
              />
              <VehicleInput
                label="Matrícula"
                value={vehicleForm.matricula}
                onChange={(matricula) => setVehicleForm((f) => ({ ...f, matricula }))}
              />
              <VehicleInput
                label="Ano"
                value={vehicleForm.ano}
                inputMode="numeric"
                onChange={(ano) => setVehicleForm((f) => ({ ...f, ano }))}
              />
              <button
                type="button"
                disabled={vehicleSaving || saving}
                onClick={() => void saveVehicle()}
                className="w-full rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {vehicleSaving ? "A guardar veículo…" : "Guardar veículo"}
              </button>
            </div>
          </section>
        </aside>

        {/* Painel direito — documentos */}
        <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-pika-border bg-pika-card shadow-sm">
          <div className="flex flex-wrap gap-1 border-b border-pika-border bg-pika-page/50 p-2">
            {detail.documentTabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:text-sm",
                    active
                      ? "bg-pika-primary text-white shadow-sm"
                      : "text-pika-muted hover:bg-pika-card hover:text-pika-ink",
                  )}
                >
                  {tab.icon === "selfie" ? (
                    <FontAwesomeIcon icon={faUser} className={tabIconClass(active)} />
                  ) : (
                    <FontAwesomeIcon
                      icon={faFileLines}
                      className={tabIconClass(active)}
                    />
                  )}
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-pika-border bg-pika-page/30 px-4 py-2.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(50, z - 10))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-card text-pika-muted transition hover:text-pika-ink"
              aria-label="Reduzir zoom"
            >
              <FontAwesomeIcon icon={faMagnifyingGlassMinus} className="h-4 w-4" />
            </button>
            <span className="min-w-[3rem] text-center text-sm font-semibold text-pika-ink">
              {zoom}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(200, z + 10))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-card text-pika-muted transition hover:text-pika-ink"
              aria-label="Aumentar zoom"
            >
              <FontAwesomeIcon icon={faMagnifyingGlassPlus} className="h-4 w-4" />
            </button>
            <span className="mx-1 hidden h-6 w-px bg-pika-border sm:block" aria-hidden />
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-card text-pika-muted transition hover:text-pika-ink"
              aria-label="Rodar documento"
            >
              <FontAwesomeIcon icon={faRotateRight} className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-1 flex-col overflow-auto bg-slate-100/80 p-4 md:p-6">
            <div
              className="flex min-h-[320px] flex-1 flex-col items-center justify-center rounded-xl border border-pika-border/60 bg-slate-200/60 p-4 text-center transition-transform md:p-8"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
            >
              {doc.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doc.imageUrl}
                  alt={doc.title}
                  className="max-h-[min(60vh,520px)] w-auto max-w-full rounded-lg object-contain shadow-md"
                />
              ) : (
                <>
                  <FontAwesomeIcon
                    icon={faFileLines}
                    className="h-16 w-16 text-pika-muted/50"
                  />
                  <p className="mt-4 max-w-md text-base font-semibold text-pika-ink">
                    {doc.title}
                  </p>
                  <p className="mt-1 text-sm text-pika-muted">{doc.subtitle}</p>
                  <p className="mt-2 font-mono text-xs text-pika-muted">{doc.fileRef}</p>
                  <p className="mt-3 text-sm text-pika-muted">
                    Imagem do documento não disponível.
                  </p>
                </>
              )}
              {activeTabMeta ? (
                <p className="sr-only">Aba ativa: {activeTabMeta.label}</p>
              ) : null}
            </div>
          </div>

          <footer className="flex flex-col gap-4 border-t border-pika-border bg-pika-page/40 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="max-w-md space-y-1">
              <p className="text-xs leading-relaxed text-pika-muted">
                Revisão — todas as decisões são auditadas e visíveis no log de
                compliance.
              </p>
              <p className="text-xs font-medium text-pika-ink">
                Estado atual: {detail.row.status}
              </p>
              {actionError ? (
                <p className="text-xs text-red-600">{actionError}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus(2)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-red-500 bg-pika-card px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
                Rejeitar Definitivamente
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus(4)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-orange-500 bg-pika-card px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faArrowRotateLeft} className="h-4 w-4" />
                Solicitar Reenvio
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus(3)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-sky-500 bg-pika-card px-4 py-2.5 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
              >
                Em revisão
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void updateStatus(1)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="h-4 w-4" />
                {saving ? "A guardar…" : "Aprovar Motorista"}
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-pika-muted">{label}</dt>
      <dd className="mt-1 rounded-lg border border-pika-border bg-pika-page/80 px-3 py-2.5 text-sm text-pika-ink">
        {value}
      </dd>
    </div>
  );
}

function VehicleInput({
  label,
  value,
  onChange,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-pika-muted">{label}</span>
      <input
        type="text"
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-pika-border bg-pika-page/80 px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card focus:ring-2 focus:ring-pika-primary/20"
      />
    </label>
  );
}

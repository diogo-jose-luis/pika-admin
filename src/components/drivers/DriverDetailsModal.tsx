"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuildingColumns,
  faCar,
  faEnvelope,
  faFileLines,
  faGaugeHigh,
  faLocationDot,
  faPhone,
  faStar,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, type ReactNode } from "react";
import type { DriverCard } from "@/lib/drivers";
import { cn } from "@/lib/cn";

type DriverDetailsModalProps = {
  driver: DriverCard;
  onClose: () => void;
};

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-pika-border bg-pika-card p-4 sm:p-5">
      <h3 className="text-sm font-bold text-pika-primary">{title}</h3>
      <ul className="mt-3 space-y-2.5 text-sm text-pika-ink">{children}</ul>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: typeof faEnvelope;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-2.5">
      <FontAwesomeIcon icon={icon} className="mt-0.5 h-4 w-4 shrink-0 text-pika-ink" />
      <span>
        {label ? <span className="font-medium">{label}: </span> : null}
        {value}
      </span>
    </li>
  );
}

export function DriverDetailsModal({ driver, onClose }: DriverDetailsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const okDocs = driver.verificationDocs.filter((d) => d.ok);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="driver-details-title"
        className="max-h-[min(92vh,820px)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-pika-card p-6 shadow-xl sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <h2 id="driver-details-title" className="text-xl font-bold text-pika-ink">
            Detalhes do Motorista
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pika-border text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div
            className={cn(
              "flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold sm:h-24 sm:w-24",
              driver.avatarClass,
            )}
          >
            {driver.initials}
          </div>
          <div>
            <p className="text-2xl font-bold text-pika-ink sm:text-3xl">{driver.name}</p>
            <p className="mt-1 text-sm font-medium text-pika-muted">{driver.id}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-pika-ink">
              <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{driver.rating}</span>
              <span className="text-pika-muted">Avaliação</span>
            </p>
          </div>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoCard title="Contato">
            <InfoRow icon={faEnvelope} label="Email" value={driver.email} />
            <InfoRow icon={faPhone} label="Telefone" value={driver.phone} />
            <InfoRow icon={faBuildingColumns} label="IBAN" value={driver.iban} />
            <InfoRow
              icon={faGaugeHigh}
              label="Disponibilidade"
              value={driver.onlineLabel}
            />
            <li className="flex items-start gap-2.5">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-0.5 h-4 w-4 shrink-0 text-pika-ink"
              />
              <span>
                <span className="font-medium">Última localização: </span>
                {driver.lastLocationMapsUrl ? (
                  <a
                    href={driver.lastLocationMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-pika-primary underline-offset-2 hover:underline"
                  >
                    {driver.lastLocationLabel}
                  </a>
                ) : (
                  driver.lastLocationLabel
                )}
              </span>
            </li>
          </InfoCard>
          <InfoCard title="Veículo">
            <InfoRow icon={faCar} label="" value={driver.vehicleModel} />
            <li className="pl-6 text-sm text-pika-ink">
              <span className="font-medium">Placa:</span> {driver.vehiclePlate}
            </li>
            <li className="pl-6 text-sm text-pika-ink">
              <span className="font-medium">Cor:</span> {driver.vehicleColor}
            </li>
          </InfoCard>
        </div>

        {okDocs.length > 0 ? (
          <div className="mb-6 rounded-xl border border-pika-border bg-pika-card p-4 sm:p-5">
            <h3 className="text-sm font-bold text-pika-primary">Verificação</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {okDocs.map((doc) => (
                <span
                  key={doc.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-pika-ink px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <FontAwesomeIcon icon={faFileLines} className="h-3 w-3" />
                  {doc.label}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="text-2xl font-bold text-pika-ink">
              {driver.totalRides.toLocaleString("pt-AO")}
            </p>
            <p className="mt-1 text-sm text-pika-muted">Corridas Totais</p>
          </div>
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="text-xl font-bold text-pika-ink sm:text-2xl">
              Kz {driver.totalEarningsKz}
            </p>
            <p className="mt-1 text-sm text-pika-muted">Ganhos Totais</p>
          </div>
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="text-lg font-bold text-pika-ink sm:text-xl">{driver.registeredAt}</p>
            <p className="mt-1 text-sm text-pika-muted">Data de Cadastro</p>
          </div>
        </div>
      </div>
    </div>
  );
}

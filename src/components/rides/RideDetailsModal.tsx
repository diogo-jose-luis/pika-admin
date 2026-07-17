"use client";

import { useEffect, type ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBan,
  faCar,
  faCircle,
  faClock,
  faIdCard,
  faLocationDot,
  faPalette,
  faRobot,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { StarRating } from "@/components/ui/StarRating";
import type { RideRow } from "@/lib/ride-history";
import { cn } from "@/lib/cn";

type RideDetailsModalProps = {
  ride: RideRow;
  onClose: () => void;
};

function statusPillClass(status: RideRow["status"]) {
  const map: Record<RideRow["status"], string> = {
    "Em andamento": "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
    "Em solicitação": "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
    Concluída: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    Pendente: "bg-orange-50 text-orange-700 ring-1 ring-orange-100",
    Cancelada: "bg-red-50 text-red-700 ring-1 ring-red-100",
  };
  return map[status];
}

function cancelledByLabel(role: NonNullable<RideRow["cancelledBy"]>["role"]) {
  if (role === "driver") return "Cancelada pelo motorista";
  if (role === "passenger") return "Cancelada pelo passageiro";
  return "Cancelada por outro utilizador";
}

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
        {label}
      </p>
      <div className="mt-1 text-sm text-pika-ink">{children}</div>
    </div>
  );
}

function RatingBlock({
  title,
  subtitle,
  stars,
  comment,
}: {
  title: string;
  subtitle: string;
  stars: number | null;
  comment: string;
}) {
  return (
    <section className="rounded-xl border border-pika-border bg-pika-page/60 p-4">
      <h3 className="text-sm font-bold text-pika-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-pika-muted">{subtitle}</p>
      <div className="mt-3">
        <StarRating value={stars} iconClassName="h-5 w-5" emptyLabel="Sem classificação" />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-pika-ink">
        {comment ? (
          comment
        ) : (
          <span className="text-pika-muted italic">Sem comentário.</span>
        )}
      </p>
    </section>
  );
}

export function RideDetailsModal({ ride, onClose }: RideDetailsModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
        aria-labelledby="ride-details-title"
        className="max-h-[min(92vh,800px)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-pika-card p-6 shadow-xl sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h2 id="ride-details-title" className="text-xl font-bold text-pika-ink">
              Detalhes da corrida #{ride.id}
            </h2>
            <p className="mt-1 text-sm text-pika-muted">{ride.dateLabel || "—"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pika-border text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
              statusPillClass(ride.status),
            )}
          >
            {ride.status}
          </span>
          {ride.closedBySystem ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              <FontAwesomeIcon icon={faRobot} className="h-3 w-3" />
              Fechada pelo sistema
            </span>
          ) : null}
          <span className="text-sm font-semibold text-pika-ink">{ride.valueLabel}</span>
          {ride.commissionLabel !== "—" ? (
            <span className="text-sm text-pika-muted">
              Comissão {ride.commissionLabel}
            </span>
          ) : null}
          {ride.distanceLabel ? (
            <span className="text-sm text-pika-muted">{ride.distanceLabel}</span>
          ) : null}
        </div>

        {ride.startTimeLabel || ride.endTimeLabel || ride.durationLabel ? (
          <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-pika-border bg-pika-page/60 px-4 py-3 text-sm">
            <span className="inline-flex items-center gap-2 text-pika-ink">
              <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-pika-primary" />
              <span>
                <span className="font-medium text-pika-muted">Início: </span>
                {ride.startTimeLabel || "—"}
              </span>
            </span>
            <span className="text-pika-ink">
              <span className="font-medium text-pika-muted">Fim: </span>
              {ride.endTimeLabel || "—"}
            </span>
            {ride.durationLabel ? (
              <span className="font-semibold text-pika-ink">
                Duração: {ride.durationLabel}
              </span>
            ) : null}
          </div>
        ) : null}

        {ride.note ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
              Nota
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-amber-950">
              {ride.note}
            </p>
          </div>
        ) : null}

        {ride.status === "Cancelada" && ride.cancelledBy ? (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faBan} className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700">
                {cancelledByLabel(ride.cancelledBy.role)}
              </p>
              {ride.cancelledBy.name !== "—" ? (
                <p className="mt-0.5 truncate text-sm text-red-700/90">
                  {ride.cancelledBy.name}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DetailField label="Passageiro">
            <span className="font-semibold">{ride.passenger}</span>
          </DetailField>
          <DetailField label="Motorista">
            <span className="font-semibold">{ride.driver}</span>
          </DetailField>
        </div>

        <DetailField label="Trajeto" className="mt-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-start gap-2">
              <FontAwesomeIcon
                icon={faCircle}
                className="mt-1 h-2 w-2 shrink-0 text-pika-primary"
              />
              <span>
                <span className="font-medium text-pika-muted">Origem: </span>
                {ride.origin}
              </span>
            </span>
            <span className="inline-flex items-start gap-2">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pika-primary"
              />
              <span>
                <span className="font-medium text-pika-muted">Destino: </span>
                {ride.destination}
              </span>
            </span>
          </div>
        </DetailField>

        <DetailField label="Viatura" className="mt-4">
          <div className="flex flex-col gap-2">
            <span className="inline-flex items-start gap-2">
              <FontAwesomeIcon
                icon={faCar}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pika-primary"
              />
              <span>
                <span className="font-medium text-pika-muted">Marca / modelo: </span>
                <span className="font-semibold">{ride.vehicleModel}</span>
              </span>
            </span>
            <span className="inline-flex items-start gap-2">
              <FontAwesomeIcon
                icon={faIdCard}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pika-primary"
              />
              <span>
                <span className="font-medium text-pika-muted">Matrícula: </span>
                {ride.vehiclePlate}
              </span>
            </span>
            <span className="inline-flex items-start gap-2">
              <FontAwesomeIcon
                icon={faPalette}
                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pika-primary"
              />
              <span>
                <span className="font-medium text-pika-muted">Cor: </span>
                {ride.vehicleColor}
              </span>
            </span>
          </div>
        </DetailField>

        <div className="mt-6 space-y-4">
          <RatingBlock
            title="Classificação do passageiro"
            subtitle="Avaliação e comentário que o passageiro deu ao motorista"
            stars={ride.passengerToDriverStars}
            comment={ride.passengerToDriverComment}
          />
          <RatingBlock
            title="Classificação do motorista"
            subtitle="Avaliação e comentário que o motorista deu ao passageiro"
            stars={ride.driverToPassengerStars}
            comment={ride.driverToPassengerComment}
          />
        </div>
      </div>
    </div>
  );
}

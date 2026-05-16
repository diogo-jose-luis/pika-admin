"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faCar,
  faDollarSign,
  faEnvelope,
  faPhone,
  faStar,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect } from "react";
import type { PassengerRow } from "@/lib/passengers";
import { cn } from "@/lib/cn";

type PassengerDetailsModalProps = {
  passenger: PassengerRow;
  onClose: () => void;
};

function registeredAtLabel(serial: number) {
  const month = String((serial % 12) + 1).padStart(2, "0");
  const day = String((serial % 27) + 1).padStart(2, "0");
  return `2025/${month}/${day}`;
}

export function PassengerDetailsModal({
  passenger,
  onClose,
}: PassengerDetailsModalProps) {
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
        aria-labelledby="passenger-details-title"
        className="max-h-[min(92vh,720px)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-pika-card p-6 shadow-xl sm:p-8"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-3">
          <h2 id="passenger-details-title" className="text-xl font-bold text-pika-ink">
            Detalhes do Passageiro
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
              passenger.avatarClass,
            )}
          >
            {passenger.initials}
          </div>
          <div>
            <p className="text-2xl font-bold text-pika-ink sm:text-3xl">{passenger.name}</p>
            <p className="mt-1 text-sm font-medium text-pika-muted">
              {passenger.passengerId}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-pika-ink">
              <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-amber-500" />
              <span className="font-semibold">{passenger.rating}</span>
              <span className="text-pika-muted">Avaliação</span>
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-pika-border bg-pika-card p-4 sm:p-5">
          <h3 className="text-sm font-bold text-pika-primary">Contato</h3>
          <ul className="mt-3 space-y-2.5 text-sm text-pika-ink">
            <li className="flex items-start gap-2.5">
              <FontAwesomeIcon
                icon={faEnvelope}
                className="mt-0.5 h-4 w-4 shrink-0 text-pika-ink"
              />
              <span>
                <span className="font-medium">Email:</span> {passenger.email}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <FontAwesomeIcon
                icon={faPhone}
                className="mt-0.5 h-4 w-4 shrink-0 text-pika-ink"
              />
              <span>
                <span className="font-medium">Telefone:</span> {passenger.phone}
              </span>
            </li>
          </ul>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="flex items-center justify-center gap-2 text-2xl font-bold text-pika-ink">
              <FontAwesomeIcon icon={faCar} className="h-5 w-5 text-pika-primary" />
              {passenger.rides}
            </p>
            <p className="mt-1 text-sm text-pika-muted">Corridas Totais</p>
          </div>
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="flex items-center justify-center gap-2 text-lg font-bold text-pika-ink sm:text-xl">
              <FontAwesomeIcon icon={faDollarSign} className="h-5 w-5 text-pika-success" />
              {passenger.totalSpentLabel}
            </p>
            <p className="mt-1 text-sm text-pika-muted">Total Gasto</p>
          </div>
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-pika-ink sm:text-base">
              <FontAwesomeIcon icon={faCalendarDays} className="h-4 w-4 text-pika-primary" />
              {passenger.lastRideLabel}
            </p>
            <p className="mt-1 text-sm text-pika-muted">Última Corrida</p>
          </div>
          <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
            <p className="text-lg font-bold text-pika-ink sm:text-xl">
              {registeredAtLabel(passenger.serial)}
            </p>
            <p className="mt-1 text-sm text-pika-muted">Data de Cadastro</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold",
              passenger.status === "Ativo"
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                : "bg-red-50 text-red-700 ring-1 ring-red-100",
            )}
          >
            {passenger.status}
          </span>
          {passenger.problemCount > 0 ? (
            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
              {passenger.problemCount} Problemas
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

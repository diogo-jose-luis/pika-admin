"use client";

import { useMemo, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faCircleCheck,
  faDownload,
  faEllipsisVertical,
  faEnvelope,
  faGaugeHigh,
  faMagnifyingGlass,
  faPhone,
  faStar,
  faUserCheck,
  faUserMinus,
} from "@fortawesome/free-solid-svg-icons";
import {
  DRIVERS_MOCK,
  DRIVERS_SUMMARY,
  type DriverCard,
  type DriverStatus,
} from "@/lib/drivers-mock";
import { cn } from "@/lib/cn";

const DOC_OPTIONS = ["Todos", "Completa", "Pendente"] as const;

function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "Ativo"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-1 ring-red-100",
      )}
    >
      {status}
    </span>
  );
}

export function DriversView() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | DriverStatus>("Todos");
  const [docFilter, setDocFilter] = useState<(typeof DOC_OPTIONS)[number]>("Todos");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return DRIVERS_MOCK.filter((d) => {
      if (statusFilter !== "Todos" && d.status !== statusFilter) return false;
      if (docFilter === "Completa" && !d.verified) return false;
      if (docFilter === "Pendente" && d.verified) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q) ||
        d.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
      );
    });
  }, [search, statusFilter, docFilter]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Total Motoristas</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {DRIVERS_SUMMARY.total}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <FontAwesomeIcon icon={faGaugeHigh} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Ativos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {DRIVERS_SUMMARY.active}
              </p>
              <p className="mt-2 text-xs font-semibold text-pika-success">
                {DRIVERS_SUMMARY.activeTrend} vs ontem
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FontAwesomeIcon icon={faUserCheck} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Inativos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {DRIVERS_SUMMARY.inactive}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faUserMinus} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Avaliação Média</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {DRIVERS_SUMMARY.avgRating}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FontAwesomeIcon icon={faStar} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-pika-border bg-slate-100/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por passageiro, motorista ou ID..."
              className="w-full rounded-xl border border-pika-border bg-white py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "Todos" | DriverStatus)
              }
              className="rounded-xl border border-pika-border bg-white px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
            <select
              value={docFilter}
              onChange={(e) =>
                setDocFilter(e.target.value as (typeof DOC_OPTIONS)[number])
              }
              className="rounded-xl border border-pika-border bg-white px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              {DOC_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-white px-4 py-2.5 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white"
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-pika-border bg-white p-8 text-center text-sm text-pika-muted shadow-sm">
          Nenhum motorista encontrado com estes critérios.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((driver) => (
            <DriverCard key={driver.id} driver={driver} />
          ))}
        </section>
      )}
    </div>
  );
}

function DriverCard({ driver }: { driver: DriverCard }) {
  return (
    <article className="flex flex-col rounded-2xl border border-pika-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              driver.avatarClass,
            )}
          >
            {driver.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-base font-bold text-pika-ink">
                {driver.name}
              </h3>
              {driver.verified ? (
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="h-4 w-4 shrink-0 text-emerald-500"
                  title="Verificado"
                />
              ) : null}
            </div>
            <p className="mt-0.5 text-xs font-medium text-pika-muted">{driver.id}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <DriverStatusBadge status={driver.status} />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
            aria-label="Mais opções"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
          </button>
        </div>
      </div>

      <ul className="mt-4 space-y-2.5 text-sm text-pika-ink">
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span className="min-w-0 break-all">{driver.email}</span>
        </li>
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faPhone}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span>{driver.phone}</span>
        </li>
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faCar}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span className="leading-snug">{driver.vehicle}</span>
        </li>
      </ul>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-pika-border pt-4 text-center text-xs sm:text-sm">
        <div>
          <p className="flex flex-wrap items-center justify-center gap-1 text-pika-ink">
            <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-semibold">{driver.rating}</span>
            <span className="text-pika-muted">Avaliação</span>
          </p>
        </div>
        <div>
          <p className="font-semibold text-pika-ink">{driver.rides}</p>
          <p className="mt-0.5 text-pika-muted">Corridas</p>
        </div>
        <div>
          <p className="font-bold text-pika-ink">
            Kz {driver.earningsKz}
          </p>
          <p className="mt-0.5 text-pika-muted">Ganhos</p>
        </div>
      </div>
    </article>
  );
}

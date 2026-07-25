"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faClock,
  faLocationDot,
  faMapLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import type { SosAlertRow } from "@/lib/sos-alerts";

export function SosView() {
  const [alerts, setAlerts] = useState<SosAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadAlerts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/sos", { cache: "no-store" });
      const data = (await res.json()) as {
        alerts?: SosAlertRow[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar alertas SOS.");
      }

      setAlerts(data.alerts ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar alertas SOS.",
      );
      setAlerts([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <RefreshDataButton
          loading={refreshing}
          onClick={() => void loadAlerts(true)}
        />
      </div>

      {loadError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <div className="mx-auto max-w-3xl space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-44 animate-pulse rounded-2xl border border-pika-border bg-pika-page"
            />
          ))}
        </div>
      ) : alerts.length === 0 && !loadError ? (
        <p className="py-12 text-center text-sm text-pika-muted">
          Nenhum alerta SOS registado.
        </p>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {alerts.map((alert) => (
            <SosAlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

function SosAlertCard({ alert }: { alert: SosAlertRow }) {
  const phoneDigits = alert.phone.replace(/\D/g, "");
  const canCall = phoneDigits.length > 0;

  return (
    <article className="flex overflow-hidden rounded-2xl border border-red-200 bg-pika-card shadow-sm">
      <div className="w-1.5 shrink-0 bg-red-600" aria-hidden />
      <div className="min-w-0 flex-1 space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-md bg-red-600 px-2.5 py-1 text-xs font-bold tracking-wide text-white">
              {alert.code}
            </span>
            <span className="inline-flex rounded-md border-2 border-red-600 bg-white px-2.5 py-1 text-xs font-bold text-red-600">
              {alert.severityLabel}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {canCall ? (
              <a
                href={`tel:${phoneDigits}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-pika-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-ink/90"
              >
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                Contactar
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-pika-page px-4 py-2.5 text-sm font-semibold text-pika-muted"
                title="Telefone indisponível"
              >
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                Contactar
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              Acionar 111
            </button>
          </div>
        </div>

        <div>
          <p className="text-base font-bold text-pika-ink md:text-lg">
            {alert.titleLine}
          </p>
          <p className="mt-1 text-sm text-pika-muted">{alert.rideRef}</p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex min-w-0 flex-col gap-1.5 text-xs">
            <span className="inline-flex items-start gap-2 text-pika-ink">
              <FontAwesomeIcon
                icon={faCircle}
                className="mt-0.5 h-2 w-2 shrink-0 text-red-600"
              />
              <span className="leading-snug">
                <span className="font-medium text-pika-muted">Origem: </span>
                {alert.origin}
              </span>
            </span>
            <span className="inline-flex items-start gap-2 text-pika-ink">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-0.5 h-3 w-3 shrink-0 text-red-600"
              />
              <span className="leading-snug">
                <span className="font-medium text-pika-muted">Destino: </span>
                {alert.destination}
              </span>
            </span>
            {alert.latitude != null && alert.longitude != null ? (
              <span className="inline-flex items-start gap-2 text-pika-ink">
                <FontAwesomeIcon
                  icon={faMapLocationDot}
                  className="mt-0.5 h-3 w-3 shrink-0 text-red-600"
                />
                <span className="leading-snug">
                  <span className="font-medium text-pika-muted">
                    Coordenadas:{" "}
                  </span>
                  {alert.mapsUrl ? (
                    <a
                      href={alert.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-pika-primary hover:underline"
                    >
                      {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                    </a>
                  ) : (
                    <>
                      {alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}
                    </>
                  )}
                </span>
              </span>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 text-pika-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="h-4 w-4 shrink-0" />
              {alert.timeAgoLabel}
            </span>
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faCircle}
                className="h-2 w-2 shrink-0 text-red-600"
              />
              <span className="font-medium text-red-600">
                {alert.trackingStatusLabel}
              </span>
            </span>
            {alert.mapsUrl ? (
              <a
                href={alert.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-semibold text-pika-primary transition hover:underline"
              >
                <FontAwesomeIcon
                  icon={faMapLocationDot}
                  className="h-4 w-4 shrink-0"
                />
                Ver no Google Maps
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

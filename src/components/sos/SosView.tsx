"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faClock,
  faLocationDot,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { SOS_ALERTS } from "@/lib/sos-alerts-mock";

export function SosView() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {SOS_ALERTS.map((alert) => (
        <article
          key={alert.id}
          className="flex overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm"
        >
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
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-pika-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-ink/90"
                >
                  <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                  Contactar
                </button>
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
                {alert.driverName} · {alert.passengerName}
              </p>
              <p className="mt-1 text-sm text-pika-muted">
                Corrida {alert.rideTripRef}
              </p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-pika-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6 sm:gap-y-2">
              <span className="inline-flex items-center gap-2">
                <FontAwesomeIcon
                  icon={faLocationDot}
                  className="h-4 w-4 shrink-0 text-red-600"
                />
                <span className="text-pika-ink">{alert.address}</span>
              </span>
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
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

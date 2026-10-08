"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faCircle,
  faClock,
  faCrosshairs,
  faLocationDot,
  faPhone,
  faRoute,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { OffCanvas } from "@/components/ui/OffCanvas";
import { useLocale } from "@/components/providers/LocaleProvider";
import { translateRideStatus } from "@/lib/i18n";
import type { RideRow } from "@/lib/ride-history";
import {
  RIDE_TRACKING_REFRESH_MS,
  type RideTracking,
} from "@/lib/ride-tracking";
import { cn } from "@/lib/cn";

const RideTrackingMap = dynamic(
  () => import("./RideTrackingMap").then((m) => m.RideTrackingMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-pika-muted">
        <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
      </div>
    ),
  },
);

type RideTrackingOffCanvasProps = {
  ride: RideRow;
  onClose: () => void;
};

export function RideTrackingOffCanvas({ ride, onClose }: RideTrackingOffCanvasProps) {
  const { t } = useLocale();
  const [tracking, setTracking] = useState<RideTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [follow, setFollow] = useState(true);
  const stoppedRef = useRef(false);

  const fetchTracking = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/corridas/acompanhamento?id=${encodeURIComponent(ride.docId)}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as { tracking?: RideTracking; error?: string };
      if (!res.ok || !data.tracking) {
        throw new Error(data.error ?? t("rides.trackingLoadError"));
      }
      setTracking(data.tracking);
      setLastUpdateMs(Date.now());
      setError(null);
      return data.tracking.inProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("rides.trackingLoadError"));
      return true;
    }
  }, [ride.docId, t]);

  useEffect(() => {
    stoppedRef.current = false;
    let timer: number | undefined;

    const tick = async () => {
      const keepPolling = await fetchTracking();
      if (stoppedRef.current || !keepPolling) return;
      timer = window.setTimeout(() => void tick(), RIDE_TRACKING_REFRESH_MS);
    };
    void tick();

    return () => {
      stoppedRef.current = true;
      window.clearTimeout(timer);
    };
  }, [fetchTracking]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const secondsAgo =
    lastUpdateMs != null ? Math.max(0, Math.round((now - lastUpdateMs) / 1000)) : null;
  const ended = tracking != null && !tracking.inProgress;
  const phase = tracking
    ? tracking.driverAtDestination
      ? t("rides.trackingPhaseAtDestination")
      : tracking.driverArrived
        ? t("rides.trackingPhaseToDestination")
        : t("rides.trackingPhaseToPickup")
    : "";

  return (
    <OffCanvas
      open
      wide
      onClose={onClose}
      title={t("rides.trackingTitle", { id: ride.id })}
      subtitle={`${ride.passenger} · ${ride.driver}`}
    >
      <div className="flex flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pika-border px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            {ended ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pika-page px-2.5 py-1 text-xs font-semibold text-pika-muted ring-1 ring-pika-border">
                {t("rides.trackingEnded", {
                  status: translateRideStatus(tracking.status, t),
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-600 ring-1 ring-red-100">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                {t("rides.trackingLive")}
              </span>
            )}
            {phase && !ended ? (
              <span className="text-xs font-semibold text-pika-ink">{phase}</span>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            {secondsAgo != null ? (
              <span className="text-xs text-pika-muted">
                {t("rides.trackingUpdatedAgo", { seconds: secondsAgo })}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setFollow((v) => !v)}
              aria-pressed={follow}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition",
                follow
                  ? "border-pika-primary bg-pika-primary text-white"
                  : "border-pika-border text-pika-muted hover:text-pika-ink",
              )}
            >
              <FontAwesomeIcon icon={faCrosshairs} className="h-3 w-3" />
              {t("rides.trackingFollow")}
            </button>
          </div>
        </div>

        {error ? (
          <p className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="relative h-[min(58vh,520px)] w-full bg-pika-page">
          {tracking ? (
            <RideTrackingMap tracking={tracking} follow={follow} />
          ) : (
            <div className="flex h-full items-center justify-center gap-2 text-pika-muted">
              <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
              <span className="text-sm font-medium">{t("rides.trackingLoading")}</span>
            </div>
          )}
          {tracking && !tracking.driverLocation ? (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center">
              <span className="rounded-full bg-pika-card/95 px-3 py-1.5 text-xs font-semibold text-pika-ink shadow-md">
                {t("rides.trackingNoLocation")}
              </span>
            </div>
          ) : null}
        </div>

        {tracking ? (
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <InfoBlock label={t("rides.trackingEta")} icon={faClock}>
              {tracking.etaLabel || "—"}
            </InfoBlock>
            <InfoBlock label={t("rides.distance")} icon={faRoute}>
              {tracking.distanceLabel || "—"}
            </InfoBlock>
            <InfoBlock label={t("common.driver")} icon={faPhone}>
              <span className="block">{tracking.driver}</span>
              <PhoneLink phone={tracking.driverPhone} />
            </InfoBlock>
            <InfoBlock label={t("common.passenger")} icon={faPhone}>
              <span className="block">{tracking.passenger}</span>
              <PhoneLink phone={tracking.passengerPhone} />
            </InfoBlock>
            <InfoBlock label={t("rides.vehicle")} icon={faCar}>
              <span className="block">{tracking.vehicleModel}</span>
              <span className="block text-xs font-normal text-pika-muted">
                {tracking.vehiclePlate} · {tracking.vehicleColor}
              </span>
            </InfoBlock>
            <InfoBlock label={t("rides.route")} icon={faLocationDot}>
              <span className="flex items-start gap-2 text-xs font-medium">
                <FontAwesomeIcon icon={faCircle} className="mt-1 h-2 w-2 shrink-0 text-teal-600" />
                {tracking.originLabel}
              </span>
              <span className="mt-1 flex items-start gap-2 text-xs font-medium">
                <FontAwesomeIcon icon={faLocationDot} className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                {tracking.destinationLabel}
              </span>
            </InfoBlock>
          </div>
        ) : null}
      </div>
    </OffCanvas>
  );
}

function InfoBlock({
  label,
  icon,
  children,
}: {
  label: string;
  icon: typeof faClock;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-pika-border bg-pika-page/50 p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-pika-muted">
        <FontAwesomeIcon icon={icon} className="h-3 w-3 text-pika-primary" />
        {label}
      </p>
      <div className="mt-1.5 text-sm font-semibold text-pika-ink">{children}</div>
    </div>
  );
}

function PhoneLink({ phone }: { phone: string }) {
  if (!phone) return null;
  return (
    <a
      href={`tel:${phone.replace(/\s+/g, "")}`}
      className="text-xs font-medium text-pika-primary hover:underline"
    >
      {phone}
    </a>
  );
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faCrosshairs,
  faLocationDot,
  faPhone,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useLocale } from "@/components/providers/LocaleProvider";
import { translateRideStatus } from "@/lib/i18n";
import { PIKA_APPS } from "@/lib/public-ride";
import {
  RIDE_TRACKING_REFRESH_MS,
  type RideTracking,
} from "@/lib/ride-tracking";
import { cn } from "@/lib/cn";

const RideTrackingMap = dynamic(
  () => import("./RideTrackingMap").then((m) => m.RideTrackingMap),
  { ssr: false },
);

type PublicRideLivePageProps = {
  rideId: string;
};

type LayoutMode = "mobile" | "desktop";

export function PublicRideLivePage({ rideId }: PublicRideLivePageProps) {
  const { t } = useLocale();
  const [tracking, setTracking] = useState<RideTracking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [lastUpdateMs, setLastUpdateMs] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [follow, setFollow] = useState(true);
  const [layout, setLayout] = useState<LayoutMode | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchTracking = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `/api/publico/corrida/${encodeURIComponent(rideId)}`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as { tracking?: RideTracking; error?: string };
      if (res.status === 404) {
        setMissing(true);
        setError(data.error ?? t("publicRide.notFoundTitle"));
        return false;
      }
      if (!res.ok || !data.tracking) {
        throw new Error(data.error ?? t("rides.trackingLoadError"));
      }
      setTracking(data.tracking);
      setLastUpdateMs(Date.now());
      setMissing(false);
      setError(null);
      return data.tracking.inProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("rides.trackingLoadError"));
      return true;
    }
  }, [rideId, t]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const apply = () => setLayout(media.matches ? "desktop" : "mobile");
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;

    const tick = async () => {
      const keepPolling = await fetchTracking();
      if (stopped || !keepPolling) return;
      timer = window.setTimeout(() => void tick(), RIDE_TRACKING_REFRESH_MS);
    };
    void tick();

    return () => {
      stopped = true;
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

  return (
    <div className="pika-public-ride relative h-dvh w-full overflow-hidden bg-[#d5dee3] text-[#2d3436]">
      <div className="absolute inset-0">
        {tracking && layout ? (
          <RideTrackingMap
            key={layout}
            className="pika-public-map"
            tracking={tracking}
            follow={follow && !ended}
            zoomControlPosition="topright"
            fitPadding={
              layout === "desktop"
                ? { topLeft: [430, 88], bottomRight: [48, 48] }
                : { topLeft: [16, 96], bottomRight: [16, 300] }
            }
            followOffsetX={layout === "desktop" ? 190 : 0}
            followOffsetY={layout === "mobile" ? -150 : 0}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#636e72]">
            {!missing ? (
              <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin text-[#f96100]" />
            ) : null}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute left-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[1100] md:left-[calc(50%+8.5rem)] md:top-4">
        <img
          src="/logo.png"
          alt="Pika"
          className="h-9 w-auto max-w-[42vw] rounded-2xl bg-white px-2.5 py-1 shadow-lg md:h-14 md:max-w-none md:px-3 md:py-1.5"
        />
      </div>

      {tracking ? (
        <button
          type="button"
          onClick={() => setFollow((value) => !value)}
          aria-pressed={follow}
          aria-label={t("rides.trackingFollow")}
          className={cn(
            "absolute right-3 top-[calc(env(safe-area-inset-top)+6.5rem)] z-[1100] inline-flex h-11 w-11 items-center justify-center gap-1.5 rounded-full text-xs font-semibold shadow-lg transition sm:w-auto sm:px-3 md:top-[5.25rem]",
            follow
              ? "bg-[#f96100] text-white"
              : "bg-white text-[#636e72] ring-1 ring-black/5 hover:text-[#2d3436]",
          )}
        >
          <FontAwesomeIcon icon={faCrosshairs} className="h-3.5 w-3.5" />
          <span className="max-sm:sr-only">{t("rides.trackingFollow")}</span>
        </button>
      ) : null}

      {tracking && !tracking.driverLocation ? (
        <div className="pointer-events-none absolute left-3 right-16 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[1100] flex justify-center md:inset-x-0 md:top-6 md:right-0">
          <span className="max-w-xs rounded-full bg-white/95 px-3 py-1.5 text-center text-xs font-semibold text-[#2d3436] shadow-md">
            {t("rides.trackingNoLocation")}
          </span>
        </div>
      ) : null}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-[1100] flex flex-col overscroll-contain rounded-t-3xl bg-white shadow-[0_-10px_30px_rgba(0,0,0,.18)] md:bottom-auto md:left-4 md:top-4 md:max-h-[calc(100dvh-2rem)] md:w-[22rem] md:gap-2 md:overflow-y-auto md:rounded-none md:bg-transparent md:p-0 md:shadow-none",
          detailsOpen
            ? "max-h-[min(78dvh,720px)] overflow-y-auto"
            : "max-h-[46dvh] overflow-y-auto",
        )}
      >
        <button
          type="button"
          className="sticky top-0 z-10 flex h-7 w-full shrink-0 flex-col items-center justify-center bg-white md:hidden"
          onClick={() => setDetailsOpen((open) => !open)}
          aria-expanded={detailsOpen}
          aria-label={detailsOpen ? t("publicRide.lessDetails") : t("publicRide.moreDetails")}
        >
          <span className="h-1.5 w-10 rounded-full bg-[#d5dee3]" />
        </button>
        <div className="flex flex-col gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:contents">
          <div className={cn("order-2 md:order-1", !detailsOpen && "max-md:hidden")}>
            <DownloadCard />
          </div>
          <div className="order-1 md:order-2">
            {tracking ? (
              <RideCard
                tracking={tracking}
                ended={ended}
                secondsAgo={secondsAgo}
                detailsOpen={detailsOpen}
                onToggleDetails={() => setDetailsOpen((open) => !open)}
              />
            ) : missing ? (
              <section className="pb-2 md:rounded-2xl md:bg-white md:p-4 md:shadow-xl md:ring-1 md:ring-black/5">
                <h1 className="text-lg font-bold text-[#2d3436]">{t("publicRide.notFoundTitle")}</h1>
                <p className="mt-1 text-sm text-[#636e72]">{t("publicRide.notFoundHint")}</p>
              </section>
            ) : (
              <section className="pb-2 md:rounded-2xl md:bg-white md:p-4 md:shadow-xl md:ring-1 md:ring-black/5">
                <p className="flex items-center gap-2 text-sm font-medium text-[#636e72]">
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin text-[#f96100]" />
                  {error ?? t("rides.trackingLoading")}
                </p>
              </section>
            )}
          </div>
        </div>
      </div>

      {error && tracking ? (
        <p
          role="alert"
          className="absolute left-3 right-16 top-[calc(env(safe-area-inset-top)+4.25rem)] z-[1100] w-fit max-w-[16rem] rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-md md:left-1/2 md:right-auto md:top-20 md:-translate-x-1/2"
        >
          {error}
        </p>
      ) : null}

      <StoreDock />
    </div>
  );
}

function DownloadCard() {
  const { t } = useLocale();
  return (
    <section className="border-t border-[#e6eceb] pt-3 md:rounded-2xl md:border-0 md:bg-white md:p-3.5 md:pt-3.5 md:shadow-xl md:ring-1 md:ring-black/5">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="" className="h-10 w-auto shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#2d3436]">{t("publicRide.downloadTitle")}</p>
          <p className="text-xs text-[#636e72]">{t("publicRide.downloadSubtitle")}</p>
        </div>
        <span className="flex h-10 shrink-0 items-center rounded-xl bg-[#f96100] px-2.5 text-sm font-black tracking-tight text-white">
          Pika
        </span>
      </div>
      <div className="mt-3 space-y-3 md:hidden">
        <StoreGroup label={t("publicRide.passengerApp")} app={PIKA_APPS.passenger} stacked />
        <StoreGroup label={t("publicRide.driverApp")} app={PIKA_APPS.driver} stacked />
      </div>
    </section>
  );
}

function RideCard({
  tracking,
  ended,
  secondsAgo,
  detailsOpen,
  onToggleDetails,
}: {
  tracking: RideTracking;
  ended: boolean;
  secondsAgo: number | null;
  detailsOpen: boolean;
  onToggleDetails: () => void;
}) {
  const { t } = useLocale();
  const phase = tracking.driverAtDestination
    ? t("rides.trackingPhaseAtDestination")
    : tracking.driverArrived
      ? t("rides.trackingPhaseToDestination")
      : t("rides.trackingPhaseToPickup");
  const title = tracking.inProgress
    ? t("publicRide.liveTitle")
    : tracking.status === "Concluída"
      ? t("publicRide.doneTitle")
      : tracking.status === "Cancelada"
        ? t("publicRide.cancelledTitle")
        : translateRideStatus(tracking.status, t);
  const vehicle = [tracking.vehicleColor, tracking.vehicleModel]
    .filter((part) => part && part !== "—")
    .join(" ");

  return (
    <section className="md:rounded-2xl md:bg-white md:p-4 md:shadow-xl md:ring-1 md:ring-black/5">
      <div className="flex items-start justify-between gap-2">
        {ended ? (
          <span className="inline-flex max-w-[68%] items-center rounded-full bg-[#f4f7f6] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#636e72] ring-1 ring-[#e6eceb]">
            {t("rides.trackingEnded", { status: translateRideStatus(tracking.status, t) })}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-600 ring-1 ring-red-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            {t("rides.trackingLive")}
          </span>
        )}
        {secondsAgo != null ? (
          <span className="shrink-0 text-[11px] text-[#636e72]">
            {t("rides.trackingUpdatedAgo", { seconds: secondsAgo })}
          </span>
        ) : null}
      </div>

      <h1 className="mt-2 text-lg font-bold tracking-tight text-[#2d3436] md:mt-3 md:text-xl">{title}</h1>
      {!ended ? <p className="mt-0.5 text-sm font-medium leading-snug text-[#f96100]">{phase}</p> : null}

      <div className="mt-3 border-t border-[#e6eceb] pt-3">
        <p className="break-words text-sm font-semibold text-[#2d3436]">{vehicle || "—"}</p>
        <p className="break-all text-xs font-medium uppercase tracking-wide text-[#636e72]">
          {tracking.vehiclePlate}
        </p>
      </div>

      <div className="mt-3 space-y-2 border-t border-[#e6eceb] pt-3">
        <PlaceRow
          label={t("publicRide.pickup")}
          value={tracking.originLabel}
          icon={faCircle}
          iconClass="h-2.5 w-2.5 text-teal-600"
        />
        <PlaceRow
          label={t("publicRide.dropoff")}
          value={tracking.destinationLabel}
          icon={faLocationDot}
          iconClass="h-3.5 w-3.5 text-red-500"
        />
      </div>

      <div className={cn(!detailsOpen && "max-md:hidden")}>
        <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-[#e6eceb] pt-3">
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#636e72]">
              {t("common.driver")}
            </dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-[#2d3436]">{tracking.driver}</dd>
            {tracking.driverPhone ? (
              <a
                href={`tel:${tracking.driverPhone.replace(/\s+/g, "")}`}
                aria-label={t("publicRide.callDriver")}
                className="mt-1 inline-flex min-h-11 items-center gap-1.5 break-all text-sm font-semibold text-[#f96100] hover:underline"
              >
                <FontAwesomeIcon icon={faPhone} className="h-3.5 w-3.5 shrink-0" />
                {tracking.driverPhone}
              </a>
            ) : null}
          </div>
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#636e72]">
              {t("common.passenger")}
            </dt>
            <dd className="mt-0.5 break-words text-sm font-semibold text-[#2d3436]">{tracking.passenger}</dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e6eceb] pt-3 text-xs font-semibold text-[#2d3436]">
          <span className="rounded-full bg-[#f4f7f6] px-2.5 py-1">
            {t("rides.trackingEta")}: {tracking.etaLabel || "—"}
          </span>
          <span className="rounded-full bg-[#f4f7f6] px-2.5 py-1">
            {tracking.distanceLabel || "—"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleDetails}
        aria-expanded={detailsOpen}
        className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-[#f4f7f6] text-sm font-semibold text-[#f96100] md:hidden"
      >
        {detailsOpen ? t("publicRide.lessDetails") : t("publicRide.moreDetails")}
      </button>
    </section>
  );
}

function PlaceRow({
  label,
  value,
  icon,
  iconClass,
}: {
  label: string;
  value: string;
  icon: typeof faCircle;
  iconClass: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <FontAwesomeIcon icon={icon} className={cn("mt-1 shrink-0", iconClass)} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#636e72]">{label}</p>
        <p className="line-clamp-2 break-words text-sm font-medium leading-snug text-[#2d3436]">{value}</p>
      </div>
    </div>
  );
}

function StoreDock() {
  const { t } = useLocale();
  return (
    <div className="absolute bottom-4 right-3 z-[1100] hidden flex-col items-end gap-2 md:flex">
      <StoreGroup label={t("publicRide.passengerApp")} app={PIKA_APPS.passenger} />
      <StoreGroup label={t("publicRide.driverApp")} app={PIKA_APPS.driver} />
    </div>
  );
}

function StoreGroup({
  label,
  app,
  stacked = false,
}: {
  label: string;
  app: { appStore: string; playStore: string };
  stacked?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", stacked ? "items-stretch" : "items-start md:items-end")}>
      <p
        className={cn(
          "text-[10px] font-bold uppercase tracking-wide text-[#2d3436]",
          stacked ? "" : "rounded-full bg-white/95 px-2 py-0.5 shadow-sm",
        )}
      >
        {label}
      </p>
      <div className={cn("gap-1.5", stacked ? "grid grid-cols-2" : "flex flex-wrap")}>
        <StoreBadge store="apple" href={app.appStore} label={label} fill={stacked} />
        <StoreBadge store="google" href={app.playStore} label={label} fill={stacked} />
      </div>
    </div>
  );
}

function StoreBadge({
  store,
  href,
  label,
  fill = false,
}: {
  store: "apple" | "google";
  href: string;
  label: string;
  fill?: boolean;
}) {
  const storeName = store === "apple" ? "App Store" : "Google Play";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — ${storeName}`}
      className={cn(
        "inline-flex h-11 min-w-0 items-center gap-2 rounded-lg bg-black px-2.5 text-white shadow-md transition hover:bg-neutral-800",
        fill ? "w-full" : "min-w-[9.25rem]",
      )}
    >
      {store === "apple" ? <AppleMark /> : <PlayMark />}
        <span className="flex min-w-0 flex-col leading-none">
        <span className="text-[8px] font-medium uppercase tracking-wide text-white/80">
          {store === "apple" ? "Download on the" : "Get it on"}
        </span>
        <span className="text-[13px] font-semibold">{storeName}</span>
      </span>
    </a>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden fill="currentColor">
      <path d="M16.37 12.72c-.03-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.71-3.18-1.73-1.35-.14-2.65.8-3.34.8-.7 0-1.76-.78-2.9-.76-1.49.02-2.87.87-3.64 2.2-1.55 2.69-.4 6.67 1.11 8.86.74 1.07 1.62 2.26 2.77 2.22 1.11-.05 1.53-.72 2.88-.72 1.34 0 1.72.72 2.9.69 1.2-.02 1.95-1.08 2.68-2.16.85-1.22 1.19-2.41 1.21-2.47-.03-.01-2.32-.89-2.35-3.52zM14.7 6.3c.61-.74 1.02-1.76.91-2.79-.88.04-1.94.59-2.57 1.32-.56.65-1.06 1.69-.93 2.69.98.08 1.98-.5 2.59-1.22z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
      <path fill="#34A853" d="M3.5 20.7 13.2 12 3.5 3.3c-.3.3-.5.8-.5 1.4v14.6c0 .6.2 1.1.5 1.4z" />
      <path fill="#FBBC04" d="m16.7 15.2-3.5-3.2 3.5-3.2 4.1 2.3c.8.5.8 1.3 0 1.8l-4.1 2.3z" />
      <path fill="#4285F4" d="M3.5 3.3 13.2 12l3.5-3.2L5.2 2.2C4.6 1.8 3.9 1.9 3.5 2.4v.9z" />
      <path fill="#EA4335" d="M13.2 12 3.5 20.7c.4.5 1.1.6 1.7.2l10-6.6L13.2 12z" />
    </svg>
  );
}

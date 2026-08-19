"use client";

import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircle,
  faClock,
  faLocationDot,
  faMapLocationDot,
  faPhone,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { useSosWatcher } from "@/components/providers/SosWatcherProvider";
import { useLocale } from "@/components/providers/LocaleProvider";
import { useAuth } from "@/context/AuthContext";
import { canDeleteSos } from "@/lib/permissions";
import type { SosAlertRow } from "@/lib/sos-alerts";
import {
  translateRelativeTime,
  translateSosRideRef,
  translateSosSeverity,
  translateSosTracking,
} from "@/lib/i18n";

export function SosView() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { dismissNotification } = useSosWatcher();
  const canRemove = user ? canDeleteSos(user.nivel) : false;

  const [alerts, setAlerts] = useState<SosAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SosAlertRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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
        throw new Error(data.error ?? t("sos.loadError"));
      }

      setAlerts(data.alerts ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("sos.loadError"),
      );
      setAlerts([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadAlerts();
  }, [loadAlerts]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || deleteBusy || !canRemove) return;

    setDeleteBusy(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/sos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteTarget.id }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? t("sos.deleteError"));
      }

      const removedId = deleteTarget.id;
      setAlerts((prev) => prev.filter((a) => a.id !== removedId));
      dismissNotification(removedId);
      setDeleteTarget(null);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : t("sos.deleteError"),
      );
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, deleteBusy, canRemove, dismissNotification, t]);

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
          {t("sos.empty")}
        </p>
      ) : (
        <div className="mx-auto max-w-3xl space-y-4">
          {alerts.map((alert) => (
            <SosAlertCard
              key={alert.id}
              alert={alert}
              canRemove={canRemove}
              onRemove={() => setDeleteTarget(alert)}
            />
          ))}
        </div>
      )}

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
        title={t("sos.deleteTitle")}
        entityLabel={
          deleteTarget
            ? `${deleteTarget.code} · ${deleteTarget.titleLine}`
            : undefined
        }
        description={t("sos.deleteDesc")}
        confirmLabel={t("sos.confirmRemove")}
        busy={deleteBusy}
      />
    </div>
  );
}

function SosAlertCard({
  alert,
  canRemove,
  onRemove,
}: {
  alert: SosAlertRow;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const { t } = useLocale();
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
              {translateSosSeverity(alert.severityLabel, t)}
            </span>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
            {canCall ? (
              <a
                href={`tel:${phoneDigits}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-pika-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-ink/90"
              >
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                {t("sos.contact")}
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-pika-page px-4 py-2.5 text-sm font-semibold text-pika-muted"
                title={t("sos.phoneUnavailable")}
              >
                <FontAwesomeIcon icon={faPhone} className="h-4 w-4" />
                {t("sos.contact")}
              </button>
            )}
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
            >
              {t("sos.call111")}
            </button>
            {canRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                {t("sos.confirmRemove")}
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-base font-bold text-pika-ink md:text-lg">
            {alert.titleLine}
          </p>
          <p className="mt-1 text-sm text-pika-muted">
            {translateSosRideRef(alert.rideRef, t)}
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm">
          <div className="flex min-w-0 flex-col gap-1.5 text-xs">
            <span className="inline-flex items-start gap-2 text-pika-ink">
              <FontAwesomeIcon
                icon={faCircle}
                className="mt-0.5 h-2 w-2 shrink-0 text-red-600"
              />
              <span className="leading-snug">
                <span className="font-medium text-pika-muted">{t("common.origin")}: </span>
                {alert.origin}
              </span>
            </span>
            <span className="inline-flex items-start gap-2 text-pika-ink">
              <FontAwesomeIcon
                icon={faLocationDot}
                className="mt-0.5 h-3 w-3 shrink-0 text-red-600"
              />
              <span className="leading-snug">
                <span className="font-medium text-pika-muted">{t("common.destination")}: </span>
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
                    {t("common.coordinates")}:{" "}
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
              {translateRelativeTime(alert.timeAgoLabel, t)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FontAwesomeIcon
                icon={faCircle}
                className="h-2 w-2 shrink-0 text-red-600"
              />
              <span className="font-medium text-red-600">
                {translateSosTracking(alert.trackingStatusLabel, t)}
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
                {t("sos.maps")}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

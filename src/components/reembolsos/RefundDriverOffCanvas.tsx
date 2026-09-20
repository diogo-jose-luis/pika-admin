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
} from "@fortawesome/free-solid-svg-icons";
import { OffCanvas } from "@/components/ui/OffCanvas";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { DriverCard } from "@/lib/drivers";

type RefundDriverOffCanvasProps = {
  driver: DriverCard | null;
  missing: boolean;
  onClose: () => void;
};

export function RefundDriverOffCanvas({
  driver,
  missing,
  onClose,
}: RefundDriverOffCanvasProps) {
  const { t } = useLocale();
  const open = driver !== null || missing;
  const okDocs = driver?.verificationDocs.filter((d) => d.ok) ?? [];

  return (
    <OffCanvas
      open={open}
      onClose={onClose}
      title={t("refunds.driverTitle")}
      subtitle={driver ? t("refunds.driverSubtitle", { name: driver.name }) : undefined}
      wide
    >
      <div className="p-5">
        {!driver ? (
          <p className="text-sm text-pika-muted">{t("refunds.driverMissing")}</p>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar
                photoUrl={driver.photoUrl}
                name={driver.name}
                className="h-20 w-20 sm:h-24 sm:w-24"
              />
              <div>
                <p className="text-2xl font-bold text-pika-ink sm:text-3xl">
                  {driver.name}
                </p>
                <p className="mt-1 text-sm font-medium text-pika-muted">{driver.id}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-pika-ink">
                  <FontAwesomeIcon icon={faStar} className="h-4 w-4 text-amber-500" />
                  <span className="font-semibold">{driver.rating}</span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <section className="rounded-xl border border-pika-border bg-pika-page/60 p-4">
                <h3 className="text-sm font-bold text-pika-primary">
                  {t("refunds.contact")}
                </h3>
                <ul className="mt-3 space-y-2.5 text-sm text-pika-ink">
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>{driver.email}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faPhone}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>{driver.phone}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faBuildingColumns}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>{driver.iban}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faGaugeHigh}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>{driver.onlineLabel}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faLocationDot}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
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
                      <span>{driver.lastLocationLabel}</span>
                    )}
                  </li>
                </ul>
              </section>

              <section className="rounded-xl border border-pika-border bg-pika-page/60 p-4">
                <h3 className="text-sm font-bold text-pika-primary">
                  {t("refunds.vehicle")}
                </h3>
                <ul className="mt-3 space-y-2.5 text-sm text-pika-ink">
                  <li className="flex items-start gap-2.5">
                    <FontAwesomeIcon
                      icon={faCar}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span>{driver.vehicleModel}</span>
                  </li>
                  <li>
                    <span className="font-medium">{t("refunds.plate")}: </span>
                    {driver.vehiclePlate}
                  </li>
                  <li>
                    <span className="font-medium">{t("refunds.color")}: </span>
                    {driver.vehicleColor}
                  </li>
                </ul>
              </section>
            </div>

            {okDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
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
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
                <p className="text-2xl font-bold text-pika-ink">
                  {driver.totalRides.toLocaleString("pt-AO")}
                </p>
                <p className="mt-1 text-sm text-pika-muted">
                  {t("refunds.ridesCount")}
                </p>
              </div>
              <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
                <p className="text-xl font-bold text-pika-ink sm:text-2xl">
                  Kz {driver.totalEarningsKz}
                </p>
                <p className="mt-1 text-sm text-pika-muted">
                  {t("refunds.earnings")}
                </p>
              </div>
              <div className="rounded-xl border border-pika-border bg-pika-card px-4 py-5 text-center">
                <p className="text-lg font-bold text-pika-ink sm:text-xl">
                  {driver.registeredAt}
                </p>
                <p className="mt-1 text-sm text-pika-muted">
                  {t("refunds.registeredAt")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </OffCanvas>
  );
}

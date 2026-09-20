"use client";

import { OffCanvas } from "@/components/ui/OffCanvas";
import { RideDetailsBody } from "@/components/rides/RideDetailsModal";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { RideRow } from "@/lib/ride-history";

type RefundRideOffCanvasProps = {
  ride: RideRow | null;
  missing: boolean;
  onClose: () => void;
};

export function RefundRideOffCanvas({
  ride,
  missing,
  onClose,
}: RefundRideOffCanvasProps) {
  const { t } = useLocale();
  const open = ride !== null || missing;

  return (
    <OffCanvas
      open={open}
      onClose={onClose}
      title={t("refunds.rideTitle")}
      subtitle={ride?.dateLabel || undefined}
      wide
    >
      <div className="p-5">
        {ride ? (
          <RideDetailsBody ride={ride} />
        ) : (
          <p className="text-sm text-pika-muted">{t("refunds.rideMissing")}</p>
        )}
      </div>
    </OffCanvas>
  );
}

"use client";

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useLocale } from "@/components/providers/LocaleProvider";

type RideNoteModalProps = {
  rideId: number;
  note: string;
  onClose: () => void;
};

export function RideNoteModal({ rideId, note, onClose }: RideNoteModalProps) {
  const { t } = useLocale();
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
        aria-labelledby="ride-note-title"
        className="w-full max-w-md rounded-2xl bg-pika-card p-5 shadow-xl sm:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="ride-note-title" className="text-lg font-bold text-pika-ink">
              {t("rides.noteTitle", { id: rideId })}
            </h2>
            <p className="mt-0.5 text-xs text-pika-muted">
              {t("rides.noteHint")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pika-border text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
            aria-label={t("common.close")}
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <p className="whitespace-pre-wrap text-sm leading-relaxed text-pika-ink">
          {note.trim() ? (
            note
          ) : (
            <span className="italic text-pika-muted">{t("rides.noNote")}</span>
          )}
        </p>
      </div>
    </div>
  );
}

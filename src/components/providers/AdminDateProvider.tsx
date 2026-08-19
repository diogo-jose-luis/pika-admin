"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { localeToBcp47, type TranslateFn } from "@/lib/i18n";

export function isoDateLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function labelForIso(
  iso: string,
  t?: TranslateFn,
  dateLocale = "pt-AO",
): string {
  const today = isoDateLocal();
  const todayLabel = t ? t("common.today") : "Hoje";
  if (iso === today) return todayLabel;
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const da = parts[2];
  if (!y || !mo || !da) return todayLabel;
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type AdminDateContextValue = {
  selectedIso: string;
  setSelectedIso: (iso: string) => void;
  dateLabel: string;
};

const AdminDateContext = createContext<AdminDateContextValue | null>(null);

export function AdminDateProvider({ children }: { children: ReactNode }) {
  const { t, locale } = useLocale();
  const [selectedIso, setSelectedIsoState] = useState(() => isoDateLocal());

  const setSelectedIso = useCallback((iso: string) => {
    setSelectedIsoState(iso);
  }, []);

  const value = useMemo(
    () => ({
      selectedIso,
      setSelectedIso,
      dateLabel: labelForIso(selectedIso, t, localeToBcp47(locale)),
    }),
    [selectedIso, setSelectedIso, t, locale],
  );

  return (
    <AdminDateContext.Provider value={value}>{children}</AdminDateContext.Provider>
  );
}

export function useAdminDate() {
  const ctx = useContext(AdminDateContext);
  if (!ctx) {
    throw new Error("useAdminDate must be used within AdminDateProvider");
  }
  return ctx;
}

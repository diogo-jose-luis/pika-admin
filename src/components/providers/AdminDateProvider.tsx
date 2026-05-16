"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export function isoDateLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function labelForIso(iso: string): string {
  const today = isoDateLocal();
  if (iso === today) return "Hoje";
  const parts = iso.split("-").map(Number);
  const y = parts[0];
  const mo = parts[1];
  const da = parts[2];
  if (!y || !mo || !da) return "Hoje";
  const d = new Date(y, mo - 1, da);
  return d.toLocaleDateString("pt-AO", {
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
  const [selectedIso, setSelectedIsoState] = useState(() => isoDateLocal());

  const setSelectedIso = useCallback((iso: string) => {
    setSelectedIsoState(iso);
  }, []);

  const value = useMemo(
    () => ({
      selectedIso,
      setSelectedIso,
      dateLabel: labelForIso(selectedIso),
    }),
    [selectedIso, setSelectedIso],
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

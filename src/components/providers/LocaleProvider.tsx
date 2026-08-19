"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { LOCALE_STORAGE_KEY } from "@/lib/storage-keys";
import {
  createTranslator,
  DEFAULT_LOCALE,
  isLocale,
  localeToBcp47,
  localeToHtmlLang,
  type Locale,
  type TranslateFn,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFn;
  mounted: boolean;
  dateLocale: string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE;
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = localeToHtmlLang(locale);
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readStoredLocale();
    setLocaleState(initial);
    applyLocale(initial);
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    applyLocale(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useMemo(() => createTranslator(locale), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      mounted,
      dateLocale: localeToBcp47(locale),
    }),
    [locale, setLocale, t, mounted],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

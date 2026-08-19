"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { locale: Locale; flag: string; codeKey: "language.pt" | "language.en"; nameKey: "language.portuguese" | "language.english" }[] =
  [
    { locale: "pt", flag: "🇵🇹", codeKey: "language.pt", nameKey: "language.portuguese" },
    { locale: "en", flag: "🇬🇧", codeKey: "language.en", nameKey: "language.english" },
  ];

export function LanguageToggle() {
  const { locale, setLocale, t, mounted } = useLocale();

  return (
    <div
      role="group"
      aria-label={t("language.aria")}
      className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-pika-border bg-pika-page p-1"
    >
      {OPTIONS.map((opt) => {
        const active = mounted && locale === opt.locale;
        return (
          <button
            key={opt.locale}
            type="button"
            onClick={() => setLocale(opt.locale)}
            aria-pressed={active}
            aria-label={t(opt.nameKey)}
            title={t(opt.nameKey)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
              active
                ? "bg-pika-card text-pika-ink shadow-sm"
                : "text-pika-muted hover:text-pika-ink",
            )}
          >
            <span aria-hidden className="text-sm leading-none">
              {opt.flag}
            </span>
            <span className="hidden sm:inline">{t(opt.codeKey)}</span>
          </button>
        );
      })}
    </div>
  );
}

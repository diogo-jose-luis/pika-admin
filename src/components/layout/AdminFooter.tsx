"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export function AdminFooter() {
  const { t } = useLocale();
  return (
    <footer className="shrink-0 border-t border-pika-border bg-pika-card px-4 py-3 text-center text-xs text-pika-muted">
      {t("footer.copyright", { year: new Date().getFullYear() })}
    </footer>
  );
}

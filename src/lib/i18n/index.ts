import { messages, type Locale, type Messages } from "@/lib/i18n/messages";
import type { RideStatus } from "@/lib/ride-history";

export type { Locale, Messages };
export { messages };

export const DEFAULT_LOCALE: Locale = "pt";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "pt" || value === "en";
}

export function localeToHtmlLang(locale: Locale): string {
  return locale === "en" ? "en" : "pt";
}

export function localeToBcp47(locale: Locale): string {
  return locale === "en" ? "en-GB" : "pt-AO";
}

type Vars = Record<string, string | number>;

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    vars[key] == null ? `{${key}}` : String(vars[key]),
  );
}

function lookup(dict: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = dict;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export type TranslateFn = (path: string, vars?: Vars) => string;

export function createTranslator(locale: Locale): TranslateFn {
  const dict = messages[locale];
  const fallback = messages.pt;
  return (path, vars) => {
    const value = lookup(dict, path) ?? lookup(fallback, path) ?? path;
    return interpolate(value, vars);
  };
}

const RIDE_STATUS_KEYS: Record<RideStatus, string> = {
  "Em andamento": "rideStatus.inProgress",
  "Em solicitação": "rideStatus.inRequest",
  Concluída: "rideStatus.completed",
  Pendente: "rideStatus.pending",
  Cancelada: "rideStatus.cancelled",
};

export function translateRideStatus(status: RideStatus, t: TranslateFn): string {
  return t(RIDE_STATUS_KEYS[status]);
}

const WEEKDAY_KEYS: Record<string, string> = {
  Dom: "weekday.sun",
  Seg: "weekday.mon",
  Ter: "weekday.tue",
  Qua: "weekday.wed",
  Qui: "weekday.thu",
  Sex: "weekday.fri",
  Sáb: "weekday.sat",
};

export function translateWeekday(day: string, t: TranslateFn): string {
  const key = WEEKDAY_KEYS[day];
  return key ? t(key) : day;
}

const MONTH_KEYS: Record<string, string> = {
  Jan: "month.jan",
  Fev: "month.feb",
  Mar: "month.mar",
  Abr: "month.apr",
  Mai: "month.may",
  Jun: "month.jun",
  Jul: "month.jul",
  Ago: "month.aug",
  Set: "month.sep",
  Out: "month.oct",
  Nov: "month.nov",
  Dez: "month.dec",
};

export function translateMonth(month: string, t: TranslateFn): string {
  const key = MONTH_KEYS[month];
  return key ? t(key) : month;
}

const FINANCE_CATEGORY_KEYS: Record<string, string> = {
  "Corridas Regulares": "finance.catRegular",
  "Corridas Premium": "finance.catPremium",
  Entregas: "finance.catDeliveries",
  Outros: "finance.catOther",
};

export function translateFinanceCategory(name: string, t: TranslateFn): string {
  const key = FINANCE_CATEGORY_KEYS[name];
  return key ? t(key) : name;
}

const SOS_SEVERITY_KEYS: Record<string, string> = {
  Crítico: "sos.severityCritical",
  Alto: "sos.severityHigh",
  Moderado: "sos.severityModerate",
  Alerta: "sos.severityAlert",
};

export function translateSosSeverity(label: string, t: TranslateFn): string {
  const key = SOS_SEVERITY_KEYS[label];
  return key ? t(key) : label;
}

export function translateSosRideRef(ref: string, t: TranslateFn): string {
  const match = ref.match(/^Corrida (.+)$/);
  if (!match) return ref;
  return t("sos.rideRef", { id: match[1].replace(/…$/, "") });
}

export function translateSosTracking(label: string, t: TranslateFn): string {
  if (label === "Em rastreio ao vivo") return t("sos.tracking");
  return label;
}

const TX_COMPLETED_PREFIX = "Corrida concluída — ";
const TX_COMMISSION_PREFIX = "Comissão — ";

export function translateFinanceTransactionLabel(
  label: string,
  t: TranslateFn,
): string {
  if (label.startsWith(TX_COMPLETED_PREFIX)) {
    const category = translateFinanceCategory(
      label.slice(TX_COMPLETED_PREFIX.length),
      t,
    );
    return t("finance.txCompleted", { category });
  }
  if (label.startsWith(TX_COMMISSION_PREFIX)) {
    const category = translateFinanceCategory(
      label.slice(TX_COMMISSION_PREFIX.length),
      t,
    );
    return t("finance.txCommission", { category });
  }
  return label;
}

/** Translates Portuguese relative-time strings produced by the APIs. */
export function translateRelativeTime(label: string, t: TranslateFn): string {
  if (label === "—" || !label) return label;
  if (label === "agora") return t("relative.now");

  const dashMin = label.match(/^(\d+) min atrás$/);
  if (dashMin) return t("relative.minutesAgo", { n: dashMin[1]! });

  const dashHour = label.match(/^(\d+)h atrás$/);
  if (dashHour) return t("relative.hoursAgo", { n: dashHour[1]! });

  const dashDay = label.match(/^(\d+)d atrás$/);
  if (dashDay) return t("relative.daysAgo", { n: dashDay[1]! });

  const sosMin = label.match(/^há (\d+) min$/);
  if (sosMin) return t("relative.sosMinutes", { n: sosMin[1]! });

  const sosHour = label.match(/^há (\d+) h$/);
  if (sosHour) return t("relative.sosHours", { n: sosHour[1]! });

  if (label === "há 1 dia") return t("relative.sosDay");

  const sosDays = label.match(/^há (\d+) dias$/);
  if (sosDays) return t("relative.sosDays", { n: sosDays[1]! });

  return label;
}

const NAV_HREF_KEYS: Record<string, string> = {
  "/dashboard": "nav.overview",
  "/historico-corridas": "nav.rideHistory",
  "/motoristas": "nav.drivers",
  "/passageiros": "nav.passengers",
  "/financeiro": "nav.finance",
  "/mapa-ao-vivo": "nav.liveMap",
  "/relatorios": "nav.reports",
  "/modelo-viaturas": "nav.vehicleModels",
  "/validacao-motoristas": "nav.driverValidation",
  "/alterar-dados": "nav.dataChanges",
  "/sos": "nav.sos",
  "/configuracoes": "nav.settings",
};

export function translateNavLabel(href: string, fallback: string, t: TranslateFn): string {
  const key = NAV_HREF_KEYS[href];
  return key ? t(key) : fallback;
}

type PageCopy = { titleKey: string; subtitleKey: string };

const PAGE_COPY: Record<string, PageCopy> = {
  "/dashboard": {
    titleKey: "pages.dashboardTitle",
    subtitleKey: "pages.dashboardSubtitle",
  },
  "/historico-corridas": {
    titleKey: "pages.ridesTitle",
    subtitleKey: "pages.ridesSubtitle",
  },
  "/passageiros": {
    titleKey: "pages.passengersTitle",
    subtitleKey: "pages.passengersSubtitle",
  },
  "/relatorios": {
    titleKey: "pages.reportsTitle",
    subtitleKey: "pages.reportsSubtitle",
  },
  "/mapa-ao-vivo": {
    titleKey: "pages.liveMapTitle",
    subtitleKey: "pages.liveMapSubtitle",
  },
  "/financeiro": {
    titleKey: "pages.financeTitle",
    subtitleKey: "pages.financeSubtitle",
  },
  "/financeiro/transacoes": {
    titleKey: "pages.transactionsTitle",
    subtitleKey: "pages.transactionsSubtitle",
  },
  "/motoristas": {
    titleKey: "pages.driversTitle",
    subtitleKey: "pages.driversSubtitle",
  },
  "/modelo-viaturas": {
    titleKey: "pages.vehicleModelsTitle",
    subtitleKey: "pages.vehicleModelsSubtitle",
  },
  "/validacao-motoristas": {
    titleKey: "pages.driverValidationTitle",
    subtitleKey: "pages.driverValidationSubtitle",
  },
  "/alterar-dados": {
    titleKey: "pages.dataChangesTitle",
    subtitleKey: "pages.dataChangesSubtitle",
  },
  "/sos": {
    titleKey: "pages.sosTitle",
    subtitleKey: "pages.sosSubtitle",
  },
  "/configuracoes": {
    titleKey: "pages.settingsTitle",
    subtitleKey: "pages.settingsSubtitle",
  },
};

export function pageCopyForPath(
  pathname: string,
  t: TranslateFn,
): { title: string; subtitle: string } {
  if (
    pathname.startsWith("/validacao-motoristas/") &&
    pathname !== "/validacao-motoristas"
  ) {
    return {
      title: t("pages.driverValidationTitle"),
      subtitle: t("pages.driverValidationSubtitle"),
    };
  }

  const copy = PAGE_COPY[pathname];
  if (copy) {
    return { title: t(copy.titleKey), subtitle: t(copy.subtitleKey) };
  }

  const navKey = NAV_HREF_KEYS[pathname];
  if (navKey) {
    return { title: t(navKey), subtitle: t("pages.dashboardSubtitle") };
  }

  return {
    title: t("pages.fallbackTitle"),
    subtitle: t("pages.fallbackSubtitle"),
  };
}

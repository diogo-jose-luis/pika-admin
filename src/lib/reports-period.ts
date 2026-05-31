export const REPORT_YEARS = [2026, 2027, 2028, 2029, 2030] as const;

export const MONTH_OPTIONS = [
  { value: 1, label: "Janeiro" },
  { value: 2, label: "Fevereiro" },
  { value: 3, label: "Março" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Maio" },
  { value: 6, label: "Junho" },
  { value: 7, label: "Julho" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Setembro" },
  { value: 10, label: "Outubro" },
  { value: 11, label: "Novembro" },
  { value: 12, label: "Dezembro" },
] as const;

export function monthLabel(month: number): string {
  return MONTH_OPTIONS.find((m) => m.value === month)?.label ?? `Mês ${month}`;
}

export function normalizeReportMonth(month: unknown): number {
  const n = typeof month === "number" ? month : Number(month);
  if (!Number.isFinite(n) || n < 1 || n > 12) return new Date().getMonth() + 1;
  return Math.floor(n);
}

export function normalizeReportYear(year: unknown): number {
  const n = typeof year === "number" ? year : Number(year);
  if (!Number.isFinite(n)) return REPORT_YEARS[0];
  if (REPORT_YEARS.includes(n as (typeof REPORT_YEARS)[number])) return n;
  return REPORT_YEARS[0];
}

export function periodBounds(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

export function periodLabel(year: number, month: number): string {
  return `${monthLabel(month)} ${year}`;
}

/** Mês civil anterior ao mês atual do sistema. */
export function previousCalendarMonth(): { year: number; month: number } {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

export function formatGeneratedAt(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

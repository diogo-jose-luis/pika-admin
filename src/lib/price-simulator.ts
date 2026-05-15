export type PeakDaySchedule = {
  start: string;
  end: string;
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
] as const;

export const DEFAULT_PEAK_SCHEDULE: PeakDaySchedule[] = WEEKDAY_LABELS.map(
  () => ({ start: "", end: "" }),
);

export function parseTimeToMinutes(time: string): number | null {
  const trimmed = time.trim();
  if (!trimmed) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function isPeakHourAt(
  schedule: PeakDaySchedule[],
  at: Date,
): boolean {
  const day = at.getDay();
  const daySchedule = schedule[day];
  if (!daySchedule) return false;

  const start = parseTimeToMinutes(daySchedule.start);
  const end = parseTimeToMinutes(daySchedule.end);
  if (start === null || end === null) return false;
  if (start === end) return false;

  const nowMinutes = at.getHours() * 60 + at.getMinutes();

  if (start < end) {
    return nowMinutes >= start && nowMinutes < end;
  }

  return nowMinutes >= start || nowMinutes < end;
}

export function calculateRidePrice(params: {
  tarifaBase: number;
  tarifaPorKm: number;
  multiplicadorPicoKm: number;
  multiplicadorDemandaKm: number;
  distanceKm: number;
  simulationAt: Date;
  peakSchedule: PeakDaySchedule[];
}) {
  const {
    tarifaBase,
    tarifaPorKm,
    multiplicadorPicoKm,
    multiplicadorDemandaKm,
    distanceKm,
    simulationAt,
    peakSchedule,
  } = params;

  const isPeak = isPeakHourAt(peakSchedule, simulationAt);
  const distancePart = tarifaPorKm * distanceKm;
  const peakPart = isPeak ? multiplicadorPicoKm * distanceKm : 0;
  const demandPart =
    multiplicadorDemandaKm > 0 ? multiplicadorDemandaKm * distanceKm : 0;
  const total = tarifaBase + distancePart + peakPart + demandPart;

  return {
    base: tarifaBase,
    distancePart,
    peakPart,
    demandPart,
    total,
    isPeak,
  };
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function parseDatetimeLocalValue(value: string): Date | null {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

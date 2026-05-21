import { formatKz } from "@/lib/format-kz";

export type RideStatus = "Em andamento" | "Concluída" | "Pendente" | "Cancelada";

export type RideRow = {
  id: number;
  passenger: string;
  driver: string;
  origin: string;
  destination: string;
  valueLabel: string;
  distanceLabel: string;
  durationLabel: string;
  status: RideStatus;
  dateLabel: string;
  /** Timestamp em ms para filtros por intervalo; null se a data for inválida. */
  dateMs: number | null;
  /** Passageiro → motorista (`estrelas`). */
  passengerToDriverStars: number | null;
  passengerToDriverComment: string;
  /** Motorista → passageiro (`estrela_driver_passageiro`). */
  driverToPassengerStars: number | null;
  driverToPassengerComment: string;
};

export type CorridaFakeDoc = {
  passageiro_nome?: string;
  motoristaNome?: string;
  local_inicio?: string;
  local_fim?: string;
  preco?: number;
  estado?: number;
  data?: { _seconds: number; _nanoseconds: number } | string | null;
  estrelas?: number;
  comentario?: string;
  estrela_driver_passageiro?: number;
  estrelas_driver_passageiro?: number;
  comentario_driver_passageiro?: string;
  distancia?: number | string;
  duracao?: number | string;
};

const ESTADO_TO_STATUS: Record<number, RideStatus> = {
  0: "Pendente",
  1: "Concluída",
  2: "Cancelada",
  3: "Em andamento",
};

export function parseRideStarRating(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 1 || n > 5) return null;
  return Math.round(n);
}

function readComment(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function formatDistanceLabel(value: unknown): string {
  if (value == null || value === "") return "";
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "";
  const text = n.toLocaleString("pt-AO", { maximumFractionDigits: 1 });
  return `${text.replace(".", ",")} Km`;
}

function formatDurationLabel(value: unknown): string {
  if (value == null || value === "") return "";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${Math.round(n)} min`;
}

export function mapEstadoToStatus(estado: unknown): RideStatus {
  const n = typeof estado === "number" ? estado : Number(estado);
  return ESTADO_TO_STATUS[n] ?? "Pendente";
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function parseRideDateToMs(value: unknown): number | null {
  if (value == null) return null;

  let date: Date | null = null;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === "object" && value !== null && "_seconds" in value) {
    const sec = (value as { _seconds: number })._seconds;
    date = new Date(sec * 1000);
  } else if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    date = (value as { toDate: () => Date }).toDate();
  } else if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) date = parsed;
  }

  if (!date || Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

function startOfDayFromIso(iso: string): number | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
}

function endOfDayFromIso(iso: string): number | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
}

export function formatRideDate(value: unknown): string {
  const ms = parseRideDateToMs(value);
  if (ms == null) return "";

  const date = new Date(ms);
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function rideMatchesDateRange(
  row: RideRow,
  fromIso: string,
  toIso: string,
): boolean {
  if (!fromIso.trim() && !toIso.trim()) return true;
  if (row.dateMs == null) return false;

  if (fromIso.trim()) {
    const fromStart = startOfDayFromIso(fromIso.trim());
    if (fromStart == null || row.dateMs < fromStart) return false;
  }

  if (toIso.trim()) {
    const toEnd = endOfDayFromIso(toIso.trim());
    if (toEnd == null || row.dateMs > toEnd) return false;
  }

  return true;
}

export function rideMatchesSearch(row: RideRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const idStr = String(row.id);
  const haystack = [
    idStr,
    `#${idStr}`,
    row.passenger,
    row.driver,
    row.origin,
    row.destination,
    row.valueLabel,
    row.distanceLabel,
    row.durationLabel,
    row.status,
    row.dateLabel,
    row.passengerToDriverComment,
    row.driverToPassengerComment,
    row.passengerToDriverStars != null ? String(row.passengerToDriverStars) : "",
    row.driverToPassengerStars != null ? String(row.driverToPassengerStars) : "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function mapCorridaFakeToRideRow(
  data: CorridaFakeDoc,
  ordinalId: number,
): RideRow {
  const preco =
    typeof data.preco === "number" ? data.preco : Number(data.preco) || 0;

  const distanceLabel = formatDistanceLabel(data.distancia);
  const durationLabel = formatDurationLabel(data.duracao);

  return {
    id: ordinalId,
    passenger: data.passageiro_nome?.trim() || "—",
    driver: data.motoristaNome?.trim() || "—",
    origin: data.local_inicio?.trim() || "—",
    destination: data.local_fim?.trim() || "—",
    valueLabel: formatKz(preco),
    distanceLabel,
    durationLabel,
    status: mapEstadoToStatus(data.estado),
    dateLabel: formatRideDate(data.data),
    dateMs: parseRideDateToMs(data.data),
    passengerToDriverStars: parseRideStarRating(data.estrelas),
    passengerToDriverComment: readComment(data.comentario),
    driverToPassengerStars: parseRideStarRating(
      data.estrela_driver_passageiro ?? data.estrelas_driver_passageiro,
    ),
    driverToPassengerComment: readComment(data.comentario_driver_passageiro),
  };
}

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
};

export type CorridaFakeDoc = {
  passageiro_nome?: string;
  motoristaNome?: string;
  local_inicio?: string;
  local_fim?: string;
  preco?: number;
  estado?: number;
  data?: { _seconds: number; _nanoseconds: number } | string | null;
};

const ESTADO_TO_STATUS: Record<number, RideStatus> = {
  0: "Pendente",
  1: "Concluída",
  2: "Cancelada",
  3: "Em andamento",
};

export function mapEstadoToStatus(estado: unknown): RideStatus {
  const n = typeof estado === "number" ? estado : Number(estado);
  return ESTADO_TO_STATUS[n] ?? "Pendente";
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

export function formatRideDate(value: unknown): string {
  if (value == null) return "";

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

  if (!date) return "";

  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}/${date.getFullYear()} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
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

  return {
    id: ordinalId,
    passenger: data.passageiro_nome?.trim() || "—",
    driver: data.motoristaNome?.trim() || "—",
    origin: data.local_inicio?.trim() || "—",
    destination: data.local_fim?.trim() || "—",
    valueLabel: formatKz(preco),
    distanceLabel: "",
    durationLabel: "",
    status: mapEstadoToStatus(data.estado),
    dateLabel: formatRideDate(data.data),
  };
}

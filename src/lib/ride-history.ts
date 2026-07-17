import { formatKz } from "@/lib/format-kz";
import { refToDocId } from "@/lib/firestore-ref";

export type RideStatus =
  | "Em andamento"
  | "Em solicitação"
  | "Concluída"
  | "Pendente"
  | "Cancelada";

export type RideRow = {
  /** ID do documento Firestore (`corrida_fake`). */
  docId: string;
  /** Número sequencial exibido na tabela (#1, #2, …). */
  id: number;
  passenger: string;
  driver: string;
  origin: string;
  destination: string;
  valueLabel: string;
  commissionLabel: string;
  distanceLabel: string;
  durationLabel: string;
  /** Horário de início (`hora_minuto_inicio`), formato HH:mm. */
  startTimeLabel: string;
  /** Horário de fim (`hora_minuto_fim`), formato HH:mm. */
  endTimeLabel: string;
  /** Nota administrativa / do sistema (`nota`). */
  note: string;
  /** Corrida encerrada automaticamente pelo sistema. */
  closedBySystem: boolean;
  /** Valor bruto de `estado` no Firestore (0/1/2/3). */
  estado: number | null;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
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
  /** Quem cancelou a corrida (resolvido a partir de `cancelada_por`). */
  cancelledBy: RideCancelledBy | null;
};

export type RideCancelledBy = {
  role: "driver" | "passenger" | "other";
  name: string;
};

export type CorridaFakeDoc = {
  passageiro_nome?: string;
  motoristaNome?: string;
  local_inicio?: string;
  local_fim?: string;
  preco?: number;
  comissao?: number;
  estado?: number;
  /** Indica que o motorista já chegou ao ponto de recolha. */
  motorista_chegou?: boolean | string | number;
  /** Referência (`users/{id}`) de quem cancelou a corrida. */
  cancelada_por?: unknown;
  /** Referência (`users/{id}`) do motorista da corrida. */
  motorista_id?: unknown;
  /** Referência (`users/{id}`) do passageiro da corrida. */
  passageiro_id?: unknown;
  data?: { _seconds: number; _nanoseconds: number } | string | null;
  estrelas?: number;
  comentario?: string;
  estrela_driver_passageiro?: number;
  estrelas_driver_passageiro?: number;
  comentario_driver_passageiro?: string;
  /** Texto da Google Directions API (ex.: "12,4 km"). */
  distanciaKmText?: string;
  /** Metros da rota (valor numérico da API). */
  distanciaKM?: number;
  /** Texto da Google Directions API (ex.: "21 mins"). */
  duracaoText?: string;
  /** Segundos da rota (valor numérico da API). */
  duracaoNumero?: number;
  /** Campos legados — mantidos para documentos antigos. */
  distancia?: number | string;
  duracao?: number | string;
  /** Início real da corrida (hora/minuto). */
  hora_minuto_inicio?: { _seconds: number; _nanoseconds: number } | string | null;
  /** Fim real da corrida (hora/minuto). */
  hora_minuto_fim?: { _seconds: number; _nanoseconds: number } | string | null;
  /** Nota administrativa ou do sistema. */
  nota?: string;
  /** True quando o sistema encerrou a corrida automaticamente. */
  fechada_pelo_sistema?: boolean | string | number;
  /** Alias tipográfico legado (fechado vs fechada). */
  fechado_pelo_sistema?: boolean | string | number;
  viaturaMarcaModelo?: string;
  viaturaMatricula?: string;
  viatura_cor?: string;
  localizacao_atual_lat?: number;
  localizacao_atual_lng?: number;
};

const ESTADO_TO_STATUS: Record<number, RideStatus> = {
  0: "Em andamento",
  1: "Concluída",
  2: "Cancelada",
  3: "Em andamento",
};

export function isInProgressEstado(estado: unknown): boolean {
  const n = typeof estado === "number" ? estado : Number(estado);
  return n === 0 || n === 3;
}

export function isMotoristaChegou(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

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

function readRouteTextLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

function readVehicleField(value: unknown): string {
  const text = readRouteTextLabel(value);
  return text || "—";
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

export function formatRideTimeOfDay(value: unknown): string {
  const ms = parseRideDateToMs(value);
  if (ms == null) return "";
  const date = new Date(ms);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** Duração entre dois timestamps em horas e/ou minutos (ex.: "1h 12 min", "45 min"). */
export function formatDurationFromRange(
  start: unknown,
  end: unknown,
): string {
  const startMs = parseRideDateToMs(start);
  const endMs = parseRideDateToMs(end);
  if (startMs == null || endMs == null || endMs < startMs) return "";

  const totalMinutes = Math.round((endMs - startMs) / 60_000);
  if (totalMinutes <= 0) return "";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes} min`;
  if (hours > 0) return `${hours}h`;
  return `${minutes} min`;
}

export function isClosedBySystem(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function parseEstadoNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function mapEstadoToStatus(estado: unknown): RideStatus {
  const n = typeof estado === "number" ? estado : Number(estado);
  return ESTADO_TO_STATUS[n] ?? "Pendente";
}

/**
 * Resolve o status considerando `motorista_chegou`: uma corrida cujo `estado`
 * indica "Em andamento" só permanece assim se o motorista já tiver chegado;
 * caso contrário fica "Em solicitação".
 */
export function resolveRideStatus(
  estado: unknown,
  motoristaChegou: unknown,
): RideStatus {
  const base = mapEstadoToStatus(estado);
  if (base === "Em andamento" && !isMotoristaChegou(motoristaChegou)) {
    return "Em solicitação";
  }
  return base;
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
  } else if (typeof value === "object" && value !== null && "seconds" in value) {
    const sec = (value as { seconds: number }).seconds;
    if (typeof sec === "number") date = new Date(sec * 1000);
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
    row.commissionLabel,
    row.distanceLabel,
    row.durationLabel,
    row.startTimeLabel,
    row.endTimeLabel,
    row.note,
    row.vehicleModel,
    row.vehiclePlate,
    row.vehicleColor,
    row.status,
    row.dateLabel,
    row.passengerToDriverComment,
    row.driverToPassengerComment,
    row.passengerToDriverStars != null ? String(row.passengerToDriverStars) : "",
    row.driverToPassengerStars != null ? String(row.driverToPassengerStars) : "",
    row.closedBySystem ? "sistema" : "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function resolveCancelledBy(data: CorridaFakeDoc): RideCancelledBy | null {
  const cancelledId = refToDocId(data.cancelada_por);
  if (!cancelledId) return null;

  const motoristaId = refToDocId(data.motorista_id);
  if (motoristaId && cancelledId === motoristaId) {
    return { role: "driver", name: data.motoristaNome?.trim() || "—" };
  }

  const passageiroId = refToDocId(data.passageiro_id);
  if (passageiroId && cancelledId === passageiroId) {
    return { role: "passenger", name: data.passageiro_nome?.trim() || "—" };
  }

  return { role: "other", name: "—" };
}

export function mapCorridaFakeToRideRow(
  docId: string,
  data: CorridaFakeDoc,
  ordinalId: number,
): RideRow {
  const preco =
    typeof data.preco === "number" ? data.preco : Number(data.preco) || 0;
  const comissao =
    typeof data.comissao === "number" ? data.comissao : Number(data.comissao) || 0;

  const distanceLabel =
    readRouteTextLabel(data.distanciaKmText) ||
    formatDistanceLabel(data.distancia);
  const startTimeLabel = formatRideTimeOfDay(data.hora_minuto_inicio);
  const endTimeLabel = formatRideTimeOfDay(data.hora_minuto_fim);
  const durationLabel =
    formatDurationFromRange(data.hora_minuto_inicio, data.hora_minuto_fim) ||
    readRouteTextLabel(data.duracaoText) ||
    formatDurationLabel(data.duracao);

  return {
    docId,
    id: ordinalId,
    passenger: data.passageiro_nome?.trim() || "—",
    driver: data.motoristaNome?.trim() || "—",
    origin: data.local_inicio?.trim() || "—",
    destination: data.local_fim?.trim() || "—",
    valueLabel: formatKz(preco),
    commissionLabel: comissao > 0 ? formatKz(comissao) : "—",
    distanceLabel,
    durationLabel,
    startTimeLabel,
    endTimeLabel,
    note: readComment(data.nota),
    closedBySystem: isClosedBySystem(
      data.fechada_pelo_sistema ?? data.fechado_pelo_sistema,
    ),
    estado: parseEstadoNumber(data.estado),
    vehicleModel: readVehicleField(data.viaturaMarcaModelo),
    vehiclePlate: readVehicleField(data.viaturaMatricula),
    vehicleColor: readVehicleField(data.viatura_cor),
    status: resolveRideStatus(data.estado, data.motorista_chegou),
    dateLabel: formatRideDate(data.data),
    dateMs: parseRideDateToMs(data.data),
    passengerToDriverStars: parseRideStarRating(data.estrelas),
    passengerToDriverComment: readComment(data.comentario),
    driverToPassengerStars: parseRideStarRating(
      data.estrela_driver_passageiro ?? data.estrelas_driver_passageiro,
    ),
    driverToPassengerComment: readComment(data.comentario_driver_passageiro),
    cancelledBy: resolveCancelledBy(data),
  };
}

import { readLatLng, type LiveMapLatLng } from "@/lib/live-map";
import {
  isInProgressEstado,
  isMotoristaChegou,
  parseRideDateToMs,
  resolveRideStatus,
  type RideStatus,
} from "@/lib/ride-history";

/** Intervalo de atualização do acompanhamento — o mesmo usado nas apps. */
export const RIDE_TRACKING_REFRESH_MS = 2000;

export type RideTrackingDoc = {
  estado?: number;
  motorista_chegou?: boolean | string | number;
  motorista_no_local_de_destino?: boolean | string | number;
  motoristaNome?: string;
  motorista_telefone?: string;
  passageiro_nome?: string;
  passageiro_telefone?: string;
  local_inicio?: string;
  local_fim?: string;
  local_inicio_lat?: number;
  local_inicio_lng?: number;
  local_destino_lat?: number;
  local_destino_lng?: number;
  localizacao_atual_lat?: number;
  localizacao_atual_lng?: number;
  motorista_lat?: number;
  motorista_lng?: number;
  rota_atualizada?: unknown;
  tempoEstimadoCorridaEmProgresso?: string;
  duracaoText?: string;
  distanciaKmText?: string;
  viaturaMarcaModelo?: string;
  viaturaMatricula?: string;
  viatura_cor?: string;
  hora_minuto_inicio?: unknown;
};

export type RideTracking = {
  docId: string;
  status: RideStatus;
  inProgress: boolean;
  driverArrived: boolean;
  driverAtDestination: boolean;
  driver: string;
  driverPhone: string;
  passenger: string;
  passengerPhone: string;
  originLabel: string;
  destinationLabel: string;
  origin: LiveMapLatLng | null;
  destination: LiveMapLatLng | null;
  driverLocation: LiveMapLatLng | null;
  route: LiveMapLatLng[];
  etaLabel: string;
  distanceLabel: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  startedAtMs: number | null;
};

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isTruthyFlag(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

/** Descodifica uma polyline codificada (formato Google Encoded Polyline). */
export function decodePolyline(encoded: string): LiveMapLatLng[] {
  const points: LiveMapLatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) return [];
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      if (index >= encoded.length) return [];
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

function pointFromUnknown(value: unknown): LiveMapLatLng | null {
  if (Array.isArray(value) && value.length >= 2) {
    return readLatLng(value[0], value[1]);
  }
  if (value && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return (
      readLatLng(o.lat, o.lng) ??
      readLatLng(o.latitude, o.longitude) ??
      readLatLng(o._latitude, o._longitude)
    );
  }
  return null;
}

function pointsFromArray(values: unknown[]): LiveMapLatLng[] {
  const points: LiveMapLatLng[] = [];
  for (const value of values) {
    const p = pointFromUnknown(value);
    if (p) points.push(p);
  }
  return points;
}

/**
 * Converte `rota_atualizada` em pontos. Aceita polyline codificada (Google),
 * JSON com lista de coordenadas ou objeto com `points`/`polyline`.
 */
export function parseUpdatedRoute(value: unknown): LiveMapLatLng[] {
  if (Array.isArray(value)) return pointsFromArray(value);

  const text = readText(value);
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (Array.isArray(parsed)) return pointsFromArray(parsed);
      if (parsed && typeof parsed === "object") {
        const o = parsed as Record<string, unknown>;
        if (Array.isArray(o.points)) return pointsFromArray(o.points);
        const encoded = readText(o.points) || readText(o.polyline);
        if (encoded) return parseUpdatedRoute(encoded);
      }
    } catch {
      /* não é JSON — tenta como polyline */
    }
  }

  const decoded = decodePolyline(text);
  return decoded.every((p) => readLatLng(p.lat, p.lng)) ? decoded : [];
}

export function mapCorridaToRideTracking(
  docId: string,
  data: RideTrackingDoc,
): RideTracking {
  return {
    docId,
    status: resolveRideStatus(data.estado, data.motorista_chegou),
    inProgress: isInProgressEstado(data.estado),
    driverArrived: isMotoristaChegou(data.motorista_chegou),
    driverAtDestination: isTruthyFlag(data.motorista_no_local_de_destino),
    driver: readText(data.motoristaNome) || "—",
    driverPhone: readText(data.motorista_telefone),
    passenger: readText(data.passageiro_nome) || "—",
    passengerPhone: readText(data.passageiro_telefone),
    originLabel: readText(data.local_inicio) || "—",
    destinationLabel: readText(data.local_fim) || "—",
    origin: readLatLng(data.local_inicio_lat, data.local_inicio_lng),
    destination: readLatLng(data.local_destino_lat, data.local_destino_lng),
    driverLocation:
      readLatLng(data.localizacao_atual_lat, data.localizacao_atual_lng) ??
      readLatLng(data.motorista_lat, data.motorista_lng),
    route: parseUpdatedRoute(data.rota_atualizada),
    etaLabel:
      readText(data.tempoEstimadoCorridaEmProgresso) ||
      readText(data.duracaoText),
    distanceLabel: readText(data.distanciaKmText),
    vehicleModel: readText(data.viaturaMarcaModelo) || "—",
    vehiclePlate: readText(data.viaturaMatricula) || "—",
    vehicleColor: readText(data.viatura_cor) || "—",
    startedAtMs: parseRideDateToMs(data.hora_minuto_inicio),
  };
}

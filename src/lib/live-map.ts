import { refToDocId } from "@/lib/firestore-ref";
import { isInProgressEstado, isMotoristaChegou } from "@/lib/ride-history";

/** Centro aproximado de Luanda para o mapa inicial. */
export const LUANDA_CENTER = { lat: -8.8383, lng: 13.2344 };
export const DEFAULT_MAP_ZOOM = 12;

export type LiveMapDriver = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type LiveMapLatLng = { lat: number; lng: number };

export type LiveMapActiveRide = {
  id: string;
  driver: string;
  passenger: string;
  route: string;
  eta: string;
  origin: LiveMapLatLng;
  destination: LiveMapLatLng | null;
};

export type LiveMapSummary = {
  activeRides: number;
  driversOnline: number;
};

export type LiveMapData = {
  driversOnline: LiveMapDriver[];
  activeRides: LiveMapActiveRide[];
  summary: LiveMapSummary;
};

export const EMPTY_LIVE_MAP: LiveMapData = {
  driversOnline: [],
  activeRides: [],
  summary: { activeRides: 0, driversOnline: 0 },
};

export function parseCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function isValidLatLng(lat: number, lng: number): boolean {
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  if (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6) return false;
  return true;
}

export function readLatLng(
  latValue: unknown,
  lngValue: unknown,
): { lat: number; lng: number } | null {
  const lat = parseCoord(latValue);
  const lng = parseCoord(lngValue);
  if (lat == null || lng == null) return null;
  if (!isValidLatLng(lat, lng)) return null;
  return { lat, lng };
}

export function isOnlineFlag(value: unknown): boolean {
  if (value === true) return true;
  if (value === false) return false;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "true" || v === "sim" || v === "yes";
  }
  return false;
}

export type LiveMapUserDoc = {
  display_name?: string;
  isDriver?: boolean;
  online?: boolean;
  estado?: number;
  motorista_aprovado?: boolean;
  localizacao_atual_lat?: number;
  localizacao_atual_lng?: number;
};

export type LiveMapCorridaDoc = {
  estado?: number;
  motorista_chegou?: boolean | string | number;
  motorista_id?: unknown;
  motoristaNome?: string;
  passageiro_nome?: string;
  local_inicio?: string;
  local_fim?: string;
  duracaoText?: string;
  local_inicio_lat?: number;
  local_inicio_lng?: number;
  local_destino_lat?: number;
  local_destino_lng?: number;
  localizacao_atual_lat?: number;
  localizacao_atual_lng?: number;
};

export function mapUserToLiveDriver(
  id: string,
  data: LiveMapUserDoc,
): LiveMapDriver | null {
  if (data.isDriver !== true) return null;
  if (Number(data.estado) !== 1) return null;
  // Na base de dados, os motoristas aprovados não trazem o campo definido como
  // `true` — apenas os reprovados têm `motorista_aprovado === false`. Por isso
  // só excluímos quando a reprovação é explícita.
  if (data.motorista_aprovado === false) return null;
  if (!isOnlineFlag(data.online)) return null;

  const coords = readLatLng(
    data.localizacao_atual_lat,
    data.localizacao_atual_lng,
  );
  if (!coords) return null;

  const name = data.display_name?.trim() || "Motorista";
  return { id, name, lat: coords.lat, lng: coords.lng };
}

export function mapCorridaToLiveRide(
  id: string,
  data: LiveMapCorridaDoc,
): LiveMapActiveRide | null {
  // "Em andamento" segue a mesma lógica do dashboard: estado em curso (0/3)
  // e o motorista já ter chegado ao ponto de recolha.
  if (!isInProgressEstado(data.estado)) return null;
  if (!isMotoristaChegou(data.motorista_chegou)) return null;

  const origin = readLatLng(data.local_inicio_lat, data.local_inicio_lng);
  if (!origin) return null;

  const destination = readLatLng(data.local_destino_lat, data.local_destino_lng);

  const originLabel = data.local_inicio?.trim() || "—";
  const destinationLabel = data.local_fim?.trim() || "—";
  const eta = data.duracaoText?.trim() || "—";

  return {
    id,
    driver: data.motoristaNome?.trim() || "—",
    passenger: data.passageiro_nome?.trim() || "—",
    route: `${originLabel} → ${destinationLabel}`,
    eta,
    origin,
    destination,
  };
}

export function buildLiveMapData(
  users: Array<{ id: string; data: LiveMapUserDoc }>,
  rides: Array<{ id: string; data: LiveMapCorridaDoc }>,
): LiveMapData {
  const activeRides: LiveMapActiveRide[] = [];
  const busyDriverIds = new Set<string>();

  for (const ride of rides) {
    const mapped = mapCorridaToLiveRide(ride.id, ride.data);
    if (!mapped) continue;
    activeRides.push(mapped);
    const motoristaId = refToDocId(ride.data.motorista_id);
    if (motoristaId) busyDriverIds.add(motoristaId);
  }

  const driversOnline: LiveMapDriver[] = [];
  for (const user of users) {
    if (busyDriverIds.has(user.id)) continue;
    const mapped = mapUserToLiveDriver(user.id, user.data);
    if (mapped) driversOnline.push(mapped);
  }

  driversOnline.sort((a, b) => a.name.localeCompare(b.name, "pt"));
  activeRides.sort((a, b) => a.driver.localeCompare(b.driver, "pt"));

  return {
    driversOnline,
    activeRides,
    summary: {
      activeRides: activeRides.length,
      driversOnline: driversOnline.length,
    },
  };
}

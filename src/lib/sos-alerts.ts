import { refToDocId } from "@/lib/firestore-ref";
import { toDate } from "@/lib/users-shared";

export type SosDoc = {
  nivel?: number;
  userRef?: unknown;
  corridaID?: unknown;
  dataHora?: unknown;
  latitude?: unknown;
  longitude?: unknown;
};

export type SosUserDoc = {
  display_name?: string;
  phone_number?: string;
  phoneNumber?: string;
};

export type SosCorridaDoc = {
  local_inicio?: string;
  local_fim?: string;
  motoristaNome?: string;
  passageiro_nome?: string;
  motorista_id?: unknown;
  passageiro_id?: unknown;
};

export type SosAlertRow = {
  id: string;
  code: string;
  severityLabel: string;
  titleLine: string;
  rideRef: string;
  origin: string;
  destination: string;
  phone: string;
  timeAgoLabel: string;
  trackingStatusLabel: string;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
};

/** Resumo leve para o watcher global do header. */
export type SosWatchItem = {
  id: string;
  code: string;
  severityLabel: string;
  titleLine: string;
  timeAgoLabel: string;
  dataHoraIso: string | null;
  latitude: number | null;
  longitude: number | null;
  mapsUrl: string | null;
};

export function parseCoord(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.trim().replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function googleMapsUrl(
  latitude: number | null,
  longitude: number | null,
): string | null {
  if (latitude == null || longitude == null) return null;
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "agora";

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;

  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
}

export function nivelToSeverityLabel(nivel: unknown): string {
  const n = typeof nivel === "number" ? nivel : Number(nivel);
  if (!Number.isFinite(n)) return "Alerta";
  if (n >= 3) return "Crítico";
  if (n === 2) return "Alto";
  return "Moderado";
}

export function nivelToCode(nivel: unknown): string {
  const n = typeof nivel === "number" ? nivel : Number(nivel);
  const level = Number.isFinite(n) ? Math.max(1, Math.round(n)) : 1;
  return `SOS-${String(level).padStart(2, "0")}`;
}

function readPhone(data: SosUserDoc | undefined): string {
  if (!data) return "";
  return (
    data.phoneNumber?.trim() ||
    data.phone_number?.trim() ||
    ""
  );
}

function callerNameFromCorrida(
  callerUserId: string | null,
  corrida: SosCorridaDoc | undefined,
): string {
  if (!callerUserId || !corrida) return "";

  const motoristaId = refToDocId(corrida.motorista_id);
  const passageiroId = refToDocId(corrida.passageiro_id);

  if (callerUserId === motoristaId) {
    return corrida.motoristaNome?.trim() || "";
  }
  if (callerUserId === passageiroId) {
    return corrida.passageiro_nome?.trim() || "";
  }
  return "";
}

export function mapSosToAlertRow(
  docId: string,
  data: SosDoc,
  user: SosUserDoc | undefined,
  corrida: SosCorridaDoc | undefined,
  callerUserId?: string | null,
): SosAlertRow {
  const userId = callerUserId ?? refToDocId(data.userRef);
  const callerName =
    user?.display_name?.trim() || callerNameFromCorrida(userId, corrida);

  /** Nome de quem acionou o SOS (userRef), não ambos os participantes da corrida. */
  const titleLine = callerName || "—";

  const corridaDocId = refToDocId(data.corridaID);
  const rideRef = corridaDocId ? `Corrida ${corridaDocId.slice(0, 8)}…` : "—";

  const eventDate = toDate(data.dataHora);
  const timeAgoLabel = eventDate ? formatTimeAgo(eventDate) : "—";
  const latitude = parseCoord(data.latitude);
  const longitude = parseCoord(data.longitude);

  return {
    id: docId,
    code: nivelToCode(data.nivel),
    severityLabel: nivelToSeverityLabel(data.nivel),
    titleLine,
    rideRef,
    origin: corrida?.local_inicio?.trim() || "—",
    destination: corrida?.local_fim?.trim() || "—",
    phone: readPhone(user),
    timeAgoLabel,
    trackingStatusLabel: "Em rastreio ao vivo",
    latitude,
    longitude,
    mapsUrl: googleMapsUrl(latitude, longitude),
  };
}

export function mapSosToWatchItem(
  docId: string,
  data: SosDoc,
  user: SosUserDoc | undefined,
): SosWatchItem {
  const eventDate = toDate(data.dataHora);
  const latitude = parseCoord(data.latitude);
  const longitude = parseCoord(data.longitude);
  const titleLine = user?.display_name?.trim() || "Alerta SOS";

  return {
    id: docId,
    code: nivelToCode(data.nivel),
    severityLabel: nivelToSeverityLabel(data.nivel),
    titleLine,
    timeAgoLabel: eventDate ? formatTimeAgo(eventDate) : "—",
    dataHoraIso: eventDate ? eventDate.toISOString() : null,
    latitude,
    longitude,
    mapsUrl: googleMapsUrl(latitude, longitude),
  };
}

import { refToDocId } from "@/lib/firestore-ref";
import { toDate } from "@/lib/users-shared";

export type SosDoc = {
  nivel?: number;
  userRef?: unknown;
  corridaID?: unknown;
  dataHora?: unknown;
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
};

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

export function mapSosToAlertRow(
  docId: string,
  data: SosDoc,
  user: SosUserDoc | undefined,
  corrida: SosCorridaDoc | undefined,
): SosAlertRow {
  const userName = user?.display_name?.trim() || "—";
  const motorista = corrida?.motoristaNome?.trim();
  const passageiro = corrida?.passageiro_nome?.trim();

  const titleLine =
    motorista && passageiro
      ? `${motorista} · ${passageiro}`
      : motorista || passageiro || userName;

  const corridaDocId = refToDocId(data.corridaID);
  const rideRef = corridaDocId ? `Corrida ${corridaDocId.slice(0, 8)}…` : "—";

  const eventDate = toDate(data.dataHora);
  const timeAgoLabel = eventDate ? formatTimeAgo(eventDate) : "—";

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
  };
}

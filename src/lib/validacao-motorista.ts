import { refToDocId } from "@/lib/firestore-ref";
import { formatRideDate } from "@/lib/ride-history";
import { toDate } from "@/lib/users-shared";
import type { UserDoc, VeiculoProvisorioDoc } from "@/lib/drivers";

export const VALIDATION_STATUS_LABELS: Record<number, string> = {
  0: "Pendente",
  1: "Aprovado",
  2: "Rejeitado",
  3: "Em revisão",
  4: "Reenvio solicitado",
};

export const VALIDATION_STATUS_OPTIONS = [
  { value: 0, label: "Pendente" },
  { value: 1, label: "Aprovado" },
  { value: 2, label: "Rejeitado" },
  { value: 3, label: "Em revisão" },
  { value: 4, label: "Reenvio solicitado" },
] as const;

export type ValidacaoMotoristaDoc = {
  data_hora?: unknown;
  motorista_id?: unknown;
  status?: number;
  aprovado_por?: unknown;
};

export type ValidacaoMotoristaRow = {
  id: string;
  requestCode: string;
  requestAtLabel: string;
  requestAt: Date | null;
  driverId: string;
  driverName: string;
  driverHint: string;
  category: string;
  status: string;
  statusCode: number;
  slaQueueLabel: string;
  isNewRegistration: boolean;
};

export type ValidacaoMotoristaSummary = {
  slaMedioLabel: string;
  aprovacoesHoje: number;
  atrasados48h: number;
};

export type DriverSelectOption = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type ValidationDocumentId =
  | "cnh"
  | "seguro"
  | "clrv"
  | "criminal"
  | "selfie";

export type ValidationDocumentTab = {
  id: ValidationDocumentId;
  label: string;
  icon: "license" | "insurance" | "vehicle" | "criminal" | "selfie";
};

export type ValidacaoMotoristaDetail = {
  id: string;
  row: ValidacaoMotoristaRow;
  driverUserDocId: string;
  driverDisplayName: string;
  bi: string;
  phone: string;
  email: string;
  iban: string;
  city: string;
  vehicleDocId: string | null;
  marca: string;
  modelo: string;
  matricula: string;
  ano: string;
  /** @deprecated Use marca + modelo */
  plate: string;
  /** @deprecated Use marca + modelo */
  vehicleMakeModel: string;
  documentTabs: ValidationDocumentTab[];
  documents: Record<
    ValidationDocumentId,
    { title: string; subtitle: string; fileRef: string }
  >;
};

const DOCUMENT_TABS: ValidationDocumentTab[] = [
  { id: "cnh", label: "CNH", icon: "license" },
  { id: "seguro", label: "SEGURO", icon: "insurance" },
  { id: "clrv", label: "CLRV(Veículo)", icon: "vehicle" },
  { id: "criminal", label: "Antecedentes Criminais", icon: "criminal" },
  { id: "selfie", label: "Selfie + CNH", icon: "selfie" },
];

export function mapStatusToLabel(status: unknown): string {
  const n = typeof status === "number" ? status : Number(status);
  return VALIDATION_STATUS_LABELS[n] ?? "Pendente";
}

export function normalizeStatusCode(status: unknown): number {
  const n = typeof status === "number" ? status : Number(status);
  return Number.isFinite(n) && n >= 0 && n <= 4 ? n : 0;
}

export function requestCodeFromId(id: string): string {
  const suffix = id.replace(/\W/g, "").slice(-4).toUpperCase() || id.slice(0, 4).toUpperCase();
  return `VM-${suffix}`;
}

export function requestAtToMs(value: unknown): number | null {
  const date = toDate(value);
  return date ? date.getTime() : null;
}

export function formatSlaQueueLabel(requestAt: unknown): string {
  const ms = requestAtToMs(requestAt);
  if (ms == null) return "—";
  const elapsed = Math.max(0, Date.now() - ms);
  const hours = Math.floor(elapsed / (3600 * 1000));
  if (hours < 48) return `${String(hours).padStart(2, "0")}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/** Após JSON.parse, `requestAt` chega como string ISO — normaliza para Date. */
export function normalizeValidacaoRow(
  row: ValidacaoMotoristaRow & { requestAt?: unknown },
): ValidacaoMotoristaRow {
  const requestAt = toDate(row.requestAt);
  return {
    ...row,
    requestAt,
    slaQueueLabel: formatSlaQueueLabel(requestAt),
  };
}

export function normalizeValidacaoRows(
  rows: Array<ValidacaoMotoristaRow & { requestAt?: unknown }>,
): ValidacaoMotoristaRow[] {
  return rows.map(normalizeValidacaoRow);
}

function formatRequestAtLabel(value: unknown): string {
  const label = formatRideDate(value);
  if (!label) return "—";
  const [datePart, timePart] = label.split(" ");
  if (!datePart) return label;
  const [day, month, year] = datePart.split("/");
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  const monthIdx = Number(month) - 1;
  const monthLabel = months[monthIdx] ?? month ?? "";
  const shortYear = year?.slice(-2) ?? "";
  const time = timePart ?? "";
  return `${day} ${monthLabel} ${shortYear}${time ? ` · ${time}` : ""}`.trim();
}

function vehicleCategoryLabel(vehicle?: VeiculoProvisorioDoc): string {
  if (!vehicle) return "—";
  const model =
    [vehicle.marca?.trim(), vehicle.modelo?.trim()].filter(Boolean).join(" ") || "—";
  return model;
}

function documentMeta(
  row: ValidacaoMotoristaRow,
  kind: ValidationDocumentId,
): { title: string; subtitle: string; fileRef: string } {
  const code = row.requestCode.replace("VM-", "");
  const titles: Record<ValidationDocumentId, string> = {
    cnh: "Carteira Nacional de Habilitação",
    seguro: "Seguro",
    clrv: "Certificado de Registro e Licenciamento de Veículo (Veículo)",
    criminal: "Antecedentes Criminais",
    selfie: "Selfie + CNH",
  };
  const suffix: Record<ValidationDocumentId, string> = {
    cnh: "CNH_FRONTAL",
    seguro: "SEGURO",
    clrv: "CRLV",
    criminal: "CRIMINAL",
    selfie: "SELFIE",
  };
  return {
    title: titles[kind],
    subtitle: `Documento de ${row.driverName}`,
    fileRef: `DOC-${row.requestCode}-${suffix[kind]}`,
  };
}

export function mapValidacaoMotoristaRow(
  id: string,
  data: ValidacaoMotoristaDoc,
  usersById: Map<string, UserDoc>,
  vehiclesByUserId: Map<string, VeiculoProvisorioDoc>,
): ValidacaoMotoristaRow {
  const driverId = refToDocId(data.motorista_id) ?? "";
  const user = usersById.get(driverId);
  const vehicle = vehiclesByUserId.get(driverId);
  const driverName = user?.display_name?.trim() || "—";
  const requestAt = toDate(data.data_hora);
  const statusCode = normalizeStatusCode(data.status);
  const vehicleLabel = vehicle
    ? [vehicle.marca?.trim(), vehicle.modelo?.trim()].filter(Boolean).join(" ") || "—"
    : "—";

  return {
    id,
    requestCode: requestCodeFromId(id),
    requestAtLabel: formatRequestAtLabel(data.data_hora),
    requestAt,
    driverId,
    driverName,
    driverHint: vehicleLabel !== "—" ? vehicleLabel : driverName,
    category: vehicleCategoryLabel(vehicle),
    status: mapStatusToLabel(data.status),
    statusCode,
    slaQueueLabel: formatSlaQueueLabel(requestAt),
    isNewRegistration: statusCode === 0,
  };
}

export function sortValidacaoRows(rows: ValidacaoMotoristaRow[]): ValidacaoMotoristaRow[] {
  return [...rows].sort((a, b) => {
    const ta = requestAtToMs(a.requestAt) ?? 0;
    const tb = requestAtToMs(b.requestAt) ?? 0;
    return tb - ta;
  });
}

export function computeValidacaoSummary(
  rows: ValidacaoMotoristaRow[],
): ValidacaoMotoristaSummary {
  const now = Date.now();
  const fortyEightHoursMs = 48 * 3600 * 1000;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const queueRows = rows.filter(
    (r) => r.statusCode === 0 || r.statusCode === 3,
  );

  let slaTotalMs = 0;
  let slaCount = 0;
  for (const row of queueRows) {
    const ms = requestAtToMs(row.requestAt);
    if (ms == null) continue;
    slaTotalMs += now - ms;
    slaCount += 1;
  }

  const avgMs = slaCount > 0 ? slaTotalMs / slaCount : 0;
  const avgHours = Math.floor(avgMs / (3600 * 1000));
  const avgMinutes = Math.floor((avgMs % (3600 * 1000)) / (60 * 1000));
  const slaMedioLabel =
    slaCount > 0 ? `${avgHours}h ${String(avgMinutes).padStart(2, "0")}m` : "—";

  const aprovacoesHoje = rows.filter((r) => {
    const ms = requestAtToMs(r.requestAt);
    return (
      r.statusCode === 1 && ms != null && ms >= todayStart.getTime()
    );
  }).length;

  const atrasados48h = queueRows.filter((r) => {
    const ms = requestAtToMs(r.requestAt);
    if (ms == null) return false;
    return now - ms > fortyEightHoursMs;
  }).length;

  return { slaMedioLabel, aprovacoesHoje, atrasados48h };
}

export function validationMatchesSearch(row: ValidacaoMotoristaRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.driverName.toLowerCase().includes(q) ||
    row.driverHint.toLowerCase().includes(q) ||
    row.requestCode.toLowerCase().includes(q) ||
    row.id.toLowerCase().includes(q) ||
    row.status.toLowerCase().includes(q) ||
    row.category.toLowerCase().includes(q)
  );
}

export function buildValidacaoDetail(
  row: ValidacaoMotoristaRow,
  user?: UserDoc,
  vehicle?: VeiculoProvisorioDoc,
  vehicleDocId?: string | null,
): ValidacaoMotoristaDetail {
  const driverDisplayName = user?.display_name?.trim() || row.driverName;
  const marca = vehicle?.marca?.trim() || "";
  const modelo = vehicle?.modelo?.trim() || "";
  const matricula = vehicle?.matricula?.trim() || "";
  const ano =
    vehicle?.ano != null && Number.isFinite(Number(vehicle.ano))
      ? String(vehicle.ano)
      : "";
  const plate = matricula || "—";
  const vehicleMakeModel = [marca, modelo].filter(Boolean).join(" ") || "—";

  const documents = Object.fromEntries(
    DOCUMENT_TABS.map((tab) => [tab.id, documentMeta(row, tab.id)]),
  ) as ValidacaoMotoristaDetail["documents"];

  return {
    id: row.id,
    row,
    driverUserDocId: row.driverId,
    driverDisplayName,
    documentTabs: DOCUMENT_TABS,
    documents,
    bi: "—",
    phone: user?.phone_number?.trim() || "—",
    email: user?.email?.trim() || "—",
    iban: user?.IBAN?.trim() || "—",
    city: "Luanda",
    vehicleDocId: vehicleDocId ?? null,
    marca,
    modelo,
    matricula,
    ano,
    plate,
    vehicleMakeModel,
  };
}

export function mapDriverSelectOption(
  id: string,
  data: UserDoc,
): DriverSelectOption {
  return {
    id,
    name: data.display_name?.trim() || "—",
    email: data.email?.trim() || "—",
    phone: data.phone_number?.trim() || "—",
  };
}

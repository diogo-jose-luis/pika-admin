import { refToDocId } from "@/lib/firestore-ref";
import { formatRideDate } from "@/lib/ride-history";
import { toDate } from "@/lib/users-shared";
import { resolveFirestoreImageUrl } from "@/lib/validacao-motorista";

export const ALTERAR_DADOS_COLLECTION = "alterarDados";

export const ALTERAR_DADOS_STATUS = {
  pending: 0,
  approved: 1,
  rejected: 2,
} as const;

export const ALTERAR_DADOS_STATUS_LABELS: Record<number, string> = {
  0: "Pendente",
  1: "Aprovado",
  2: "Rejeitado",
};

export const ALTERAR_DADOS_STATUS_OPTIONS = [
  { value: 0, label: "Pendente" },
  { value: 1, label: "Aprovado" },
  { value: 2, label: "Rejeitado" },
] as const;

export type AlterarDadosStatusFilter = "all" | 0 | 1 | 2;

/** Documento Firestore `alterarDados`. */
export type AlterarDadosDoc = {
  uid?: unknown;
  nome?: string;
  telefone?: string;
  iban?: string;
  carta_conducao?: string;
  seguro?: string;
  licenca_veiculo?: string;
  estado?: number;
  created_time?: unknown;
  nome_empresa?: string;
  sobre?: string;
  bilhete?: string;
  livrete?: string;
  bilhete_numero?: string;
  mostrar_transito_mapa?: boolean;
  mostrar_minha_localizacao?: boolean;
};

export type AlterarDadosImageField = {
  key: string;
  label: string;
  url: string | null;
};

export type AlterarDadosRow = {
  id: string;
  uid: string;
  nome: string;
  telefone: string;
  iban: string;
  nomeEmpresa: string;
  bilheteNumero: string;
  statusCode: number;
  status: string;
  createdAtLabel: string;
  createdAtMs: number;
  userFound: boolean;
  userDocId: string | null;
  currentName: string;
};

export type AlterarDadosDetail = AlterarDadosRow & {
  sobre: string;
  mostrarTransitoMapa: boolean | null;
  mostrarMinhaLocalizacao: boolean | null;
  images: AlterarDadosImageField[];
  current: {
    displayName: string;
    phone: string;
    iban: string;
    nomeEmpresa: string;
    sobre: string;
    bilheteNumero: string;
  } | null;
};

export type AlterarDadosSummary = {
  pendentes: number;
  aprovadas: number;
  rejeitadas: number;
};

export type UserProfileSnippet = {
  display_name?: string;
  phone_number?: string;
  IBAN?: string;
  nome_empresa?: string;
  sobre?: string;
  bilhete_numero?: string;
  uid?: string;
};

export function normalizeEstado(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 1 || n === 2) return n;
  return 0;
}

export function mapEstadoToLabel(estado: unknown): string {
  return ALTERAR_DADOS_STATUS_LABELS[normalizeEstado(estado)] ?? "Pendente";
}

export function readAlterarDadosUid(value: unknown): string {
  if (typeof value === "string" && value.trim()) {
    return refToDocId(value.trim()) ?? value.trim();
  }
  return refToDocId(value) ?? "";
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function setIfString(
  payload: Record<string, unknown>,
  source: unknown,
  destKey: string,
) {
  if (typeof source === "string" && source.trim()) {
    payload[destKey] = source.trim();
  }
}

function setIfBool(
  payload: Record<string, unknown>,
  source: unknown,
  destKey: string,
) {
  if (typeof source === "boolean") {
    payload[destKey] = source;
  }
}

/**
 * Campos a copiar para `users` quando a solicitação é aprovada.
 * Só inclui valores preenchidos, para não apagar dados atuais com strings vazias.
 */
export function userUpdateFromAlterarDados(
  doc: AlterarDadosDoc,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  setIfString(payload, doc.nome, "display_name");
  setIfString(payload, doc.telefone, "phone_number");
  setIfString(payload, doc.iban, "IBAN");
  setIfString(payload, doc.carta_conducao, "carta_conducao");
  setIfString(payload, doc.seguro, "seguro");
  setIfString(payload, doc.licenca_veiculo, "licenca_veiculo");
  setIfString(payload, doc.nome_empresa, "nome_empresa");
  setIfString(payload, doc.sobre, "sobre");
  setIfString(payload, doc.bilhete, "bilhete");
  setIfString(payload, doc.livrete, "livrete");
  setIfString(payload, doc.bilhete_numero, "bilhete_numero");
  setIfBool(payload, doc.mostrar_transito_mapa, "mostrar_transito_mapa");
  setIfBool(payload, doc.mostrar_minha_localizacao, "mostrar_minha_localizacao");
  return payload;
}

export function mapAlterarDadosRow(
  id: string,
  data: AlterarDadosDoc,
  usersByUid: Map<string, { id: string; data: UserProfileSnippet }>,
): AlterarDadosRow {
  const uid = readAlterarDadosUid(data.uid);
  const user = uid ? usersByUid.get(uid) : undefined;
  const nome = readString(data.nome) || user?.data.display_name?.trim() || "—";
  const createdAt = toDate(data.created_time);

  return {
    id,
    uid,
    nome,
    telefone: readString(data.telefone) || user?.data.phone_number?.trim() || "—",
    iban: readString(data.iban) || user?.data.IBAN?.trim() || "—",
    nomeEmpresa: readString(data.nome_empresa) || user?.data.nome_empresa?.trim() || "—",
    bilheteNumero:
      readString(data.bilhete_numero) || user?.data.bilhete_numero?.trim() || "—",
    statusCode: normalizeEstado(data.estado),
    status: mapEstadoToLabel(data.estado),
    createdAtLabel: formatRideDate(data.created_time) || "—",
    createdAtMs: createdAt?.getTime() ?? 0,
    userFound: Boolean(user),
    userDocId: user?.id ?? null,
    currentName: user?.data.display_name?.trim() || "—",
  };
}

export function mapAlterarDadosDetail(
  id: string,
  data: AlterarDadosDoc,
  usersByUid: Map<string, { id: string; data: UserProfileSnippet }>,
): AlterarDadosDetail {
  const row = mapAlterarDadosRow(id, data, usersByUid);
  const user = row.uid ? usersByUid.get(row.uid) : undefined;

  return {
    ...row,
    sobre: readString(data.sobre),
    mostrarTransitoMapa: readBool(data.mostrar_transito_mapa),
    mostrarMinhaLocalizacao: readBool(data.mostrar_minha_localizacao),
    images: [
      {
        key: "carta_conducao",
        label: "Carta de condução",
        url: resolveFirestoreImageUrl(data.carta_conducao),
      },
      {
        key: "seguro",
        label: "Seguro",
        url: resolveFirestoreImageUrl(data.seguro),
      },
      {
        key: "licenca_veiculo",
        label: "Licença do veículo",
        url: resolveFirestoreImageUrl(data.licenca_veiculo),
      },
      {
        key: "bilhete",
        label: "Bilhete de identidade",
        url: resolveFirestoreImageUrl(data.bilhete),
      },
      {
        key: "livrete",
        label: "Livrete",
        url: resolveFirestoreImageUrl(data.livrete),
      },
    ],
    current: user
      ? {
          displayName: user.data.display_name?.trim() || "—",
          phone: user.data.phone_number?.trim() || "—",
          iban: user.data.IBAN?.trim() || "—",
          nomeEmpresa: user.data.nome_empresa?.trim() || "—",
          sobre: user.data.sobre?.trim() || "—",
          bilheteNumero: user.data.bilhete_numero?.trim() || "—",
        }
      : null,
  };
}

export function sortAlterarDadosRows(rows: AlterarDadosRow[]): AlterarDadosRow[] {
  return [...rows].sort((a, b) => {
    if (a.statusCode !== b.statusCode) return a.statusCode - b.statusCode;
    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });
}

export function computeAlterarDadosSummary(
  rows: AlterarDadosRow[],
): AlterarDadosSummary {
  return {
    pendentes: rows.filter((r) => r.statusCode === 0).length,
    aprovadas: rows.filter((r) => r.statusCode === 1).length,
    rejeitadas: rows.filter((r) => r.statusCode === 2).length,
  };
}

export function alterarDadosMatchesSearch(
  row: AlterarDadosRow,
  search: string,
): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [
    row.nome,
    row.telefone,
    row.iban,
    row.uid,
    row.nomeEmpresa,
    row.bilheteNumero,
    row.id,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

function createdAtMsFromLabel(label: string): number {
  if (!label || label === "—") return 0;
  const match = label.match(
    /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/,
  );
  if (!match) {
    const parsed = Date.parse(label);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const [, dd, mm, yyyy, hh = "0", min = "0"] = match;
  return new Date(
    Number(yyyy),
    Number(mm) - 1,
    Number(dd),
    Number(hh),
    Number(min),
  ).getTime();
}

export function hydrateAlterarDadosRow(row: AlterarDadosRow): AlterarDadosRow {
  return {
    ...row,
    createdAtMs: row.createdAtMs || createdAtMsFromLabel(row.createdAtLabel),
  };
}

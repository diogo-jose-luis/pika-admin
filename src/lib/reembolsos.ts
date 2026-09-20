import {
  mapUserToDriverCard,
  type DriverCard,
  type DriverRideStats,
  type UserDoc,
  type VeiculoProvisorioDoc,
} from "@/lib/drivers";
import { formatKz } from "@/lib/format-kz";
import { refToDocId } from "@/lib/firestore-ref";
import {
  formatRideDate,
  mapCorridaFakeToRideRow,
  parseRideDateToMs,
  type CorridaFakeDoc,
  type RideRow,
} from "@/lib/ride-history";

export const REFUND_TIPO_ENTRADA = 1;
export const REFUND_SALDO_TIPO_CORRIDA = 2;

export type RefundRow = {
  id: string;
  tipo: number;
  montante: number;
  montanteLabel: string;
  metodo: number | null;
  metodoLabel: string;
  referencia: string;
  criadoEmLabel: string;
  criadoEmMs: number | null;
  motoristaId: string;
  motoristaNome: string;
  referenciaPagamento: string;
  descricao: string;
  saldoTipo: number;
  jaRecebido: boolean;
  totalDaCorrida: number;
  totalDaCorridaLabel: string;
  corridaId: string | null;
  ride: RideRow | null;
  driver: DriverCard | null;
};

export type RefundsSummary = {
  total: number;
  reimbursed: number;
  pending: number;
  totalAmount: number;
  reimbursedAmount: number;
  pendingAmount: number;
};

export type MotoristaSaldoMovimentoDoc = {
  tipo?: unknown;
  montante?: unknown;
  metodo?: unknown;
  referencia?: unknown;
  criado_em?: unknown;
  motorista_id?: unknown;
  referencia_pagamento?: unknown;
  descricao?: unknown;
  saldoTipo?: unknown;
  jaRecebido?: unknown;
  totalDaCorrida?: unknown;
  corrida_fake?: unknown;
};

export function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function asBool(value: unknown): boolean {
  return value === true || value === "true" || value === 1 || value === "1";
}

function readText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim();
}

export function emptyDriverStats(): DriverRideStats {
  return {
    completedCount: 0,
    earningsTotal: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
}

export function isRideEarningsEntry(data: MotoristaSaldoMovimentoDoc): boolean {
  return (
    asFiniteNumber(data.tipo) === REFUND_TIPO_ENTRADA &&
    asFiniteNumber(data.saldoTipo) === REFUND_SALDO_TIPO_CORRIDA
  );
}

export function mapMovementToRefundRow(
  id: string,
  data: MotoristaSaldoMovimentoDoc,
  driver: DriverCard | null,
  ride: RideRow | null,
): RefundRow {
  const montante = asFiniteNumber(data.montante) ?? 0;
  const totalDaCorrida = asFiniteNumber(data.totalDaCorrida) ?? 0;
  const metodo = asFiniteNumber(data.metodo);
  const motoristaId = refToDocId(data.motorista_id) ?? "";
  const corridaId = refToDocId(data.corrida_fake);
  const criadoEmMs = parseRideDateToMs(data.criado_em);

  return {
    id,
    tipo: asFiniteNumber(data.tipo) ?? REFUND_TIPO_ENTRADA,
    montante,
    montanteLabel: formatKz(montante),
    metodo,
    metodoLabel: metodo == null ? "—" : String(metodo),
    referencia: readText(data.referencia) || "—",
    criadoEmLabel: formatRideDate(data.criado_em) || "—",
    criadoEmMs,
    motoristaId,
    motoristaNome: driver?.name || "—",
    referenciaPagamento: readText(data.referencia_pagamento) || "—",
    descricao: readText(data.descricao) || "—",
    saldoTipo: asFiniteNumber(data.saldoTipo) ?? REFUND_SALDO_TIPO_CORRIDA,
    jaRecebido: asBool(data.jaRecebido),
    totalDaCorrida,
    totalDaCorridaLabel: formatKz(totalDaCorrida),
    corridaId,
    ride,
    driver,
  };
}

export function computeRefundsSummary(rows: RefundRow[]): RefundsSummary {
  let reimbursed = 0;
  let pending = 0;
  let reimbursedAmount = 0;
  let pendingAmount = 0;

  for (const row of rows) {
    if (row.jaRecebido) {
      reimbursed += 1;
      reimbursedAmount += row.montante;
    } else {
      pending += 1;
      pendingAmount += row.montante;
    }
  }

  return {
    total: rows.length,
    reimbursed,
    pending,
    totalAmount: reimbursedAmount + pendingAmount,
    reimbursedAmount,
    pendingAmount,
  };
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

function matchesAmountRange(
  amount: number,
  minRaw: string,
  maxRaw: string,
): boolean {
  const min = minRaw.trim() ? Number(minRaw.replace(",", ".")) : null;
  const max = maxRaw.trim() ? Number(maxRaw.replace(",", ".")) : null;
  if (min != null && Number.isFinite(min) && amount < min) return false;
  if (max != null && Number.isFinite(max) && amount > max) return false;
  return true;
}

function includesText(haystack: string, query: string): boolean {
  if (!query.trim()) return true;
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export type RefundColumnFilters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  driverId: string;
  metodo: string;
  jaRecebido: "all" | "yes" | "no";
  referencia: string;
  referenciaPagamento: string;
  descricao: string;
  montanteMin: string;
  montanteMax: string;
  totalCorridaMin: string;
  totalCorridaMax: string;
};

export function refundMatchesFilters(
  row: RefundRow,
  filters: RefundColumnFilters,
): boolean {
  if (filters.jaRecebido === "yes" && !row.jaRecebido) return false;
  if (filters.jaRecebido === "no" && row.jaRecebido) return false;

  if (filters.driverId && row.motoristaId !== filters.driverId) return false;
  if (filters.metodo && String(row.metodo ?? "") !== filters.metodo) return false;

  if (filters.dateFrom.trim() || filters.dateTo.trim()) {
    if (row.criadoEmMs == null) return false;
    if (filters.dateFrom.trim()) {
      const fromStart = startOfDayFromIso(filters.dateFrom.trim());
      if (fromStart == null || row.criadoEmMs < fromStart) return false;
    }
    if (filters.dateTo.trim()) {
      const toEnd = endOfDayFromIso(filters.dateTo.trim());
      if (toEnd == null || row.criadoEmMs > toEnd) return false;
    }
  }

  if (!includesText(row.referencia, filters.referencia)) return false;
  if (!includesText(row.referenciaPagamento, filters.referenciaPagamento)) {
    return false;
  }
  if (!includesText(row.descricao, filters.descricao)) return false;

  if (!matchesAmountRange(row.montante, filters.montanteMin, filters.montanteMax)) {
    return false;
  }
  if (
    !matchesAmountRange(
      row.totalDaCorrida,
      filters.totalCorridaMin,
      filters.totalCorridaMax,
    )
  ) {
    return false;
  }

  const q = filters.search.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    row.motoristaNome,
    row.motoristaId,
    row.montanteLabel,
    String(row.montante),
    row.totalDaCorridaLabel,
    String(row.totalDaCorrida),
    row.metodoLabel,
    row.referencia,
    row.referenciaPagamento,
    row.descricao,
    row.criadoEmLabel,
    row.jaRecebido ? "reembolsado sim true" : "nao reembolsado não pendente false",
    row.ride?.passenger ?? "",
    row.ride?.origin ?? "",
    row.ride?.destination ?? "",
    row.driver?.email ?? "",
    row.driver?.phone ?? "",
  ]
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
}

export function uniqueRefundDrivers(
  rows: RefundRow[],
): Array<{ id: string; name: string }> {
  const seen = new Map<string, string>();
  for (const row of rows) {
    if (!row.motoristaId) continue;
    if (!seen.has(row.motoristaId)) {
      seen.set(row.motoristaId, row.motoristaNome);
    }
  }
  return [...seen.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));
}

export function uniqueRefundMethods(rows: RefundRow[]): number[] {
  const set = new Set<number>();
  for (const row of rows) {
    if (row.metodo != null) set.add(row.metodo);
  }
  return [...set].sort((a, b) => a - b);
}

export function mapUserAndRideStats(args: {
  userId: string;
  user: UserDoc | undefined;
  vehicle: VeiculoProvisorioDoc | undefined;
  stats: DriverRideStats;
}): DriverCard | null {
  if (!args.user) return null;
  return mapUserToDriverCard(args.userId, args.user, args.vehicle, args.stats);
}

export function mapRideDoc(
  rideId: string,
  data: CorridaFakeDoc | undefined,
  ordinal: number,
): RideRow | null {
  if (!data) return null;
  return mapCorridaFakeToRideRow(rideId, data, ordinal);
}

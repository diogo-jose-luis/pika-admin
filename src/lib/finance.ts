import { formatKz } from "@/lib/format-kz";
import { parseDashboardDate, isSameCalendarDay } from "@/lib/dashboard";
import type { CorridaFakeDoc } from "@/lib/ride-history";
import { formatRideDate } from "@/lib/ride-history";
import { toDate } from "@/lib/users-shared";

export type FinanceCategorySlice = {
  name: string;
  value: number;
  color: string;
};

export type FinanceMonthlyBar = {
  month: string;
  receita: number;
  comissao: number;
};

export type FinanceTransaction = {
  id: string;
  positive: boolean;
  label: string;
  /** Passageiro e motorista (quando disponível). */
  subtitle: string;
  when: string;
  amount: string;
  dateKey: string;
  sortTime: number;
};

export type FinanceData = {
  dailyRevenue: number;
  weeklyRevenue: number;
  platformCommission: number;
  pendingPayments: number;
  monthlyRevenue: FinanceMonthlyBar[];
  categoryData: FinanceCategorySlice[];
  recentTransactions: FinanceTransaction[];
};

const CATEGORY_COLORS: Record<string, string> = {
  "Corridas Regulares": "#00ced1",
  "Corridas Premium": "#22c55e",
  Entregas: "#f97316",
  Outros: "#334155",
};

const MONTH_LABELS = [
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

function precoNumber(preco: unknown): number {
  return typeof preco === "number" ? preco : Number(preco) || 0;
}

function comissaoNumber(comissao: unknown): number {
  return typeof comissao === "number" ? comissao : Number(comissao) || 0;
}

function estadoNumber(estado: unknown): number {
  return typeof estado === "number" ? estado : Number(estado);
}

function categorizeRide(data: CorridaFakeDoc & Record<string, unknown>): string {
  const nome = String(data.categoria_nome ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (nome.includes("premium") || nome.includes("executiv")) {
    return "Corridas Premium";
  }
  if (nome.includes("entrega") || nome.includes("delivery")) {
    return "Entregas";
  }
  if (
    nome.includes("regular") ||
    nome.includes("econom") ||
    nome.includes("standard") ||
    nome.includes("basico")
  ) {
    return "Corridas Regulares";
  }

  const tipo =
    typeof data.categoria_tipo === "number"
      ? data.categoria_tipo
      : Number(data.categoria_tipo);

  if (tipo === 2) return "Corridas Premium";
  if (tipo === 3) return "Entregas";
  if (tipo === 1) return "Corridas Regulares";

  if (nome.trim()) return "Outros";
  return "Corridas Regulares";
}

function isoFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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

export function defaultTransactionDateRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return {
    from: isoFromDate(from),
    to: isoFromDate(now),
  };
}

export function parseTransactionDateIso(value: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function rideToTransactions(
  rideId: string,
  data: CorridaFakeDoc & Record<string, unknown>,
  rideDate: Date,
): FinanceTransaction[] {
  const preco = precoNumber(data.preco);
  const comissao = comissaoNumber(data.comissao);
  const category = categorizeRide(data);
  const categoryLabel =
    String(data.categoria_nome ?? category).trim() || category;
  const passenger = data.passageiro_nome?.trim() || "—";
  const driver = data.motoristaNome?.trim() || "—";
  const sortTime = rideDate.getTime();
  const dateKey = isoFromDate(rideDate);
  const when = formatRideDate(rideDate);
  const subtitle = `${passenger} • ${driver}`;

  const rows: FinanceTransaction[] = [
    {
      id: rideId,
      positive: true,
      label: `Corrida concluída — ${categoryLabel}`,
      subtitle,
      when,
      amount: formatKz(preco),
      dateKey,
      sortTime,
    },
  ];

  if (comissao > 0) {
    rows.push({
      id: `${rideId}-comissao`,
      positive: false,
      label: `Comissão — ${categoryLabel}`,
      subtitle,
      when,
      amount: formatKz(comissao),
      dateKey,
      sortTime: sortTime + 1,
    });
  }

  return rows;
}

/** Transações de corridas concluídas (estado = 1) num intervalo de datas. */
export function buildFinanceTransactions(
  rides: Array<{ id: string; data: CorridaFakeDoc & Record<string, unknown> }>,
  fromIso: string,
  toIso: string,
): FinanceTransaction[] {
  const fromStart = startOfDayFromIso(fromIso);
  const toEnd = endOfDayFromIso(toIso);
  if (fromStart == null || toEnd == null) return [];

  const transactions: FinanceTransaction[] = [];

  for (const ride of rides) {
    const data = ride.data;
    if (estadoNumber(data.estado) !== 1) continue;

    const rideDate = toDate(data.data);
    if (!rideDate) continue;

    const ms = rideDate.getTime();
    if (ms < fromStart || ms > toEnd) continue;

    transactions.push(...rideToTransactions(ride.id, data, rideDate));
  }

  transactions.sort((a, b) => b.sortTime - a.sortTime);
  return transactions;
}

export function buildFinanceData(
  rides: Array<{ id: string; data: CorridaFakeDoc & Record<string, unknown> }>,
  referenceDate: Date,
): FinanceData {
  const dayEnd = new Date(referenceDate);
  dayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(referenceDate);
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  let dailyRevenue = 0;
  let weeklyRevenue = 0;
  let dailyCommission = 0;

  const categoryTotals = new Map<string, number>([
    ["Corridas Regulares", 0],
    ["Corridas Premium", 0],
    ["Entregas", 0],
    ["Outros", 0],
  ]);

  const monthlyMap = new Map<string, number>();
  const monthlyCommissionMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, 0);
    monthlyCommissionMap.set(key, 0);
  }

  const transactions: FinanceTransaction[] = [];

  for (const ride of rides) {
    const data = ride.data;
    if (estadoNumber(data.estado) !== 1) continue;

    const rideDate = toDate(data.data);
    if (!rideDate) continue;

    const preco = precoNumber(data.preco);
    const comissao = comissaoNumber(data.comissao);
    const category = categorizeRide(data);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + preco);

    if (isSameCalendarDay(rideDate, referenceDate)) {
      dailyRevenue += preco;
      dailyCommission += comissao;
    }

    if (rideDate >= weekStart && rideDate <= dayEnd) {
      weeklyRevenue += preco;
    }

    const monthKey = `${rideDate.getFullYear()}-${rideDate.getMonth()}`;
    if (monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + preco);
      monthlyCommissionMap.set(
        monthKey,
        (monthlyCommissionMap.get(monthKey) ?? 0) + comissao,
      );
    }

    transactions.push(...rideToTransactions(ride.id, data, rideDate));
  }

  const categoryTotalSum = [...categoryTotals.values()].reduce((a, b) => a + b, 0);
  const categoryData: FinanceCategorySlice[] = [
    "Corridas Regulares",
    "Corridas Premium",
    "Entregas",
    "Outros",
  ].map((name) => {
    const amount = categoryTotals.get(name) ?? 0;
    const pct =
      categoryTotalSum > 0 ? Math.round((amount / categoryTotalSum) * 100) : 0;
    return {
      name,
      value: pct,
      color: CATEGORY_COLORS[name]!,
    };
  });

  const monthlyRevenue: FinanceMonthlyBar[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const receita = monthlyMap.get(key) ?? 0;
    const comissaoMes = monthlyCommissionMap.get(key) ?? 0;
    monthlyRevenue.push({
      month: MONTH_LABELS[d.getMonth()]!,
      receita: Math.round(receita / 1000),
      comissao: Math.round(comissaoMes / 1000),
    });
  }

  transactions.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  return {
    dailyRevenue,
    weeklyRevenue,
    platformCommission: dailyCommission,
    pendingPayments: 0,
    monthlyRevenue,
    categoryData,
    recentTransactions: transactions.slice(0, 8),
  };
}

export { parseDashboardDate };

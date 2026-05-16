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
  when: string;
  amount: string;
  dateKey: string;
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

  const categoryTotals = new Map<string, number>([
    ["Corridas Regulares", 0],
    ["Corridas Premium", 0],
    ["Entregas", 0],
    ["Outros", 0],
  ]);

  const monthlyMap = new Map<string, number>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, 0);
  }

  const transactions: FinanceTransaction[] = [];

  for (const ride of rides) {
    const data = ride.data;
    if (estadoNumber(data.estado) !== 1) continue;

    const rideDate = toDate(data.data);
    if (!rideDate) continue;

    const preco = precoNumber(data.preco);
    const category = categorizeRide(data);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + preco);

    if (isSameCalendarDay(rideDate, referenceDate)) {
      dailyRevenue += preco;
    }

    if (rideDate >= weekStart && rideDate <= dayEnd) {
      weeklyRevenue += preco;
    }

    const monthKey = `${rideDate.getFullYear()}-${rideDate.getMonth()}`;
    if (monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) ?? 0) + preco);
    }

    transactions.push({
      id: ride.id,
      positive: true,
      label: String(data.categoria_nome ?? category).trim() || category,
      when: formatRideDate(rideDate),
      amount: formatKz(preco),
      dateKey: isoFromDate(rideDate),
    });
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
    monthlyRevenue.push({
      month: MONTH_LABELS[d.getMonth()]!,
      receita: Math.round(receita / 1000),
      comissao: 0,
    });
  }

  transactions.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

  return {
    dailyRevenue,
    weeklyRevenue,
    platformCommission: 0,
    pendingPayments: 0,
    monthlyRevenue,
    categoryData,
    recentTransactions: transactions.slice(0, 8),
  };
}

export { parseDashboardDate };

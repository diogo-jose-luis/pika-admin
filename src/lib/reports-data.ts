import { formatKz } from "@/lib/format-kz";
import { getFirestore } from "@/lib/firebase-admin";
import {
  formatRideDate,
  isInProgressEstado,
  mapEstadoToStatus,
  type CorridaFakeDoc,
} from "@/lib/ride-history";
import { periodBounds, periodLabel } from "@/lib/reports-period";
import { toDate } from "@/lib/users-shared";

export type ReportRideRow = {
  id: string;
  dateLabel: string;
  passenger: string;
  driver: string;
  origin: string;
  destination: string;
  price: number;
  commission: number;
  status: string;
  sortTime: number;
};

export type ReportDriverRow = {
  driverId: string;
  name: string;
  completedRides: number;
  cancelledRides: number;
  inProgressRides: number;
  revenue: number;
  commission: number;
  avgRating: number | null;
};

export type ReportDayTrend = {
  day: number;
  label: string;
  rides: number;
  completed: number;
  revenue: number;
};

export type ReportSummary = {
  totalRides: number;
  completed: number;
  cancelled: number;
  inProgress: number;
  totalRevenue: number;
  totalCommission: number;
  avgRideValue: number;
};

export type ReportPeriodData = {
  year: number;
  month: number;
  periodLabel: string;
  rides: ReportRideRow[];
  summary: ReportSummary;
  drivers: ReportDriverRow[];
  dailyTrend: ReportDayTrend[];
  previousMonth: {
    periodLabel: string;
    totalRevenue: number;
    totalRides: number;
    completed: number;
  };
  growth: {
    revenuePct: number | null;
    ridesPct: number | null;
  };
};

function precoNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value) || 0;
}

function estadoNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function rideInPeriod(
  data: CorridaFakeDoc,
  start: Date,
  end: Date,
): boolean {
  const rideDate = toDate(data.data);
  if (!rideDate) return false;
  return rideDate >= start && rideDate <= end;
}

function buildSummaryFromRides(rides: ReportRideRow[]): ReportSummary {
  let completed = 0;
  let cancelled = 0;
  let inProgress = 0;
  let totalRevenue = 0;
  let totalCommission = 0;

  for (const r of rides) {
    if (r.status === "Concluída") {
      completed += 1;
      totalRevenue += r.price;
      totalCommission += r.commission;
    } else if (r.status === "Cancelada") {
      cancelled += 1;
    } else if (r.status === "Em andamento") {
      inProgress += 1;
    }
  }

  const totalRides = rides.length;
  const avgRideValue = completed > 0 ? totalRevenue / completed : 0;

  return {
    totalRides,
    completed,
    cancelled,
    inProgress,
    totalRevenue,
    totalCommission,
    avgRideValue,
  };
}

function aggregateDrivers(rides: ReportRideRow[]): ReportDriverRow[] {
  const map = new Map<string, ReportDriverRow>();

  for (const ride of rides) {
    const key = ride.driver.trim() || "—";
    const row =
      map.get(key) ??
      ({
        driverId: key,
        name: key,
        completedRides: 0,
        cancelledRides: 0,
        inProgressRides: 0,
        revenue: 0,
        commission: 0,
        avgRating: null,
      } satisfies ReportDriverRow);

    if (ride.status === "Concluída") {
      row.completedRides += 1;
      row.revenue += ride.price;
      row.commission += ride.commission;
    } else if (ride.status === "Cancelada") {
      row.cancelledRides += 1;
    } else if (ride.status === "Em andamento") {
      row.inProgressRides += 1;
    }

    map.set(key, row);
  }

  return [...map.values()].sort(
    (a, b) => b.revenue - a.revenue || b.completedRides - a.completedRides,
  );
}

function buildDailyTrend(
  rides: ReportRideRow[],
  year: number,
  month: number,
): ReportDayTrend[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const buckets: ReportDayTrend[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    buckets.push({
      day,
      label: String(day).padStart(2, "0"),
      rides: 0,
      completed: 0,
      revenue: 0,
    });
  }

  for (const ride of rides) {
    const d = new Date(ride.sortTime);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) continue;
    const day = d.getDate();
    const bucket = buckets[day - 1];
    if (!bucket) continue;
    bucket.rides += 1;
    if (ride.status === "Concluída") {
      bucket.completed += 1;
      bucket.revenue += ride.price;
    }
  }

  return buckets;
}

function pctGrowth(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

export async function loadReportPeriodData(
  year: number,
  month: number,
): Promise<ReportPeriodData> {
  const { start, end } = periodBounds(year, month);
  const db = getFirestore();
  const ridesSnap = await db.collection("corrida_fake").get();

  const rides: ReportRideRow[] = [];

  for (const doc of ridesSnap.docs) {
    const data = doc.data() as CorridaFakeDoc;
    if (!rideInPeriod(data, start, end)) continue;

    const rideDate = toDate(data.data);
    const sortTime = rideDate?.getTime() ?? 0;
    const preco = precoNumber(data.preco);
    const comissao = precoNumber(data.comissao);
    const estado = estadoNumber(data.estado);

    rides.push({
      id: doc.id,
      dateLabel: formatRideDate(data.data) || "—",
      passenger: data.passageiro_nome?.trim() || "—",
      driver: data.motoristaNome?.trim() || "—",
      origin: data.local_inicio?.trim() || "—",
      destination: data.local_fim?.trim() || "—",
      price: estado === 1 ? preco : 0,
      commission: comissao,
      status: mapEstadoToStatus(data.estado),
      sortTime,
    });
  }

  rides.sort((a, b) => b.sortTime - a.sortTime);

  const summary = buildSummaryFromRides(rides);
  const driversBase = aggregateDrivers(rides);

  const ratingByDriver = new Map<string, { sum: number; count: number }>();
  for (const doc of ridesSnap.docs) {
    const data = doc.data() as CorridaFakeDoc;
    if (!rideInPeriod(data, start, end)) continue;
    if (estadoNumber(data.estado) !== 1) continue;
    const name = data.motoristaNome?.trim() || "—";
    const estrelas =
      typeof data.estrelas === "number" ? data.estrelas : Number(data.estrelas);
    if (estrelas < 1 || estrelas > 5) continue;
    const agg = ratingByDriver.get(name) ?? { sum: 0, count: 0 };
    agg.sum += estrelas;
    agg.count += 1;
    ratingByDriver.set(name, agg);
  }

  const drivers = driversBase.map((d) => {
    const agg = ratingByDriver.get(d.name);
    if (!agg || agg.count === 0) return d;
    return {
      ...d,
      avgRating: Math.round((agg.sum / agg.count) * 10) / 10,
    };
  });

  const dailyTrend = buildDailyTrend(rides, year, month);

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevBounds = periodBounds(prevYear, prevMonth);

  let prevRevenue = 0;
  let prevRides = 0;
  let prevCompleted = 0;

  for (const doc of ridesSnap.docs) {
    const data = doc.data() as CorridaFakeDoc;
    if (!rideInPeriod(data, prevBounds.start, prevBounds.end)) continue;
    prevRides += 1;
    const estado = estadoNumber(data.estado);
    if (estado === 1) {
      prevCompleted += 1;
      prevRevenue += precoNumber(data.preco);
    } else if (isInProgressEstado(estado)) {
      /* counted in rides only */
    }
  }

  return {
    year,
    month,
    periodLabel: periodLabel(year, month),
    rides,
    summary,
    drivers,
    dailyTrend,
    previousMonth: {
      periodLabel: periodLabel(prevYear, prevMonth),
      totalRevenue: prevRevenue,
      totalRides: prevRides,
      completed: prevCompleted,
    },
    growth: {
      revenuePct: pctGrowth(summary.totalRevenue, prevRevenue),
      ridesPct: pctGrowth(summary.totalRides, prevRides),
    },
  };
}

export function summaryRowsForDisplay(summary: ReportSummary): string[][] {
  return [
    ["Total de corridas", String(summary.totalRides)],
    ["Concluídas", String(summary.completed)],
    ["Canceladas", String(summary.cancelled)],
    ["Em andamento", String(summary.inProgress)],
    ["Receita (concluídas)", formatKz(summary.totalRevenue)],
    ["Comissões", formatKz(summary.totalCommission)],
    ["Ticket médio", formatKz(summary.avgRideValue)],
  ];
}

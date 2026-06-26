import { formatKz } from "@/lib/format-kz";
import { refToDocId } from "@/lib/firestore-ref";
import {
  isInProgressEstado,
  isMotoristaChegou,
  resolveRideStatus,
  type CorridaFakeDoc,
} from "@/lib/ride-history";
import { toDate } from "@/lib/users-shared";

export type DashboardSummary = {
  totalRevenueLabel: string;
  totalRidesToday: number;
  activeDrivers: number;
  activePassengers: number;
};

export type DashboardTodayStats = {
  completed: number;
  cancelled: number;
  inProgress: number;
  inRequest: number;
};

export type DashboardWeekRevenue = {
  day: string;
  kz: number;
};

export type DashboardRidesByHour = {
  t: string;
  concluidas: number;
  canceladas: number;
};

export type DashboardRecentRide = {
  id: string;
  passenger: string;
  driver: string;
  from: string;
  to: string;
  status: "Em andamento" | "Em solicitação" | "Concluída" | "Cancelada" | "Pendente";
  when: string;
  value: string;
};

export type DashboardTopDriver = {
  rank: number;
  initials: string;
  name: string;
  rating: number;
  rides: number;
  earn: string;
};

export type DashboardData = {
  summary: DashboardSummary;
  todayStats: DashboardTodayStats;
  weekRevenue: DashboardWeekRevenue[];
  ridesByHour: DashboardRidesByHour[];
  recentRides: DashboardRecentRide[];
  topDrivers: DashboardTopDriver[];
};

const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const HOUR_BUCKETS = [0, 3, 6, 9, 12, 15, 18, 21];

export function parseDashboardDate(iso?: string | null): Date {
  if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function relativeTimeLabel(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "agora";
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

function initialsFromName(name: string): string {
  const parts = name.replace(/\./g, "").split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "??";
}

function estadoNumber(estado: unknown): number {
  return typeof estado === "number" ? estado : Number(estado);
}

function precoNumber(preco: unknown): number {
  return typeof preco === "number" ? preco : Number(preco) || 0;
}

type UserDoc = {
  estado?: number;
  isDriver?: boolean;
};

type DriverAgg = {
  name: string;
  rides: number;
  earnings: number;
  ratingSum: number;
  ratingCount: number;
};

export function buildDashboardData(
  users: Array<{ id: string; data: UserDoc }>,
  rides: Array<{ id: string; data: CorridaFakeDoc & Record<string, unknown> }>,
  referenceDate: Date,
): DashboardData {
  const activeDrivers = users.filter(
    (u) => u.data.isDriver === true && estadoNumber(u.data.estado) === 1,
  ).length;
  const activePassengers = users.filter(
    (u) => u.data.isDriver !== true && estadoNumber(u.data.estado) === 1,
  ).length;

  const todayStats: DashboardTodayStats = {
    completed: 0,
    cancelled: 0,
    inProgress: 0,
    inRequest: 0,
  };

  let totalRevenueToday = 0;
  let totalRidesToday = 0;

  const dayEnd = new Date(referenceDate);
  dayEnd.setHours(23, 59, 59, 999);

  const weekStart = new Date(referenceDate);
  weekStart.setDate(weekStart.getDate() - 6);

  const weekRevenueMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    weekRevenueMap.set(key, 0);
  }

  const hourBuckets = HOUR_BUCKETS.map((h) => ({
    t: `${String(h).padStart(2, "0")}h`,
    concluidas: 0,
    canceladas: 0,
  }));

  const driverAgg = new Map<string, DriverAgg>();
  const recentCandidates: Array<{
    id: string;
    passenger: string;
    driver: string;
    from: string;
    to: string;
    status: DashboardRecentRide["status"];
    when: string;
    value: string;
    sortTime: number;
  }> = [];

  for (const ride of rides) {
    const data = ride.data;
    const rideDate = toDate(data.data);
    const estado = estadoNumber(data.estado);
    const preco = precoNumber(data.preco);
    const status = resolveRideStatus(estado, data.motorista_chegou);

    if (isInProgressEstado(estado)) {
      if (isMotoristaChegou(data.motorista_chegou)) {
        todayStats.inProgress += 1;
      } else {
        todayStats.inRequest += 1;
      }
    }

    if (rideDate && isSameCalendarDay(rideDate, referenceDate)) {
      totalRidesToday += 1;

      if (estado === 1) {
        todayStats.completed += 1;
        totalRevenueToday += preco;
      } else if (estado === 2) {
        todayStats.cancelled += 1;
      }

      const hour = rideDate.getHours();
      const bucketIdx = HOUR_BUCKETS.findIndex((h, i) => {
        const next = HOUR_BUCKETS[i + 1] ?? 24;
        return hour >= h && hour < next;
      });
      if (bucketIdx >= 0) {
        if (estado === 1) hourBuckets[bucketIdx]!.concluidas += 1;
        if (estado === 2) hourBuckets[bucketIdx]!.canceladas += 1;
      }
    }

    if (rideDate && rideDate >= weekStart && rideDate <= dayEnd) {
      const key = `${rideDate.getFullYear()}-${rideDate.getMonth()}-${rideDate.getDate()}`;
      if (weekRevenueMap.has(key) && estado === 1) {
        weekRevenueMap.set(key, (weekRevenueMap.get(key) ?? 0) + preco);
      }
    }

    if (rideDate) {
      recentCandidates.push({
        id: ride.id,
        passenger: data.passageiro_nome?.trim() || "—",
        driver: data.motoristaNome?.trim() || "—",
        from: data.local_inicio?.trim() || "—",
        to: data.local_fim?.trim() || "—",
        status,
        when: relativeTimeLabel(rideDate),
        value: formatKz(estado === 1 ? preco : 0),
        sortTime: rideDate.getTime(),
      });
    }

    const motoristaId = refToDocId(data.motorista_id);
    if (motoristaId && estado === 1) {
      const name = data.motoristaNome?.trim() || "Motorista";
      const agg = driverAgg.get(motoristaId) ?? {
        name,
        rides: 0,
        earnings: 0,
        ratingSum: 0,
        ratingCount: 0,
      };
      agg.rides += 1;
      agg.earnings += preco;
      const estrelas =
        typeof data.estrelas === "number" ? data.estrelas : Number(data.estrelas);
      if (estrelas >= 1 && estrelas <= 5) {
        agg.ratingSum += estrelas;
        agg.ratingCount += 1;
      }
      driverAgg.set(motoristaId, agg);
    }
  }

  const weekRevenue: DashboardWeekRevenue[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    weekRevenue.push({
      day: WEEKDAY_LABELS[d.getDay()]!,
      kz: weekRevenueMap.get(key) ?? 0,
    });
  }

  const recentRides = recentCandidates
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 5)
    .map(({ sortTime: _s, ...row }) => row);

  const topDrivers: DashboardTopDriver[] = [...driverAgg.entries()]
    .map(([, agg]) => ({
      name: agg.name,
      rides: agg.rides,
      earnings: agg.earnings,
      rating:
        agg.ratingCount > 0
          ? Math.round((agg.ratingSum / agg.ratingCount) * 10) / 10
          : 0,
    }))
    .sort((a, b) => b.earnings - a.earnings || b.rides - a.rides)
    .slice(0, 3)
    .map((d, i) => ({
      rank: i + 1,
      initials: initialsFromName(d.name),
      name: d.name,
      rating: d.rating,
      rides: d.rides,
      earn: formatKz(d.earnings),
    }));

  return {
    summary: {
      totalRevenueLabel: formatKz(totalRevenueToday),
      totalRidesToday,
      activeDrivers,
      activePassengers,
    },
    todayStats,
    weekRevenue,
    ridesByHour: hourBuckets,
    recentRides,
    topDrivers,
  };
}

import { formatKz } from "@/lib/format-kz";
import { formatRideDate } from "@/lib/ride-history";
import {
  avatarClassForId,
  initialsFromName,
  mapUserEstadoToLabel,
  toDate,
} from "@/lib/users-shared";

export type PassengerStatus = "Ativo" | "Inativo";

export type PassengerRow = {
  /** ID do documento Firestore (`users/{id}`). */
  userDocId: string;
  serial: number;
  passengerId: string;
  name: string;
  initials: string;
  avatarClass: string;
  email: string;
  phone: string;
  rides: number;
  totalSpentLabel: string;
  rating: string;
  lastRideLabel: string;
  status: PassengerStatus;
  problemCount: number;
};

export type PassengersSummary = {
  total: number;
  novos30d: number;
  avgRating: string;
  problemasAbertos: number;
};

export type PassengerUserDoc = {
  display_name?: string;
  email?: string;
  phone_number?: string;
  uid?: string;
  created_time?: unknown;
  estado?: number;
  isDriver?: boolean;
};

export type PassengerRideStats = {
  completedCount: number;
  spentTotal: number;
  ratingSum: number;
  ratingCount: number;
  lastRideAt: Date | null;
};

export function mapUserToPassengerRow(
  serial: number,
  docId: string,
  data: PassengerUserDoc,
  stats: PassengerRideStats,
): PassengerRow {
  const name = data.display_name?.trim() || "—";
  const passengerId = data.uid?.trim() || docId;
  const rating =
    stats.ratingCount > 0
      ? (stats.ratingSum / stats.ratingCount).toFixed(1)
      : "—";

  return {
    userDocId: docId,
    serial,
    passengerId,
    name,
    initials: initialsFromName(name),
    avatarClass: avatarClassForId(docId),
    email: data.email?.trim() || "—",
    phone: data.phone_number?.trim() || "—",
    rides: stats.completedCount,
    totalSpentLabel: formatKz(stats.spentTotal),
    rating,
    lastRideLabel: stats.lastRideAt
      ? formatRideDate(stats.lastRideAt)
      : "—",
    status: mapUserEstadoToLabel(data.estado),
    problemCount: 0,
  };
}

export function computePassengersSummary(
  passengers: PassengerRow[],
  userCreatedDates: Date[],
): PassengersSummary {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const novos30d = userCreatedDates.filter(
    (d) => now - d.getTime() <= thirtyDaysMs,
  ).length;

  const ratings = passengers
    .map((p) => Number.parseFloat(p.rating))
    .filter((n) => Number.isFinite(n));
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : "—";

  return {
    total: passengers.length,
    novos30d,
    avgRating,
    problemasAbertos: 0,
  };
}

export function passengerMatchesSearch(
  row: PassengerRow,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const digits = q.replace(/\D/g, "");
  const haystack = [
    row.name,
    row.passengerId,
    row.email,
    row.phone,
    String(row.rides),
    row.totalSpentLabel,
    row.rating,
    row.lastRideLabel,
    row.status,
    String(row.serial),
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(q)) return true;
  if (digits.length > 0 && row.phone.replace(/\D/g, "").includes(digits)) {
    return true;
  }
  return false;
}

export { toDate };

import { formatKz } from "@/lib/format-kz";
import {
  avatarClassForId,
  formatUserDate,
  initialsFromName,
  mapUserEstadoToLabel,
} from "@/lib/users-shared";

export type DriverStatus = "Ativo" | "Inativo";

export type DriverVerificationDoc = {
  label: string;
  ok: boolean;
};

export type DriverCard = {
  /** ID do documento Firestore (`users/{id}`). */
  userDocId: string;
  id: string;
  name: string;
  initials: string;
  verified: boolean;
  status: DriverStatus;
  email: string;
  phone: string;
  vehicle: string;
  rating: string;
  rides: number;
  earningsKz: string;
  avatarClass: string;
  iban: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleColor: string;
  verificationDocs: DriverVerificationDoc[];
  totalRides: number;
  totalEarningsKz: string;
  registeredAt: string;
};

export type DriversSummary = {
  total: number;
  active: number;
  inactive: number;
  avgRating: string;
};

export type UserDoc = {
  display_name?: string;
  email?: string;
  phone_number?: string;
  uid?: string;
  created_time?: unknown;
  estado?: number;
  IBAN?: string;
  isDriver?: boolean;
  motorista_aprovado?: boolean;
  documento_veiculo_aprovado?: boolean;
  documento_motorista_aprovado?: boolean;
};

export type VeiculoProvisorioDoc = {
  marca?: string;
  modelo?: string;
  matricula?: string;
  ano?: number;
  cor?: string;
  cor_texto?: string;
  motorista?: unknown;
};

export type DriverRideStats = {
  completedCount: number;
  earningsTotal: number;
  ratingSum: number;
  ratingCount: number;
};

export function formatEarningsDisplay(amount: number): string {
  return amount.toLocaleString("pt-AO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function buildVehicleLabel(vehicle?: VeiculoProvisorioDoc): string {
  if (!vehicle) return "—";
  const cor = vehicle.cor_texto?.trim() || vehicle.cor?.trim() || "—";
  const marca = vehicle.marca?.trim() || "";
  const modelo = vehicle.modelo?.trim() || "";
  const matricula = vehicle.matricula?.trim() || "—";
  const name = [marca, modelo].filter(Boolean).join(" ") || "—";
  return `${cor}. ${name} - ${matricula}`;
}

function buildVerificationDocs(data: UserDoc): DriverVerificationDoc[] {
  return [
    { label: "Motorista aprovado", ok: Boolean(data.motorista_aprovado) },
    { label: "Documento veículo", ok: Boolean(data.documento_veiculo_aprovado) },
    { label: "Documento motorista", ok: Boolean(data.documento_motorista_aprovado) },
  ];
}

export function mapUserToDriverCard(
  docId: string,
  data: UserDoc,
  vehicle: VeiculoProvisorioDoc | undefined,
  stats: DriverRideStats,
): DriverCard {
  const name = data.display_name?.trim() || "—";
  const id = data.uid?.trim() || docId;
  const verified = Boolean(
    data.motorista_aprovado &&
      data.documento_veiculo_aprovado &&
      data.documento_motorista_aprovado,
  );
  const rating =
    stats.ratingCount > 0
      ? (stats.ratingSum / stats.ratingCount).toFixed(1)
      : "—";
  const earningsTotal = stats.earningsTotal;
  const vehicleLabel = buildVehicleLabel(vehicle);
  const cor = vehicle?.cor_texto?.trim() || vehicle?.cor?.trim() || "—";
  const model =
    [vehicle?.marca?.trim(), vehicle?.modelo?.trim()].filter(Boolean).join(" ") ||
    "—";
  const plate = vehicle?.matricula?.trim() || "—";

  return {
    userDocId: docId,
    id,
    name,
    initials: initialsFromName(name),
    verified,
    status: mapUserEstadoToLabel(data.estado),
    email: data.email?.trim() || "—",
    phone: data.phone_number?.trim() || "—",
    vehicle: vehicleLabel,
    rating,
    rides: stats.completedCount,
    earningsKz: formatEarningsDisplay(earningsTotal),
    avatarClass: avatarClassForId(docId),
    iban: data.IBAN?.trim() || "—",
    vehicleModel: model,
    vehiclePlate: plate,
    vehicleColor: cor,
    verificationDocs: buildVerificationDocs(data),
    totalRides: stats.completedCount,
    totalEarningsKz: formatEarningsDisplay(earningsTotal),
    registeredAt: formatUserDate(data.created_time),
  };
}

export function computeDriversSummary(drivers: DriverCard[]): DriversSummary {
  const active = drivers.filter((d) => d.status === "Ativo").length;
  const ratings = drivers
    .map((d) => Number.parseFloat(d.rating))
    .filter((n) => Number.isFinite(n));
  const avgRating =
    ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
      : "—";

  return {
    total: drivers.length,
    active,
    inactive: drivers.length - active,
    avgRating,
  };
}

export function driverMatchesSearch(driver: DriverCard, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const digits = q.replace(/\D/g, "");
  const haystack = [
    driver.name,
    driver.id,
    driver.email,
    driver.phone,
    driver.vehicle,
    driver.vehicleModel,
    driver.vehiclePlate,
    driver.vehicleColor,
    driver.rating,
    String(driver.rides),
    driver.earningsKz,
    driver.status,
    driver.iban,
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(q)) return true;
  if (digits.length > 0 && driver.phone.replace(/\D/g, "").includes(digits)) {
    return true;
  }
  return false;
}

import { formatRideDate } from "@/lib/ride-history";

const AVATAR_CLASSES = [
  "bg-amber-300 text-pika-ink",
  "bg-sky-600 text-white",
  "bg-emerald-600 text-white",
  "bg-rose-500 text-white",
  "bg-indigo-600 text-white",
  "bg-teal-600 text-white",
  "bg-fuchsia-600 text-white",
  "bg-cyan-700 text-white",
  "bg-zinc-700 text-white",
  "bg-blue-700 text-white",
];

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "??";
}

export function avatarClassForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % 9973;
  }
  return AVATAR_CLASSES[hash % AVATAR_CLASSES.length]!;
}

export function mapUserEstadoToLabel(estado: unknown): "Ativo" | "Inativo" {
  const n = typeof estado === "number" ? estado : Number(estado);
  return n === 1 ? "Ativo" : "Inativo";
}

export function formatUserDate(value: unknown): string {
  const label = formatRideDate(value);
  if (!label) return "—";
  return label.split(" ")[0] ?? label;
}

export function toDate(value: unknown): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "_seconds" in value) {
    return new Date((value as { _seconds: number })._seconds * 1000);
  }
  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

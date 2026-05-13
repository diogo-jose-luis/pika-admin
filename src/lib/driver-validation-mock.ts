export type ValidationStatus = "Em revisão" | "Pendente";

export type DriverServiceCategory = "Pika Padrão" | "SUV" | "VIP";

export type DriverValidationRow = {
  id: string;
  requestCode: string;
  requestAtLabel: string;
  driverName: string;
  driverHint: string;
  category: DriverServiceCategory;
  status: ValidationStatus;
  slaQueueLabel: string;
  /** Usado pelo filtro “Novos cadastros”. */
  isNewRegistration: boolean;
};

const MONTHS_PT = [
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
] as const;

const FIRST_NAMES = [
  "Carlos",
  "Ana",
  "Miguel",
  "Joana",
  "Pedro",
  "Rita",
  "Bruno",
  "Sofia",
  "Tiago",
  "Inês",
  "Hélio",
  "Luísa",
] as const;

const LAST_NAMES = [
  "Pedro",
  "Silva",
  "Santos",
  "Oliveira",
  "Costa",
  "Ferreira",
  "Martins",
  "Almeida",
  "Lopes",
  "Gomes",
  "Ribeiro",
  "Carvalho",
] as const;

const CATEGORIES: DriverServiceCategory[] = ["Pika Padrão", "SUV", "VIP"];
const STATUSES: ValidationStatus[] = ["Em revisão", "Pendente"];
const SLA_SAMPLES = ["06h", "10h", "18h", "22h", "14h", "08h", "16h", "20h"] as const;

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: readonly T[], seed: number): T {
  return arr[seed % arr.length]!;
}

/** Primeiras linhas alinhadas ao mock visual; restantes geradas. */
const LEADING_ROWS: DriverValidationRow[] = [
  {
    id: "1",
    requestCode: "DR-7790",
    requestAtLabel: "06 Mai · 14:25",
    driverName: "Carlos Pedro",
    driverHint: "Carlos Pedro",
    category: "Pika Padrão",
    status: "Em revisão",
    slaQueueLabel: "10h",
    isNewRegistration: true,
  },
  {
    id: "2",
    requestCode: "DR-7791",
    requestAtLabel: "06 Mai · 11:40",
    driverName: "Ana Martins",
    driverHint: "Ana Martins",
    category: "VIP",
    status: "Pendente",
    slaQueueLabel: "18h",
    isNewRegistration: true,
  },
  {
    id: "3",
    requestCode: "DR-7788",
    requestAtLabel: "05 Mai · 16:02",
    driverName: "Miguel Costa",
    driverHint: "Miguel Costa",
    category: "SUV",
    status: "Em revisão",
    slaQueueLabel: "22h",
    isNewRegistration: true,
  },
  {
    id: "4",
    requestCode: "DR-7785",
    requestAtLabel: "05 Mai · 09:18",
    driverName: "Joana Ribeiro",
    driverHint: "Joana Ribeiro",
    category: "Pika Padrão",
    status: "Pendente",
    slaQueueLabel: "06h",
    isNewRegistration: true,
  },
];

function buildSyntheticRows(fromIndex: number, count: number): DriverValidationRow[] {
  const rows: DriverValidationRow[] = [];
  for (let n = 0; n < count; n += 1) {
    const i = fromIndex + n;
    const id = String(i);
    const seed = hashSeed(id);
    const fn = pick(FIRST_NAMES, seed);
    const ln = pick(LAST_NAMES, seed + 3);
    const name = `${fn} ${ln}`;
    const day = 1 + (seed % 28);
    const monthIdx = seed % 12;
    const hour = 8 + (seed % 10);
    const min = (seed * 7) % 60;
    const requestAtLabel = `${String(day).padStart(2, "0")} ${MONTHS_PT[monthIdx]} · ${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    const codeNum = 7700 + ((seed * 13 + i) % 900);
    rows.push({
      id,
      requestCode: `DR-${codeNum}`,
      requestAtLabel,
      driverName: name,
      driverHint: name,
      category: pick(CATEGORIES, seed + i),
      status: pick(STATUSES, seed + 5),
      slaQueueLabel: pick(SLA_SAMPLES, seed + i * 2),
      isNewRegistration: false,
    });
  }
  return rows;
}

export const DRIVER_VALIDATION_ALL: DriverValidationRow[] = [
  ...LEADING_ROWS,
  ...buildSyntheticRows(5, 92),
];

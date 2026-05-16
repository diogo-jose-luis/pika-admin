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

export type ValidationDocumentId =
  | "cnh"
  | "seguro"
  | "clrv"
  | "criminal"
  | "selfie";

export type ValidationDocumentTab = {
  id: ValidationDocumentId;
  label: string;
  icon: "license" | "insurance" | "vehicle" | "criminal" | "selfie";
};

export type DriverValidationDetail = {
  row: DriverValidationRow;
  driverDisplayName: string;
  bi: string;
  phone: string;
  email: string;
  iban: string;
  city: string;
  plate: string;
  vehicleMakeModel: string;
  documentTabs: ValidationDocumentTab[];
  documents: Record<
    ValidationDocumentId,
    { title: string; subtitle: string; fileRef: string }
  >;
};

const DOCUMENT_TABS: ValidationDocumentTab[] = [
  { id: "cnh", label: "CNH", icon: "license" },
  { id: "seguro", label: "SEGURO", icon: "insurance" },
  { id: "clrv", label: "CLRV(Veículo)", icon: "vehicle" },
  { id: "criminal", label: "Antecedentes Criminais", icon: "criminal" },
  { id: "selfie", label: "Selfie + CNH", icon: "selfie" },
];

function documentMeta(
  row: DriverValidationRow,
  kind: ValidationDocumentId,
): { title: string; subtitle: string; fileRef: string } {
  const code = row.requestCode.replace("DR-", "");
  const titles: Record<ValidationDocumentId, string> = {
    cnh: "Carteira Nacional de Habilitação",
    seguro: "Seguro",
    clrv: "Certificado de Registro e Licenciamento de Veículo (Veículo)",
    criminal: "Antecedentes Criminais",
    selfie: "Selfie + CNH",
  };
  const suffix: Record<ValidationDocumentId, string> = {
    cnh: "CNH_FRONTAL",
    seguro: "SEGURO",
    clrv: "CRLV",
    criminal: "CRIMINAL",
    selfie: "SELFIE",
  };
  return {
    title: titles[kind],
    subtitle: `Documento de ${row.driverName}`,
    fileRef: `DOC-DR-${code}-${suffix[kind]}`,
  };
}

/** Dados de revisão alinhados ao protótipo (Ednilson Araújo / DR-7790). */
const PROTOTYPE_DETAIL: Omit<
  DriverValidationDetail,
  "row" | "driverDisplayName" | "documentTabs" | "documents"
> = {
  bi: "00892632878LA042",
  phone: "92344367898",
  email: "vivaolavia@gmail.com",
  iban: "0045678092218",
  city: "Luanda",
  plate: "LDA-24-54-RP",
  vehicleMakeModel: "BMW",
};

export function getDriverValidationDetail(
  id: string,
): DriverValidationDetail | null {
  const row = DRIVER_VALIDATION_ALL.find((r) => r.id === id);
  if (!row) return null;

  const isPrototype = row.requestCode === "DR-7790";
  const driverDisplayName = isPrototype ? "Ednilson Araújo" : row.driverName;

  const documents = Object.fromEntries(
    DOCUMENT_TABS.map((tab) => [tab.id, documentMeta(row, tab.id)]),
  ) as DriverValidationDetail["documents"];

  return {
    row,
    driverDisplayName,
    documentTabs: DOCUMENT_TABS,
    documents,
    bi: isPrototype ? PROTOTYPE_DETAIL.bi : `00${892632878 + Number(id)}LA042`,
    phone: isPrototype
      ? PROTOTYPE_DETAIL.phone
      : `923${String(4400000 + Number(id)).slice(0, 7)}`,
    email: isPrototype
      ? PROTOTYPE_DETAIL.email
      : `${row.driverName.split(" ")[0]?.toLowerCase()}@email.com`,
    iban: isPrototype ? PROTOTYPE_DETAIL.iban : "0045678092218",
    city: "Luanda",
    plate: isPrototype ? PROTOTYPE_DETAIL.plate : `LDA-${String(20 + Number(id)).padStart(2, "0")}-54-RP`,
    vehicleMakeModel: isPrototype
      ? PROTOTYPE_DETAIL.vehicleMakeModel
      : pick(["Toyota Corolla", "Honda Civic", "BMW", "Hyundai i10"], hashSeed(id)),
  };
}

export function getDriverValidationRow(id: string): DriverValidationRow | null {
  return DRIVER_VALIDATION_ALL.find((r) => r.id === id) ?? null;
}

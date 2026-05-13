export type PassengerStatus = "Ativo" | "Inativo";

export type PassengerRow = {
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

export const PASSENGERS_SUMMARY = {
  total: 3279,
  novos30d: 442,
  novosTrend: "+2.1%",
  avgRating: "4.58",
  problemasAbertos: 11,
};

const firstNames = [
  "Maria",
  "João",
  "Ana",
  "Carlos",
  "Helena",
  "Bruno",
  "Teresa",
  "Eduardo",
  "Patrícia",
  "Miguel",
  "Luísa",
  "Filipe",
  "Sónia",
  "Ricardo",
  "Carla",
];

const lastNames = [
  "Silva",
  "Fernandes",
  "Lopes",
  "Mendes",
  "Costa",
  "Agostinho",
  "Manuel",
  "Kiala",
  "Nunes",
  "Tchimbundo",
  "Cardoso",
  "Domingos",
  "Rodrigues",
  "Barros",
  "Pinto",
];

const avatarClasses = [
  "bg-amber-300 text-amber-950",
  "bg-sky-200 text-sky-900",
  "bg-emerald-200 text-emerald-900",
  "bg-rose-200 text-rose-900",
  "bg-violet-200 text-violet-900",
  "bg-orange-200 text-orange-900",
  "bg-teal-200 text-teal-900",
  "bg-indigo-200 text-indigo-900",
];

const lastRidePool = [
  "Hoje, 14:35",
  "Ontem, 20:10",
  "Hoje, 09:22",
  "Ontem, 08:15",
  "02/02/2026, 18:40",
  "01/02/2026, 11:05",
  "31/01/2026, 22:30",
];

function passengerId(serial: number) {
  return serial <= 999
    ? `P${String(serial).padStart(3, "0")}`
    : `P${serial}`;
}

function initialsFrom(name: string) {
  const p = name.split(/\s+/).filter(Boolean);
  if (p.length >= 2) return `${p[0]![0]}${p[1]![0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function formatKz(amount: number) {
  return `Kz ${amount.toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildPassengerRows(total: number): PassengerRow[] {
  const rows: PassengerRow[] = [];

  for (let serial = 1; serial <= total; serial++) {
    if (serial === 1) {
      rows.push({
        serial: 1,
        passengerId: "P001",
        name: "Maria Silva",
        initials: "MS",
        avatarClass: "bg-amber-300 text-amber-950",
        email: "maria.silva@email.com",
        phone: "923445578",
        rides: 156,
        totalSpentLabel: formatKz(160000),
        rating: "4.9",
        lastRideLabel: "Hoje, 14:35",
        status: "Ativo",
        problemCount: 0,
      });
      continue;
    }

    const i = serial - 1;
    const fn = firstNames[i % firstNames.length]!;
    const ln = lastNames[(i * 3) % lastNames.length]!;
    const name = `${fn} ${ln}`;
    const amount = 12000 + (i * 397) % 280000;
    const rides = 3 + (i * 11) % 920;
    const rating = (4 + ((i * 13) % 20) / 20).toFixed(1);
    const status: PassengerStatus = i % 7 === 0 ? "Inativo" : "Ativo";
    const problemCount =
      i % 17 === 0 ? 2 : i % 23 === 0 ? 1 : 0;

    rows.push({
      serial,
      passengerId: passengerId(serial),
      name,
      initials: initialsFrom(name),
      avatarClass: avatarClasses[i % avatarClasses.length]!,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}@email.com`,
      phone: `9${String((i * 7919) % 100000000).padStart(8, "0").slice(0, 8)}`,
      rides,
      totalSpentLabel: formatKz(amount),
      rating,
      lastRideLabel: lastRidePool[i % lastRidePool.length]!,
      status,
      problemCount,
    });
  }

  return rows;
}

export const PASSENGERS_ALL = buildPassengerRows(3000);

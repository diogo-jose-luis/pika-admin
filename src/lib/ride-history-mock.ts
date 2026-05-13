export type RideStatus = "Em andamento" | "Concluída" | "Pendente" | "Cancelada";

export type RideRow = {
  id: number;
  passenger: string;
  driver: string;
  origin: string;
  destination: string;
  valueLabel: string;
  distanceLabel: string;
  durationLabel: string;
  status: RideStatus;
  dateLabel: string;
};

const origins = [
  "Viana, travessa 11",
  "Talatona, condomínio Azul",
  "Mutamba, Rua Comandante Gika",
  "Ilha do Mussulo, embarcadouro",
  "Maianga, Edifício Kinaxixe",
  "Cazenga, mercado 30",
  "Alvalade, Largo da Independência",
  "Kilamba, centralidade bloco C",
];

const destinations = [
  "Kandando Vila de viana",
  "Centro, Marginal",
  "Aeroporto 4 de Fevereiro",
  "Largo da Independência",
  "Universidade Agostinho Neto",
  "Shoprite Talatona",
  "Hospital Josina Machel",
  "Benfica, Rotunda",
];

const passengers = [
  "Maria Silva",
  "João Fernandes",
  "Ana Paula Lopes",
  "Carlos Mendes",
  "Helena Costa",
  "Bruno Agostinho",
  "Teresa Manuel",
  "Eduardo Kiala",
  "Patrícia Nunes",
  "Miguel Tchimbundo",
  "Luísa Cardoso",
  "Filipe Domingos",
];

const drivers = [
  "Carlos Pedro",
  "Miguel António",
  "Paulo Sousa",
  "António Kiala",
  "José Manuel",
  "Francisco Lopes",
  "Daniel Caetano",
  "Rui Barros",
  "Nelson Tati",
  "Victor Kassoma",
  "André Mucongo",
  "Sérgio Pinto",
];

const statuses: RideStatus[] = [
  "Em andamento",
  "Concluída",
  "Pendente",
  "Cancelada",
];

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

function formatKz(amount: number) {
  const s = amount.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `Kz ${s}`;
}

/** 144 linhas (12 páginas × 12): as duas primeiras alinhadas ao screenshot; resto variado. */
export function buildRideHistoryRows(): RideRow[] {
  const rows: RideRow[] = [
    {
      id: 1,
      passenger: "Maria Silva",
      driver: "Carlos Pedro",
      origin: "Viana, travessa 11",
      destination: "Kandando Vila de viana",
      valueLabel: formatKz(6000),
      distanceLabel: "8,5 Km",
      durationLabel: "25 min",
      status: "Em andamento",
      dateLabel: "02/02/2026 14:35",
    },
    {
      id: 2,
      passenger: "João Fernandes",
      driver: "Miguel António",
      origin: "Talatona, condomínio Azul",
      destination: "Centro, Marginal",
      valueLabel: formatKz(12500),
      distanceLabel: "18,2 Km",
      durationLabel: "42 min",
      status: "Concluída",
      dateLabel: "02/02/2026 13:10",
    },
  ];

  for (let id = 3; id <= 144; id++) {
    const i = id - 1;
    const amount = 3500 + (i * 173) % 12000;
    const dist = (4 + (i * 0.37) % 22).toFixed(1).replace(".", ",");
    const dur = 12 + (i * 7) % 55;
    const day = 1 + (i % 28);
    const month = pad2(1 + (i % 12));
    const hour = 7 + (i % 12);
    const min = (i * 13) % 60;

    rows.push({
      id,
      passenger: passengers[i % passengers.length]!,
      driver: drivers[i % drivers.length]!,
      origin: origins[i % origins.length]!,
      destination: destinations[i % destinations.length]!,
      valueLabel: formatKz(amount),
      distanceLabel: `${dist} Km`,
      durationLabel: `${dur} min`,
      status: statuses[i % statuses.length]!,
      dateLabel: `${pad2(day)}/${month}/2026 ${pad2(hour)}:${pad2(min)}`,
    });
  }

  return rows;
}

export const RIDE_HISTORY_ALL = buildRideHistoryRows();

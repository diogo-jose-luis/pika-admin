export type TransactionRow = {
  id: string;
  positive: boolean;
  label: string;
  when: string;
  amount: string;
  /** ISO date YYYY-MM-DD for filtering */
  dateKey: string;
};

export const TRANSACTIONS_ALL: TransactionRow[] = [
  {
    id: "1",
    positive: true,
    label: "Corridas do Dia",
    when: "02/02/2026 23:59",
    amount: "Kz 100.000,00",
    dateKey: "2026-02-02",
  },
  {
    id: "2",
    positive: false,
    label: "Corridas do Dia",
    when: "01/02/2026 00:00",
    amount: "Kz 100.000,00",
    dateKey: "2026-02-01",
  },
  {
    id: "3",
    positive: true,
    label: "Corridas do Dia",
    when: "02/02/2026 23:59",
    amount: "Kz 100.000,00",
    dateKey: "2026-02-02",
  },
  {
    id: "4",
    positive: true,
    label: "Comissão Plataforma",
    when: "02/02/2026 18:30",
    amount: "Kz 12.500,00",
    dateKey: "2026-02-02",
  },
  {
    id: "5",
    positive: false,
    label: "Pagamento Motorista",
    when: "02/02/2026 16:15",
    amount: "Kz 45.000,00",
    dateKey: "2026-02-02",
  },
  {
    id: "6",
    positive: true,
    label: "Corridas Premium",
    when: "02/02/2026 14:00",
    amount: "Kz 78.200,00",
    dateKey: "2026-02-02",
  },
  {
    id: "7",
    positive: true,
    label: "Corridas do Dia",
    when: "01/02/2026 23:59",
    amount: "Kz 95.400,00",
    dateKey: "2026-02-01",
  },
  {
    id: "8",
    positive: false,
    label: "Reembolso Passageiro",
    when: "01/02/2026 11:20",
    amount: "Kz 3.500,00",
    dateKey: "2026-02-01",
  },
  {
    id: "9",
    positive: true,
    label: "Corridas do Dia",
    when: "31/01/2026 23:59",
    amount: "Kz 88.750,00",
    dateKey: "2026-01-31",
  },
  {
    id: "10",
    positive: false,
    label: "Pagamento Motorista",
    when: "31/01/2026 17:45",
    amount: "Kz 52.000,00",
    dateKey: "2026-01-31",
  },
  {
    id: "11",
    positive: true,
    label: "Entregas",
    when: "30/01/2026 20:10",
    amount: "Kz 22.300,00",
    dateKey: "2026-01-30",
  },
  {
    id: "12",
    positive: true,
    label: "Corridas do Dia",
    when: "30/01/2026 23:59",
    amount: "Kz 91.100,00",
    dateKey: "2026-01-30",
  },
  {
    id: "13",
    positive: false,
    label: "Taxa de Serviço",
    when: "29/01/2026 09:00",
    amount: "Kz 1.200,00",
    dateKey: "2026-01-29",
  },
  {
    id: "14",
    positive: true,
    label: "Corridas Premium",
    when: "28/01/2026 22:30",
    amount: "Kz 64.800,00",
    dateKey: "2026-01-28",
  },
  {
    id: "15",
    positive: true,
    label: "Corridas do Dia",
    when: "27/01/2026 23:59",
    amount: "Kz 102.400,00",
    dateKey: "2026-01-27",
  },
];

export const TRANSACTIONS_RECENT = TRANSACTIONS_ALL.slice(0, 3);

export const TRANSACTION_DATE_FILTERS = [
  "Hoje",
  "Ontem",
  "Última semana",
  "Todos",
] as const;

export type TransactionDateFilter = (typeof TRANSACTION_DATE_FILTERS)[number];

/** Mock "today" aligned with sample data */
export const TRANSACTION_TODAY_KEY = "2026-02-02";

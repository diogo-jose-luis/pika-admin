export type SosAlert = {
  id: string;
  /** Ex.: SOS-01 */
  code: string;
  severityLabel: string;
  driverName: string;
  passengerName: string;
  /** Ex.: TR-83272 (mostrado como Corrida TR-…) */
  rideTripRef: string;
  address: string;
  timeAgoLabel: string;
  trackingStatusLabel: string;
};

/** Três cartões iguais ao mock do ecrã. */
export const SOS_ALERTS: SosAlert[] = [
  {
    id: "1",
    code: "SOS-01",
    severityLabel: "Crítico",
    driverName: "Beatriz Sá",
    passengerName: "Sofia Almeida",
    rideTripRef: "TR-83272",
    address: "Av. da Liberdade, 110",
    timeAgoLabel: "há 2 min",
    trackingStatusLabel: "Em rastreio ao vivo",
  },
  {
    id: "2",
    code: "SOS-01",
    severityLabel: "Crítico",
    driverName: "Beatriz Sá",
    passengerName: "Sofia Almeida",
    rideTripRef: "TR-83272",
    address: "Av. da Liberdade, 110",
    timeAgoLabel: "há 2 min",
    trackingStatusLabel: "Em rastreio ao vivo",
  },
  {
    id: "3",
    code: "SOS-01",
    severityLabel: "Crítico",
    driverName: "Beatriz Sá",
    passengerName: "Sofia Almeida",
    rideTripRef: "TR-83272",
    address: "Av. da Liberdade, 110",
    timeAgoLabel: "há 2 min",
    trackingStatusLabel: "Em rastreio ao vivo",
  },
];

export type TempoProcuraMotoristaDoc = {
  tempo_minuto?: number;
};

export type TempoProcuraMotoristaRecord = {
  id: string;
  tempoMinuto: number;
};

export function parseTempoMinuto(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) return null;
  return n;
}

export function mapTempoProcuraMotoristaDoc(
  id: string,
  data: TempoProcuraMotoristaDoc,
): TempoProcuraMotoristaRecord {
  return {
    id,
    tempoMinuto: parseTempoMinuto(data.tempo_minuto) ?? 0,
  };
}

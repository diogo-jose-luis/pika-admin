import { toDate } from "@/lib/users-shared";

export type ComissaoDoc = {
  valor?: number;
  data?: unknown;
};

export type ComissaoRecord = {
  id: string;
  valor: number;
  dataMs: number | null;
};

export function parseComissaoValor(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function mapComissaoDoc(id: string, data: ComissaoDoc): ComissaoRecord {
  return {
    id,
    valor: parseComissaoValor(data.valor) ?? 0,
    dataMs: toDate(data.data)?.getTime() ?? null,
  };
}

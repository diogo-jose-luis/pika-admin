export const DEFINICAO_CHAMADA_COLLECTION = "definicao_chamada";

export type DefinicaoChamadaDoc = {
  chamada_interna?: unknown;
  chamada_operadora_movel?: unknown;
};

export type DefinicaoChamadaRecord = {
  id: string;
  chamadaInterna: boolean;
  chamadaOperadoraMovel: boolean;
};

export function parseBooleanFlag(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return null;
}

export function mapDefinicaoChamadaDoc(
  id: string,
  data: DefinicaoChamadaDoc,
): DefinicaoChamadaRecord {
  return {
    id,
    chamadaInterna: parseBooleanFlag(data.chamada_interna) ?? false,
    chamadaOperadoraMovel: parseBooleanFlag(data.chamada_operadora_movel) ?? false,
  };
}

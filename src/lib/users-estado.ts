export const USER_ESTADO_ATIVO = 1;
export const USER_ESTADO_INATIVO = 0;

export const USER_ESTADO_BULK_OPTIONS = [
  { value: USER_ESTADO_ATIVO, label: "Ativo" },
  { value: USER_ESTADO_INATIVO, label: "Inativo" },
] as const;

export function normalizeUserEstado(estado: unknown): number {
  const n = typeof estado === "number" ? estado : Number(estado);
  return n === USER_ESTADO_ATIVO ? USER_ESTADO_ATIVO : USER_ESTADO_INATIVO;
}

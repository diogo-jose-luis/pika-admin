export const USER_VALIDACAO_AUTORIZADO = 1;
export const USER_VALIDACAO_NAO_AUTORIZADO = 0;

export function normalizeUserValidacao(value: unknown): 0 | 1 {
  if (value === true || value === 1 || value === "1") {
    return USER_VALIDACAO_AUTORIZADO;
  }
  const n = typeof value === "number" ? value : Number(value);
  return n === USER_VALIDACAO_AUTORIZADO
    ? USER_VALIDACAO_AUTORIZADO
    : USER_VALIDACAO_NAO_AUTORIZADO;
}

export function isUserAuthorized(value: unknown): boolean {
  return normalizeUserValidacao(value) === USER_VALIDACAO_AUTORIZADO;
}

export function authorizationStatusLabel(
  authorized: boolean,
): "Autorizado" | "Não autorizado" {
  return authorized ? "Autorizado" : "Não autorizado";
}

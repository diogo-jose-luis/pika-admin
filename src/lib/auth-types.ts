/** Níveis alinhados ao modelo Laravel `User`. */
export const NIVEL_OPERADOR = 1;
export const NIVEL_FINANCEIRO = 2;
export const NIVEL_ADMIN = 3;
export const NIVEL_SUPER_ADMIN = 4;

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  nivel: number;
  genero?: number | null;
  fotografia?: string | null;
  cargo_id?: number | null;
  departamento_id?: number | null;
  cargo?: { id: number; nome: string } | null;
  departamento?: { id: number; nome: string } | null;
  created_at?: string;
  updated_at?: string;
};

export type AuthTokenResponse = {
  token: string;
  user: AuthUser;
};

/** Resposta padrão da API Laravel (`successResponse`). */
export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export function nivelLabel(nivel: number): string {
  switch (nivel) {
    case NIVEL_OPERADOR:
      return "Operador";
    case NIVEL_FINANCEIRO:
      return "Financeiro";
    case NIVEL_ADMIN:
      return "Admin";
    case NIVEL_SUPER_ADMIN:
      return "Super Admin";
    default:
      return "Desconhecido";
  }
}

export function parseAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  if (
    typeof u.id !== "number" ||
    typeof u.name !== "string" ||
    typeof u.email !== "string" ||
    typeof u.nivel !== "number"
  ) {
    return null;
  }
  return raw as AuthUser;
}

export function unwrapApiData<T>(payload: unknown): T | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as ApiEnvelope<T> & T;
  if ("data" in obj && obj.data !== undefined) {
    return obj.data as T;
  }
  return obj as T;
}

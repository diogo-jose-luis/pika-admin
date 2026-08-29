/** Prefixo das rotas Next que fazem proxy para a API Laravel (auth + admins). */
export const API_PROXY_PATH = "/api/api-proxy";

/** Produção (Vercel) — autenticação e gestão de utilizadores admin. */
export const PRODUCTION_API_BASE_URL = "https://api-pika.hope-system.app/api";

/** Desenvolvimento local — `php artisan serve`. */
export const DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:8000/api";

/** URL base da API Laravel (sem barra final). Usada apenas pelo proxy de auth/admin. */
export function resolveApiBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_BASE_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  const isProduction =
    process.env.NODE_ENV === "production" || process.env.VERCEL === "1";

  return isProduction ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL;
}

/** Prefixo das rotas Next que fazem proxy para a API Laravel (auth + admins). */
export const API_PROXY_PATH = "/api/api-proxy";

/** Produção — autenticação e gestão de utilizadores admin. */
export const PRODUCTION_API_BASE_URL = "https://api-pika.hope-system.app/api";

/** Desenvolvimento local — `php artisan serve`. */
export const DEVELOPMENT_API_BASE_URL = "http://127.0.0.1:8000/api";

/** Build estático para cPanel (`npm run build:static`). */
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/** URL base da API Laravel (sem barra final). Usada apenas pelo proxy de auth/admin. */
export function resolveApiBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    process.env.API_BASE_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/+$/, "");
  }

  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL === "1" ||
    IS_STATIC_EXPORT;

  return isProduction ? PRODUCTION_API_BASE_URL : DEVELOPMENT_API_BASE_URL;
}

/** Axios no browser: proxy Next em Vercel; API online no export estático. */
export function resolveBrowserApiBaseUrl(): string {
  if (IS_STATIC_EXPORT) {
    return resolveApiBaseUrl();
  }
  return API_PROXY_PATH;
}

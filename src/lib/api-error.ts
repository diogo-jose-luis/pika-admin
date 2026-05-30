import type { AxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  error?: string;
  upstream_status?: number;
  upstream_url?: string;
  upstream?: unknown;
  errors?: Record<string, string[]>;
};

function stripHtml(text: string): string {
  return text
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstValidationError(errors: Record<string, string[]> | undefined): string | null {
  if (!errors) return null;
  const first = Object.values(errors).flat()[0];
  return first ?? null;
}

/** Extrai mensagem legível de erros axios (proxy ou API Laravel). */
export function extractApiErrorMessage(
  err: unknown,
  fallback = "Ocorreu um erro. Tente novamente.",
): string {
  if (!err || typeof err !== "object" || !("isAxiosError" in err)) {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  }

  const ax = err as AxiosError<ApiErrorBody | string>;
  const status = ax.response?.status;
  const raw = ax.response?.data;

  if (typeof raw === "string" && raw.trim()) {
    const text = stripHtml(raw);
    if (text) return text.slice(0, 400);
  }

  if (raw && typeof raw === "object") {
    const data = raw as ApiErrorBody;
    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return data.error;
    }
    const validation = firstValidationError(data.errors);
    if (validation) return validation;

    if (data.upstream && typeof data.upstream === "object") {
      const up = data.upstream as ApiErrorBody;
      if (typeof up.message === "string" && up.message.trim()) return up.message;
    }
  }

  if (status === 401) {
    return "Credenciais inválidas. Verifique o email e a palavra-passe.";
  }
  if (status === 422) {
    return "Dados inválidos. Verifique os campos introduzidos.";
  }
  if (status === 502) {
    return "Não foi possível contactar a API. O servidor pode estar indisponível.";
  }
  if (status === 500) {
    return "Erro interno na API (500). A resposta não incluiu detalhes — verifique os logs do Laravel (storage/logs/laravel.log).";
  }
  if (status) {
    return `Erro ${status} na API. Tente novamente ou contacte o suporte.`;
  }
  if (ax.code === "ERR_NETWORK") {
    return "Falha de rede ao contactar a API.";
  }

  return fallback;
}

/** Detalhes técnicos opcionais (ex.: URL upstream) para debug no ecrã de login. */
export function extractApiErrorDebug(err: unknown): string | null {
  if (!err || typeof err !== "object" || !("isAxiosError" in err)) return null;
  const ax = err as AxiosError<ApiErrorBody>;
  const data = ax.response?.data;
  if (!data || typeof data !== "object") return null;

  const parts: string[] = [];
  if (typeof data.upstream_url === "string") {
    parts.push(`API: ${data.upstream_url}`);
  }
  if (typeof data.upstream_status === "number") {
    parts.push(`HTTP ${data.upstream_status}`);
  } else if (ax.response?.status) {
    parts.push(`HTTP ${ax.response.status}`);
  }

  return parts.length ? parts.join(" · ") : null;
}

import type { AxiosError } from "axios";

export const UPSTREAM_BOT_CHALLENGE_CODE = "UPSTREAM_BOT_CHALLENGE";

export const UPSTREAM_BOT_CHALLENGE_MESSAGE =
  "A API bloqueou o pedido com uma verificação anti-bot (LiteSpeed/reCAPTCHA). O painel não consegue completar esse desafio. Peça para isentar as rotas /api/* (incluindo /api/appypay/charges) no anti-bot da LiteSpeed.";

type ApiErrorBody = {
  message?: string;
  error?: string;
  code?: string;
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

export function isBotChallengeText(text: string): boolean {
  return /lsrecap|grecaptcha|bot verification|verifying that you are not a robot|recaptcha\.net\/recaptcha/i.test(
    text,
  );
}

export function looksLikeHtmlDocument(
  text: string,
  contentType?: string | null,
): boolean {
  const type = (contentType ?? "").toLowerCase();
  if (type.includes("application/json") || type.includes("+json")) return false;
  if (type.includes("text/html")) return true;
  const start = text.trimStart().slice(0, 64).toLowerCase();
  return start.startsWith("<!doctype html") || start.startsWith("<html");
}

export function sanitizeApiErrorText(text: string): string {
  if (isBotChallengeText(text)) return UPSTREAM_BOT_CHALLENGE_MESSAGE;
  if (looksLikeHtmlDocument(text)) {
    const stripped = stripHtml(text);
    return stripped.slice(0, 400) || "A API devolveu HTML em vez de JSON.";
  }
  return text.trim().slice(0, 2000);
}

function errorBodyText(err: unknown): string {
  if (!err || typeof err !== "object") return "";
  if (err instanceof Error && err.message) {
    if (isBotChallengeText(err.message) || looksLikeHtmlDocument(err.message)) {
      return err.message;
    }
  }

  const ax = err as AxiosError<ApiErrorBody | string>;
  const raw = ax.response?.data;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object") {
    const data = raw as ApiErrorBody;
    const parts = [data.code, data.message, data.error];
    if (data.upstream && typeof data.upstream === "object") {
      const up = data.upstream as ApiErrorBody;
      parts.push(up.message, up.error);
    }
    return parts.filter((part): part is string => typeof part === "string").join(" ");
  }
  return "";
}

export function isBotChallengeError(err: unknown): boolean {
  const text = errorBodyText(err);
  if (text.includes(UPSTREAM_BOT_CHALLENGE_CODE)) return true;
  return isBotChallengeText(text);
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
  if (isBotChallengeError(err)) {
    return UPSTREAM_BOT_CHALLENGE_MESSAGE;
  }

  if (!err || typeof err !== "object" || !("isAxiosError" in err)) {
    if (err instanceof Error && err.message) {
      return sanitizeApiErrorText(err.message) || fallback;
    }
    return fallback;
  }

  const ax = err as AxiosError<ApiErrorBody | string>;
  const status = ax.response?.status;
  const raw = ax.response?.data;

  if (status === 401) {
    return "Credenciais inválidas.";
  }

  if (typeof raw === "string" && raw.trim()) {
    const text = sanitizeApiErrorText(raw);
    if (text) return text.slice(0, 400);
  }

  if (raw && typeof raw === "object") {
    const data = raw as ApiErrorBody;
    if (data.code === UPSTREAM_BOT_CHALLENGE_CODE) {
      return UPSTREAM_BOT_CHALLENGE_MESSAGE;
    }
    if (typeof data.message === "string" && data.message.trim()) {
      return sanitizeApiErrorText(data.message);
    }
    if (typeof data.error === "string" && data.error.trim()) {
      return sanitizeApiErrorText(data.error);
    }
    const validation = firstValidationError(data.errors);
    if (validation) return validation;

    if (data.upstream && typeof data.upstream === "object") {
      const up = data.upstream as ApiErrorBody;
      if (typeof up.message === "string" && up.message.trim()) {
        return sanitizeApiErrorText(up.message);
      }
    }
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

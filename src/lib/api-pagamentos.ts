export const API_PAGAMENTOS_COLLECTION = "api_pagamentos";

export type ApiPagamentoDoc = {
  base_url?: string;
  api_key?: string;
  provedor?: string;
};

export type ApiPagamento = {
  id: string;
  base_url: string;
  api_key: string;
  provedor: string;
};

export type ApiPagamentoInput = {
  base_url: string;
  api_key: string;
  provedor: string;
};

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseApiPagamentoInput(
  body: unknown,
): { data: ApiPagamentoInput } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Pedido inválido." };
  }

  const raw = body as Record<string, unknown>;
  const provedor = asTrimmedString(raw.provedor);
  const base_url = asTrimmedString(raw.base_url);
  const api_key = asTrimmedString(raw.api_key);

  if (!provedor) {
    return { error: "Indique o provedor." };
  }
  if (!base_url) {
    return { error: "Indique o URL base." };
  }
  if (!isValidHttpUrl(base_url)) {
    return { error: "O URL base deve começar por http:// ou https://." };
  }
  if (!api_key) {
    return { error: "Indique a chave da API." };
  }

  return { data: { provedor, base_url, api_key } };
}

export function mapApiPagamentoDoc(id: string, data: ApiPagamentoDoc): ApiPagamento {
  return {
    id,
    provedor: asTrimmedString(data.provedor) || "—",
    base_url: asTrimmedString(data.base_url),
    api_key: asTrimmedString(data.api_key),
  };
}

export function sortApiPagamentos(items: ApiPagamento[]): ApiPagamento[] {
  return [...items].sort((a, b) =>
    a.provedor.localeCompare(b.provedor, "pt", { sensitivity: "base" }),
  );
}

export function maskApiKey(value: string): string {
  const key = value.trim();
  if (!key) return "—";
  if (key.length <= 4) return "••••";
  return `••••••••${key.slice(-4)}`;
}

export function apiPagamentoToInput(item: ApiPagamento): ApiPagamentoInput {
  return {
    provedor: item.provedor === "—" ? "" : item.provedor,
    base_url: item.base_url,
    api_key: item.api_key,
  };
}

export function apiPagamentoMatchesSearch(
  item: ApiPagamento,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [item.provedor, item.base_url].some((value) =>
    value.toLowerCase().includes(q),
  );
}

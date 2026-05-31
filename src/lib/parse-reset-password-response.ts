import { unwrapApiData } from "@/lib/auth-types";

const PASSWORD_KEYS = [
  "password",
  "new_password",
  "nova_senha",
  "palavra_passe",
] as const;

function readPasswordField(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function passwordFromRecord(record: Record<string, unknown>): string | null {
  for (const key of PASSWORD_KEYS) {
    const found = readPasswordField(record[key]);
    if (found) return found;
  }
  return null;
}

/** Extrai a palavra-passe gerada pela API `POST /users/{id}/reset-password`. */
export function parseResetPasswordResponse(payload: unknown): string | null {
  if (readPasswordField(payload)) return readPasswordField(payload);

  const unwrapped = unwrapApiData<unknown>(payload);
  if (readPasswordField(unwrapped)) return readPasswordField(unwrapped);

  if (unwrapped && typeof unwrapped === "object") {
    const fromData = passwordFromRecord(unwrapped as Record<string, unknown>);
    if (fromData) return fromData;
  }

  if (payload && typeof payload === "object") {
    const fromRoot = passwordFromRecord(payload as Record<string, unknown>);
    if (fromRoot) return fromRoot;
  }

  return null;
}

export const SESSION_COOKIE = "pika_session";
export const USER_COOKIE = "pika_user";

export type SessionUser = {
  email: string;
  displayName: string;
};

/** Nome amigável a partir da parte local do email (ex.: diogo.luis → Diogo Luis). */
export function displayNameFromEmail(email: string): string {
  const trimmed = email.trim();
  const local = trimmed.includes("@") ? trimmed.split("@")[0]! : trimmed;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1).toLowerCase())
    .join(" ");
}

export function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.charAt(0) + parts[1]!.charAt(0)).toUpperCase();
  }
  if (parts.length === 1 && parts[0]!.length >= 2) {
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) {
    return (parts[0]!.charAt(0) + "?").toUpperCase();
  }
  return "??";
}

export function serializeSessionUser(email: string): string {
  const e = email.trim();
  const payload: SessionUser = {
    email: e,
    displayName: displayNameFromEmail(e),
  };
  return JSON.stringify(payload);
}

export function parseSessionUserCookie(raw: string | undefined): SessionUser | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as unknown;
    if (
      data &&
      typeof data === "object" &&
      "email" in data &&
      "displayName" in data &&
      typeof (data as SessionUser).email === "string" &&
      typeof (data as SessionUser).displayName === "string"
    ) {
      return {
        email: (data as SessionUser).email,
        displayName: (data as SessionUser).displayName,
      };
    }
  } catch {
    /* inválido */
  }
  return null;
}

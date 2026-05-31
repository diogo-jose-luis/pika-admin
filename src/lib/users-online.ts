export function normalizeUserOnline(online: unknown): boolean {
  if (online === true) return true;
  if (online === false) return false;
  if (online === 1 || online === "1") return true;
  if (online === 0 || online === "0") return false;
  if (typeof online === "string") {
    const v = online.trim().toLowerCase();
    return v === "true" || v === "sim" || v === "yes";
  }
  return false;
}

export function onlineStatusLabel(online: boolean): "Online" | "Offline" {
  return online ? "Online" : "Offline";
}

export const USER_ONLINE_BULK_OPTIONS = [
  { value: true, label: "Online" },
  { value: false, label: "Offline" },
] as const;

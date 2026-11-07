/** Lojas oficiais. A página pública é o destino do link que o passageiro partilha. */
export const PIKA_APPS = {
  passenger: {
    appStore: "https://apps.apple.com/ao/app/pika/id6800449377",
    playStore:
      "https://play.google.com/store/apps/details?id=com.migambi.taxify",
  },
  driver: {
    appStore: "https://apps.apple.com/ao/app/id6805551186",
    playStore: "https://play.google.com/store/apps/details?id=com.pika.ao",
  },
} as const;

export function isPublicRideDocId(id: string): boolean {
  return (
    id.length > 0 &&
    id.length <= 200 &&
    id !== "." &&
    id !== ".." &&
    !id.includes("/") &&
    !id.includes("\\")
  );
}

export function publicRidePath(docId: string): string {
  return `/corrida/ao-vivo/${encodeURIComponent(docId)}`;
}

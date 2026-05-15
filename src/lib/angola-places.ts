/** Centro aproximado de Angola (Luanda) para bias nas pesquisas. */
export const ANGOLA_SEARCH_CENTER = { lat: -8.839, lng: 13.2894 };

/** Raio em metros (~950 km) para cobrir o território angolano. */
export const ANGOLA_SEARCH_RADIUS_M = 950_000;

export const ANGOLA_REGION = "ao";

type PlaceWithGeometry = {
  formatted_address?: string;
  geometry?: { location?: { lat?: number; lng?: number } };
};

/** Limites aproximados do território de Angola. */
export function isCoordinateInAngola(lat: number, lng: number): boolean {
  return lat >= -18.05 && lat <= -4.37 && lng >= 11.67 && lng <= 24.08;
}

export function isPlaceInAngola(place: PlaceWithGeometry): boolean {
  const lat = place.geometry?.location?.lat;
  const lng = place.geometry?.location?.lng;
  if (typeof lat === "number" && typeof lng === "number") {
    if (isCoordinateInAngola(lat, lng)) return true;
    if (!isCoordinateInAngola(lat, lng)) return false;
  }

  const address = (place.formatted_address ?? "").toLowerCase();
  return address.includes("angola");
}

export function angolaBiasedQuery(query: string): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;
  if (/\bangola\b/i.test(trimmed)) return trimmed;
  return `${trimmed}, Angola`;
}

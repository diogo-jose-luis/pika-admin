import { NextResponse } from "next/server";
import {
  ANGOLA_REGION,
  ANGOLA_SEARCH_CENTER,
  ANGOLA_SEARCH_RADIUS_M,
  angolaBiasedQuery,
  isPlaceInAngola,
} from "@/lib/angola-places";

const PLACES_TEXT_SEARCH =
  "https://maps.googleapis.com/maps/api/place/textsearch/json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query")?.trim();
  const key = searchParams.get("key")?.trim();
  const region = ANGOLA_REGION;

  if (!query || !key) {
    return NextResponse.json(
      { error: "Parâmetros query e key são obrigatórios." },
      { status: 400 },
    );
  }

  const url = new URL(PLACES_TEXT_SEARCH);
  url.searchParams.set("query", angolaBiasedQuery(query));
  url.searchParams.set("key", key);
  url.searchParams.set("region", region);
  url.searchParams.set(
    "location",
    `${ANGOLA_SEARCH_CENTER.lat},${ANGOLA_SEARCH_CENTER.lng}`,
  );
  url.searchParams.set("radius", String(ANGOLA_SEARCH_RADIUS_M));

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    const data = await res.json();

    if (data.status === "OK" && Array.isArray(data.results)) {
      const results = data.results.filter((place: unknown) =>
        isPlaceInAngola(place as Parameters<typeof isPlaceInAngola>[0]),
      );
      return NextResponse.json({
        ...data,
        results,
        status: results.length > 0 ? "OK" : "ZERO_RESULTS",
      });
    }

    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível contactar o Google Places." },
      { status: 502 },
    );
  }
}

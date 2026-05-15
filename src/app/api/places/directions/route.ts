import { NextResponse } from "next/server";

const DIRECTIONS_API =
  "https://maps.googleapis.com/maps/api/directions/json";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get("origin")?.trim();
  const destination = searchParams.get("destination")?.trim();
  const key = searchParams.get("key")?.trim();

  if (!origin || !destination || !key) {
    return NextResponse.json(
      { error: "Parâmetros origin, destination e key são obrigatórios." },
      { status: 400 },
    );
  }

  const url = new URL(DIRECTIONS_API);
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("key", key);
  url.searchParams.set("mode", "driving");

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível calcular a rota." },
      { status: 502 },
    );
  }
}

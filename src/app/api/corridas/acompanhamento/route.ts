import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { canAccessPath } from "@/lib/permissions";
import {
  mapCorridaToRideTracking,
  type RideTrackingDoc,
} from "@/lib/ride-tracking";
import { parseSessionUserCookie, USER_COOKIE } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const jar = await cookies();
  const session = parseSessionUserCookie(jar.get(USER_COOKIE)?.value);
  if (!session || !canAccessPath(session.nivel, "/historico-corridas")) {
    return NextResponse.json(
      { error: "Sem permissão para acompanhar corridas." },
      { status: 403 },
    );
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { error: "Indique o id da corrida." },
      { status: 400 },
    );
  }

  try {
    const snap = await getFirestore().collection("corrida_fake").doc(id).get();
    if (!snap.exists) {
      return NextResponse.json(
        { error: "Corrida não encontrada." },
        { status: 404 },
      );
    }

    const tracking = mapCorridaToRideTracking(
      snap.id,
      snap.data() as RideTrackingDoc,
    );
    return NextResponse.json({ tracking });
  } catch (error) {
    console.error("[corridas/acompanhamento GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o acompanhamento da corrida." },
      { status: 500 },
    );
  }
}

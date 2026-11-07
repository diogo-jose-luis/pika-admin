import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { isPublicRideDocId } from "@/lib/public-ride";
import {
  mapCorridaToRideTracking,
  type RideTrackingDoc,
} from "@/lib/ride-tracking";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Acompanhamento público da corrida. O link é o que o passageiro partilha;
 * não exige sessão. O telefone do passageiro não sai nesta resposta.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = rawId.trim();
  if (!isPublicRideDocId(id)) {
    return NextResponse.json(
      { error: "Corrida não encontrada." },
      { status: 404 },
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

    return NextResponse.json(
      { tracking: { ...tracking, passengerPhone: "" } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[publico/corrida GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o acompanhamento da corrida." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  mapCorridaFakeToRideRow,
  type CorridaFakeDoc,
  type RideRow,
} from "@/lib/ride-history";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection("corrida_fake")
      .orderBy("data", "desc")
      .get();

    const rows: RideRow[] = snapshot.docs.map((doc, index) =>
      mapCorridaFakeToRideRow(doc.data() as CorridaFakeDoc, index + 1),
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("[corridas/historico]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o histórico de corridas." },
      { status: 500 },
    );
  }
}

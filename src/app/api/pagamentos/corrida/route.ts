import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  mapCorridaFakeToPaymentRide,
  type CorridaFakeDoc,
} from "@/lib/ride-history";

export const dynamic = "force-dynamic";

function uniqueRefs(values: string[]): string[] {
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    ),
  ].slice(0, 30);
}

async function queryByRefs(refs: Array<string | number>) {
  if (refs.length === 0) return null;
  const db = getFirestore();
  try {
    const snap = await db
      .collection("corrida_fake")
      .where("referencia_pagamento", "in", refs)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0];
  } catch (error) {
    console.warn("[pagamentos/corrida] query in falhou, a tentar igualdade", error);
  }

  for (const ref of refs) {
    const snap = await db
      .collection("corrida_fake")
      .where("referencia_pagamento", "==", ref)
      .limit(1)
      .get();
    if (!snap.empty) return snap.docs[0];
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refs = uniqueRefs(searchParams.getAll("ref"));

    if (refs.length === 0) {
      return NextResponse.json(
        { error: "Indique a referência do pagamento." },
        { status: 400 },
      );
    }

    let doc = await queryByRefs(refs);

    if (!doc) {
      const numeric = refs
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value));
      if (numeric.length > 0) {
        doc = await queryByRefs(numeric);
      }
    }

    if (!doc) {
      return NextResponse.json({ ride: null });
    }

    return NextResponse.json({
      ride: mapCorridaFakeToPaymentRide(
        doc.id,
        doc.data() as CorridaFakeDoc,
      ),
    });
  } catch (error) {
    console.error("[pagamentos/corrida GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a corrida deste pagamento." },
      { status: 500 },
    );
  }
}

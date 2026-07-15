import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  mapTempoProcuraMotoristaDoc,
  parseTempoMinuto,
} from "@/lib/tempo-procura-motorista";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("tempo_procura_motorista").limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ record: null });
    }

    const doc = snapshot.docs[0]!;
    return NextResponse.json({
      record: mapTempoProcuraMotoristaDoc(doc.id, doc.data()),
    });
  } catch (error) {
    console.error("[tempo-procura-motorista GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o tempo de procura de motorista." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      tempoMinuto?: unknown;
      id?: unknown;
    };
    const tempoMinuto = parseTempoMinuto(body.tempoMinuto);

    if (tempoMinuto == null) {
      return NextResponse.json(
        { error: "Indique um tempo de espera válido (número inteiro ≥ 0)." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const existingId =
      typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    let docId = existingId;

    if (docId) {
      const ref = db.collection("tempo_procura_motorista").doc(docId);
      const snap = await ref.get();
      if (!snap.exists) {
        docId = null;
      }
    }

    if (!docId) {
      const latest = await db
        .collection("tempo_procura_motorista")
        .limit(1)
        .get();

      if (!latest.empty) {
        docId = latest.docs[0]!.id;
      }
    }

    const payload = { tempo_minuto: tempoMinuto };

    if (docId) {
      await db.collection("tempo_procura_motorista").doc(docId).update(payload);
      return NextResponse.json({
        record: { id: docId, tempoMinuto },
      });
    }

    const created = await db.collection("tempo_procura_motorista").add(payload);
    return NextResponse.json({
      record: { id: created.id, tempoMinuto },
    });
  } catch (error) {
    console.error("[tempo-procura-motorista PUT]", error);
    return NextResponse.json(
      { error: "Não foi possível guardar o tempo de procura de motorista." },
      { status: 500 },
    );
  }
}

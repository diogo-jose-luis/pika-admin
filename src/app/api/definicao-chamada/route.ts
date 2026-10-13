import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  DEFINICAO_CHAMADA_COLLECTION,
  mapDefinicaoChamadaDoc,
  parseBooleanFlag,
} from "@/lib/definicao-chamada";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection(DEFINICAO_CHAMADA_COLLECTION)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ record: null });
    }

    const doc = snapshot.docs[0]!;
    return NextResponse.json({
      record: mapDefinicaoChamadaDoc(doc.id, doc.data()),
    });
  } catch (error) {
    console.error("[definicao-chamada GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a definição de chamadas." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      chamadaInterna?: unknown;
      chamadaOperadoraMovel?: unknown;
      id?: unknown;
    };

    const chamadaInterna = parseBooleanFlag(body.chamadaInterna);
    const chamadaOperadoraMovel = parseBooleanFlag(body.chamadaOperadoraMovel);

    if (chamadaInterna == null || chamadaOperadoraMovel == null) {
      return NextResponse.json(
        { error: "Indique Sim ou Não para as duas definições de chamada." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const existingId =
      typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    let docId = existingId;

    if (docId) {
      const ref = db.collection(DEFINICAO_CHAMADA_COLLECTION).doc(docId);
      const snap = await ref.get();
      if (!snap.exists) {
        docId = null;
      }
    }

    if (!docId) {
      const latest = await db
        .collection(DEFINICAO_CHAMADA_COLLECTION)
        .limit(1)
        .get();

      if (!latest.empty) {
        docId = latest.docs[0]!.id;
      }
    }

    const payload = {
      chamada_interna: chamadaInterna,
      chamada_operadora_movel: chamadaOperadoraMovel,
    };

    if (docId) {
      await db.collection(DEFINICAO_CHAMADA_COLLECTION).doc(docId).update(payload);
      return NextResponse.json({
        record: mapDefinicaoChamadaDoc(docId, payload),
      });
    }

    const created = await db.collection(DEFINICAO_CHAMADA_COLLECTION).add(payload);
    return NextResponse.json({
      record: mapDefinicaoChamadaDoc(created.id, payload),
    });
  } catch (error) {
    console.error("[definicao-chamada PUT]", error);
    return NextResponse.json(
      { error: "Não foi possível guardar a definição de chamadas." },
      { status: 500 },
    );
  }
}

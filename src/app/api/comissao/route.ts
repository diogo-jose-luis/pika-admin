import { NextResponse } from "next/server";
import admin from "firebase-admin";
import { getFirestore } from "@/lib/firebase-admin";
import { mapComissaoDoc, parseComissaoValor } from "@/lib/comissao";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    let snapshot;

    try {
      snapshot = await db.collection("comissao").orderBy("data", "desc").limit(1).get();
    } catch {
      const all = await db.collection("comissao").get();
      if (all.empty) {
        return NextResponse.json({ record: null });
      }
      const sorted = all.docs
        .map((doc) => mapComissaoDoc(doc.id, doc.data()))
        .sort((a, b) => (b.dataMs ?? 0) - (a.dataMs ?? 0));
      return NextResponse.json({ record: sorted[0] ?? null });
    }

    if (snapshot.empty) {
      return NextResponse.json({ record: null });
    }

    const doc = snapshot.docs[0]!;
    return NextResponse.json({
      record: mapComissaoDoc(doc.id, doc.data()),
    });
  } catch (error) {
    console.error("[comissao GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a comissão padrão." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { valor?: unknown; id?: unknown };
    const valor = parseComissaoValor(body.valor);

    if (valor == null) {
      return NextResponse.json(
        { error: "Indique um valor de comissão válido." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const existingId =
      typeof body.id === "string" && body.id.trim() ? body.id.trim() : null;

    let docId = existingId;

    if (docId) {
      const ref = db.collection("comissao").doc(docId);
      const snap = await ref.get();
      if (!snap.exists) {
        docId = null;
      }
    }

    if (!docId) {
      const latest = await db
        .collection("comissao")
        .orderBy("data", "desc")
        .limit(1)
        .get()
        .catch(() => null);

      if (latest && !latest.empty) {
        docId = latest.docs[0]!.id;
      }
    }

    const payload = {
      valor,
      data: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (docId) {
      await db.collection("comissao").doc(docId).update(payload);
      return NextResponse.json({
        record: { id: docId, valor, dataMs: Date.now() },
      });
    }

    const created = await db.collection("comissao").add(payload);
    return NextResponse.json({
      record: { id: created.id, valor, dataMs: Date.now() },
    });
  } catch (error) {
    console.error("[comissao PUT]", error);
    return NextResponse.json(
      { error: "Não foi possível guardar a comissão padrão." },
      { status: 500 },
    );
  }
}

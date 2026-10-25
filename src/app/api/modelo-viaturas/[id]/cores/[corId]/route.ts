import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import {
  colorsMatch,
  mapViaturaCorImagemDoc,
  parseCorImagemInput,
  type ViaturaCorImagemDoc,
} from "@/lib/viatura-cor-imagem";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string; corId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, corId } = await context.params;
    const parsed = parseCorImagemInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = getFirestore();
    const modelRef = db.collection("modelo_viatura").doc(id);
    const ref = db.collection("viatura_cor_imagem").doc(corId);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Cor não encontrada." }, { status: 404 });
    }

    const current = existing.data() as ViaturaCorImagemDoc;
    if (refToDocId(current.modelo_viatura) !== id) {
      return NextResponse.json({ error: "Cor não encontrada." }, { status: 404 });
    }

    const siblings = await db
      .collection("viatura_cor_imagem")
      .where("modelo_viatura", "==", modelRef)
      .get();

    const duplicate = siblings.docs.find(
      (doc) =>
        doc.id !== corId &&
        colorsMatch(String(doc.data().cor ?? ""), parsed.value.cor),
    );
    if (duplicate) {
      return NextResponse.json(
        { error: "Esta cor já está registada para este modelo." },
        { status: 409 },
      );
    }

    const data = {
      cor: parsed.value.cor,
      imagem: parsed.value.imagem,
      modelo_viatura: modelRef,
    };
    await ref.update(data);

    return NextResponse.json({
      cor: mapViaturaCorImagemDoc(corId, data),
    });
  } catch (error) {
    console.error("[viatura-cor-imagem PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a cor." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id, corId } = await context.params;
    const db = getFirestore();
    const ref = db.collection("viatura_cor_imagem").doc(corId);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json({ error: "Cor não encontrada." }, { status: 404 });
    }

    const current = existing.data() as ViaturaCorImagemDoc;
    if (refToDocId(current.modelo_viatura) !== id) {
      return NextResponse.json({ error: "Cor não encontrada." }, { status: 404 });
    }

    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[viatura-cor-imagem DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar a cor." },
      { status: 500 },
    );
  }
}

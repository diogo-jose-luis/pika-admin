import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  colorsMatch,
  mapViaturaCorImagemDoc,
  parseCorImagemInput,
  sortColorImages,
  type ViaturaCorImagemDoc,
} from "@/lib/viatura-cor-imagem";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function loadModel(
  db: ReturnType<typeof getFirestore>,
  id: string,
) {
  const ref = db.collection("modelo_viatura").doc(id);
  const snap = await ref.get();
  return { ref, exists: snap.exists };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getFirestore();
    const model = await loadModel(db, id);

    if (!model.exists) {
      return NextResponse.json(
        { error: "Modelo de viatura não encontrado." },
        { status: 404 },
      );
    }

    const snap = await db
      .collection("viatura_cor_imagem")
      .where("modelo_viatura", "==", model.ref)
      .get();

    const cores = sortColorImages(
      snap.docs.map((doc) =>
        mapViaturaCorImagemDoc(doc.id, doc.data() as ViaturaCorImagemDoc),
      ),
    );

    return NextResponse.json({ cores });
  } catch (error) {
    console.error("[viatura-cor-imagem GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as cores deste modelo." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsed = parseCorImagemInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = getFirestore();
    const model = await loadModel(db, id);

    if (!model.exists) {
      return NextResponse.json(
        { error: "Modelo de viatura não encontrado." },
        { status: 404 },
      );
    }

    const existing = await db
      .collection("viatura_cor_imagem")
      .where("modelo_viatura", "==", model.ref)
      .get();

    const duplicate = existing.docs.find((doc) =>
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
      modelo_viatura: model.ref,
    };
    const docRef = await db.collection("viatura_cor_imagem").add(data);
    const cor = mapViaturaCorImagemDoc(docRef.id, data);

    return NextResponse.json({ cor }, { status: 201 });
  } catch (error) {
    console.error("[viatura-cor-imagem POST]", error);
    return NextResponse.json(
      { error: "Não foi possível registar a cor." },
      { status: 500 },
    );
  }
}

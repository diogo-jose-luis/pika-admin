import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { mapCategoriaDoc, sortCategorias } from "@/lib/categorias";
import {
  buildCategoriaLookup,
  mapModeloViaturaDoc,
  type ModeloViaturaDoc,
  type ModeloViaturaInput,
} from "@/lib/modelo-viatura";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function docFromInput(
  input: ModeloViaturaInput,
  db: ReturnType<typeof getFirestore>,
): ModeloViaturaDoc {
  return {
    marca: input.marca.trim(),
    modelo: input.modelo.trim(),
    ano: input.ano,
    tipo: input.tipo.trim(),
    imagem: input.imagem.trim(),
    disponivel: input.disponivel,
    categoriadecorrida: input.categoriaId
      ? db.collection("categorias").doc(input.categoriaId)
      : undefined,
  };
}

async function buildLookup(db: ReturnType<typeof getFirestore>) {
  const categoriasSnap = await db.collection("categorias").get();
  const categorias = sortCategorias(
    categoriasSnap.docs.map((doc) => mapCategoriaDoc(doc.id, doc.data())),
  );
  return buildCategoriaLookup(
    categorias.map((c) => ({ id: c.id, nome: c.nome, ordem: c.ordem })),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as ModeloViaturaInput;
    const db = getFirestore();
    const ref = db.collection("modelo_viatura").doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Modelo de viatura não encontrado." },
        { status: 404 },
      );
    }

    if (!body.marca?.trim() || !body.modelo?.trim()) {
      return NextResponse.json(
        { error: "Marca e modelo são obrigatórios." },
        { status: 400 },
      );
    }

    if (!body.categoriaId) {
      return NextResponse.json(
        { error: "Selecione uma categoria de corrida." },
        { status: 400 },
      );
    }

    const data = docFromInput(body, db);
    await ref.update(data);

    const lookup = await buildLookup(db);
    const model = mapModeloViaturaDoc(id, data, lookup);

    return NextResponse.json({ model });
  } catch (error) {
    console.error("[modelo-viaturas PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o modelo de viatura." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getFirestore();
    const ref = db.collection("modelo_viatura").doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Modelo de viatura não encontrado." },
        { status: 404 },
      );
    }

    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[modelo-viaturas DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar o modelo de viatura." },
      { status: 500 },
    );
  }
}

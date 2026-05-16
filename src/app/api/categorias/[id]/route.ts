import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { docFromInput, mapCategoriaDoc, type CategoriaInput } from "@/lib/categorias";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as CategoriaInput;
    const data = docFromInput(body);

    if (!data.nome) {
      return NextResponse.json(
        { error: "O nome da categoria é obrigatório." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const ref = db.collection("categorias").doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Categoria não encontrada." },
        { status: 404 },
      );
    }

    await ref.update(data);
    const updated = mapCategoriaDoc(id, data);

    return NextResponse.json({ categoria: updated });
  } catch (error) {
    console.error("[categorias PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a categoria." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getFirestore();
    const ref = db.collection("categorias").doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Categoria não encontrada." },
        { status: 404 },
      );
    }

    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[categorias DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar a categoria." },
      { status: 500 },
    );
  }
}

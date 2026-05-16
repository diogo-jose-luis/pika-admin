import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  docFromInput,
  mapCategoriaDoc,
  sortCategorias,
  type CategoriaInput,
} from "@/lib/categorias";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("categorias").get();

    const categorias = sortCategorias(
      snapshot.docs.map((doc) => mapCategoriaDoc(doc.id, doc.data())),
    );

    return NextResponse.json({ categorias });
  } catch (error) {
    console.error("[categorias GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as categorias." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CategoriaInput;
    const data = docFromInput(body);

    if (!data.nome) {
      return NextResponse.json(
        { error: "O nome da categoria é obrigatório." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const docRef = await db.collection("categorias").add(data);
    const created = mapCategoriaDoc(docRef.id, data);

    return NextResponse.json({ categoria: created }, { status: 201 });
  } catch (error) {
    console.error("[categorias POST]", error);
    return NextResponse.json(
      { error: "Não foi possível criar a categoria." },
      { status: 500 },
    );
  }
}

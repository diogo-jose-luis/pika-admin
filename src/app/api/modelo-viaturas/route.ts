import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { mapCategoriaDoc, sortCategorias } from "@/lib/categorias";
import {
  buildCategoriaLookup,
  mapModeloViaturaDoc,
  sortVehicleModels,
  type ModeloViaturaDoc,
  type ModeloViaturaInput,
} from "@/lib/modelo-viatura";

export const dynamic = "force-dynamic";

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

export async function GET() {
  try {
    const db = getFirestore();

    const [modelsSnap, categoriasSnap] = await Promise.all([
      db.collection("modelo_viatura").get(),
      db.collection("categorias").get(),
    ]);

    const categorias = sortCategorias(
      categoriasSnap.docs.map((doc) => mapCategoriaDoc(doc.id, doc.data())),
    );
    const lookup = buildCategoriaLookup(
      categorias.map((c) => ({ id: c.id, nome: c.nome, ordem: c.ordem })),
    );

    const models = sortVehicleModels(
      modelsSnap.docs.map((doc) =>
        mapModeloViaturaDoc(doc.id, doc.data() as ModeloViaturaDoc, lookup),
      ),
    );

    return NextResponse.json({
      models,
      categorias: categorias.map((c) => ({
        id: c.id,
        nome: c.nome,
        ordem: c.ordem,
      })),
    });
  } catch (error) {
    console.error("[modelo-viaturas GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os modelos de viaturas." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ModeloViaturaInput;

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

    const db = getFirestore();
    const data = docFromInput(body, db);
    const docRef = await db.collection("modelo_viatura").add(data);

    const catDoc = await db.collection("categorias").doc(body.categoriaId).get();
    const lookup = buildCategoriaLookup(
      catDoc.exists
        ? [
            {
              id: catDoc.id,
              nome: String(catDoc.data()?.nome ?? "—"),
              ordem: Number(catDoc.data()?.ordem) || 1,
            },
          ]
        : [],
    );

    const model = mapModeloViaturaDoc(docRef.id, data, lookup);

    return NextResponse.json({ model }, { status: 201 });
  } catch (error) {
    console.error("[modelo-viaturas POST]", error);
    return NextResponse.json(
      { error: "Não foi possível criar o modelo de viatura." },
      { status: 500 },
    );
  }
}

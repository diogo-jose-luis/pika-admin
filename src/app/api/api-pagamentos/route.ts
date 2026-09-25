import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  API_PAGAMENTOS_COLLECTION,
  mapApiPagamentoDoc,
  parseApiPagamentoInput,
  sortApiPagamentos,
} from "@/lib/api-pagamentos";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(API_PAGAMENTOS_COLLECTION).get();

    const items = sortApiPagamentos(
      snapshot.docs.map((doc) => mapApiPagamentoDoc(doc.id, doc.data())),
    );

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[api-pagamentos GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as APIs de pagamento." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const parsed = parseApiPagamentoInput(await request.json());
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = getFirestore();
    const docRef = await db.collection(API_PAGAMENTOS_COLLECTION).add(parsed.data);
    const created = mapApiPagamentoDoc(docRef.id, parsed.data);

    return NextResponse.json({ item: created }, { status: 201 });
  } catch (error) {
    console.error("[api-pagamentos POST]", error);
    return NextResponse.json(
      { error: "Não foi possível criar a API de pagamento." },
      { status: 500 },
    );
  }
}

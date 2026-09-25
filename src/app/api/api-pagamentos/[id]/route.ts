import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  API_PAGAMENTOS_COLLECTION,
  mapApiPagamentoDoc,
  parseApiPagamentoInput,
} from "@/lib/api-pagamentos";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const parsed = parseApiPagamentoInput(await request.json());
    if ("error" in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const db = getFirestore();
    const ref = db.collection(API_PAGAMENTOS_COLLECTION).doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "API de pagamento não encontrada." },
        { status: 404 },
      );
    }

    await ref.update(parsed.data);
    const updated = mapApiPagamentoDoc(id, parsed.data);

    return NextResponse.json({ item: updated });
  } catch (error) {
    console.error("[api-pagamentos PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a API de pagamento." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getFirestore();
    const ref = db.collection(API_PAGAMENTOS_COLLECTION).doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "API de pagamento não encontrada." },
        { status: 404 },
      );
    }

    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api-pagamentos DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar a API de pagamento." },
      { status: 500 },
    );
  }
}

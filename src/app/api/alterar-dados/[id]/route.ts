import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import {
  ALTERAR_DADOS_COLLECTION,
  mapAlterarDadosDetail,
  normalizeEstado,
  readAlterarDadosUid,
  type AlterarDadosDoc,
} from "@/lib/alterar-dados";
import {
  applyAlterarDadosDecision,
  fetchAlterarDadosDetail,
  resolveUsersByUids,
} from "@/lib/alterar-dados-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const detail = await fetchAlterarDadosDetail(id);
    if (!detail) {
      return NextResponse.json(
        { error: "Solicitação não encontrada." },
        { status: 404 },
      );
    }
    return NextResponse.json({ detail });
  } catch (error) {
    console.error("[alterar-dados GET id]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a solicitação." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { estado?: number };
    const estado = normalizeEstado(body.estado);

    if (estado !== 1 && estado !== 2) {
      return NextResponse.json(
        { error: "Só é possível aprovar (1) ou rejeitar (2)." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const { updatedIds, failures } = await applyAlterarDadosDecision(
      db,
      [id],
      estado,
    );

    if (updatedIds.length === 0) {
      return NextResponse.json(
        {
          error: failures[0]?.error ?? "Não foi possível atualizar a solicitação.",
          failures,
        },
        { status: failures[0]?.error?.includes("não encontrada") ? 404 : 400 },
      );
    }

    const doc = await db.collection(ALTERAR_DADOS_COLLECTION).doc(id).get();
    const data = { ...(doc.data() as AlterarDadosDoc), estado };
    const usersByUid = await resolveUsersByUids(db, [
      readAlterarDadosUid(data.uid),
    ]);
    const detail = mapAlterarDadosDetail(id, data, usersByUid);

    return NextResponse.json({ detail, failures });
  } catch (error) {
    console.error("[alterar-dados PATCH id]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a solicitação." },
      { status: 500 },
    );
  }
}

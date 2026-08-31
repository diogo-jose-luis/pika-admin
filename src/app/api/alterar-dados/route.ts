import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/require-admin";
import {
  ALTERAR_DADOS_COLLECTION,
  computeAlterarDadosSummary,
  hydrateAlterarDadosRow,
  mapAlterarDadosRow,
  normalizeEstado,
  readAlterarDadosUid,
  sortAlterarDadosRows,
  type AlterarDadosDoc,
} from "@/lib/alterar-dados";
import {
  applyAlterarDadosDecision,
  loadAlterarDadosSnapshot,
  loadUsersForAlterarDados,
  resolveUsersByUids,
} from "@/lib/alterar-dados-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await loadAlterarDadosSnapshot(db);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as AlterarDadosDoc,
    }));
    const usersByUid = await loadUsersForAlterarDados(db, docs);
    const rows = sortAlterarDadosRows(
      docs.map((doc) => mapAlterarDadosRow(doc.id, doc.data, usersByUid)),
    );

    return NextResponse.json({
      rows,
      summary: computeAlterarDadosSummary(rows),
    });
  } catch (error) {
    console.error("[alterar-dados GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as solicitações de alteração." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      ids?: string[];
      estado?: number;
    };
    const ids = body.ids?.filter(Boolean) ?? [];
    const rawEstado = Number(body.estado);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos uma solicitação." },
        { status: 400 },
      );
    }

    if (rawEstado !== 1 && rawEstado !== 2) {
      return NextResponse.json(
        { error: "Só é possível aprovar (1) ou rejeitar (2)." },
        { status: 400 },
      );
    }

    const estado = normalizeEstado(rawEstado);

    const db = getFirestore();
    const { updatedIds, failures } = await applyAlterarDadosDecision(
      db,
      ids,
      estado,
    );

    if (updatedIds.length === 0 && failures.length > 0) {
      return NextResponse.json(
        {
          error: failures[0]?.error ?? "Não foi possível atualizar as solicitações.",
          failures,
        },
        { status: 400 },
      );
    }

    const refs = updatedIds.map((id) =>
      db.collection(ALTERAR_DADOS_COLLECTION).doc(id),
    );
    const snaps = refs.length > 0 ? await db.getAll(...refs) : [];
    const usersByUid = await resolveUsersByUids(
      db,
      snaps
        .filter((s) => s.exists)
        .map((s) => readAlterarDadosUid((s.data() as AlterarDadosDoc).uid)),
    );
    const rows = snaps
      .filter((snap) => snap.exists)
      .map((snap) =>
        hydrateAlterarDadosRow(
          mapAlterarDadosRow(
            snap.id,
            { ...(snap.data() as AlterarDadosDoc), estado },
            usersByUid,
          ),
        ),
      );

    return NextResponse.json({
      rows,
      updated: updatedIds.length,
      failures,
    });
  } catch (error) {
    console.error("[alterar-dados PATCH bulk]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar as solicitações." },
      { status: 500 },
    );
  }
}

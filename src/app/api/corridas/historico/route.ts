import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  mapCorridaFakeToRideRow,
  type CorridaFakeDoc,
  type RideRow,
} from "@/lib/ride-history";
import { requireSuperAdmin } from "@/lib/require-super-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const snapshot = await db
      .collection("corrida_fake")
      .orderBy("data", "desc")
      .get();

    const rows: RideRow[] = snapshot.docs.map((doc, index) =>
      mapCorridaFakeToRideRow(doc.id, doc.data() as CorridaFakeDoc, index + 1),
    );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("[corridas/historico GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o histórico de corridas." },
      { status: 500 },
    );
  }
}

const BATCH_DELETE_SIZE = 450;

export async function PATCH(request: Request) {
  try {
    const denied = await requireSuperAdmin();
    if (denied) return denied;

    let body: { id?: unknown; estado?: unknown; nota?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const id =
      typeof body.id === "string" && body.id.trim().length > 0
        ? body.id.trim()
        : "";
    const estado =
      typeof body.estado === "number" ? body.estado : Number(body.estado);
    const nota = typeof body.nota === "string" ? body.nota.trim() : "";

    if (!id) {
      return NextResponse.json(
        { error: "Indique o id da corrida." },
        { status: 400 },
      );
    }

    if (estado !== 1 && estado !== 2) {
      return NextResponse.json(
        { error: "Estado inválido. Use 1 (concluída) ou 2 (cancelada)." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const ref = db.collection("corrida_fake").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Corrida não encontrada." },
        { status: 404 },
      );
    }

    await ref.update({
      estado,
      nota,
    });

    const updated = await ref.get();
    const row = mapCorridaFakeToRideRow(
      updated.id,
      updated.data() as CorridaFakeDoc,
      0,
    );

    return NextResponse.json({ row });
  } catch (error) {
    console.error("[corridas/historico PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a corrida." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const denied = await requireSuperAdmin();
    if (denied) return denied;

    let body: { ids?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const rawIds = body.ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json(
        { error: "Indique pelo menos um id de corrida." },
        { status: 400 },
      );
    }

    const ids = rawIds
      .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
      .map((id) => id.trim());

    if (ids.length === 0) {
      return NextResponse.json({ error: "Nenhum id válido." }, { status: 400 });
    }

    const db = getFirestore();
    for (let i = 0; i < ids.length; i += BATCH_DELETE_SIZE) {
      const chunk = ids.slice(i, i + BATCH_DELETE_SIZE);
      const batch = db.batch();
      for (const id of chunk) {
        batch.delete(db.collection("corrida_fake").doc(id));
      }
      await batch.commit();
    }

    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    console.error("[corridas/historico DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar as corridas." },
      { status: 500 },
    );
  }
}

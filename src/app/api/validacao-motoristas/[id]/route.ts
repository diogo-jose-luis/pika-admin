import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import type { UserDoc } from "@/lib/drivers";
import {
  buildValidacaoDetail,
  mapValidacaoMotoristaRow,
  normalizeStatusCode,
  type ValidacaoMotoristaDoc,
} from "@/lib/validacao-motorista";
import {
  activateDriversForApproved,
  loadValidacaoContext,
  resolveAdminUserRef,
  validacaoUpdatePayload,
} from "@/lib/validacao-motorista-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const db = getFirestore();
    const doc = await db.collection("validacao_motorista").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: "Solicitação não encontrada." },
        { status: 404 },
      );
    }

    const { usersById, vehiclesByUserId, vehicleDocIdByUserId } =
      await loadValidacaoContext(db);
    const data = doc.data() as ValidacaoMotoristaDoc;
    const row = mapValidacaoMotoristaRow(id, data, usersById, vehiclesByUserId);
    const driverId = refToDocId(data.motorista_id) ?? "";
    const detail = buildValidacaoDetail(
      row,
      usersById.get(driverId),
      vehiclesByUserId.get(driverId),
      vehicleDocIdByUserId.get(driverId) ?? null,
    );

    return NextResponse.json({ detail });
  } catch (error) {
    console.error("[validacao-motoristas GET id]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar a solicitação." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status?: number };
    const statusCode = normalizeStatusCode(body.status);

    const db = getFirestore();
    const ref = db.collection("validacao_motorista").doc(id);
    const existing = await ref.get();

    if (!existing.exists) {
      return NextResponse.json(
        { error: "Solicitação não encontrada." },
        { status: 404 },
      );
    }

    const adminRef = await resolveAdminUserRef(db);
    const payload = validacaoUpdatePayload(statusCode, adminRef);
    await ref.update(payload);

    const data = existing.data() as ValidacaoMotoristaDoc;
    const driverId = refToDocId(data.motorista_id) ?? "";

    if (statusCode === 1 && driverId) {
      await activateDriversForApproved(db, [driverId]);
    }

    const { usersById, vehiclesByUserId } = await loadValidacaoContext(db);
    const row = mapValidacaoMotoristaRow(
      id,
      { ...data, ...payload },
      usersById,
      vehiclesByUserId,
    );

    return NextResponse.json({ row });
  } catch (error) {
    console.error("[validacao-motoristas PATCH id]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a solicitação." },
      { status: 500 },
    );
  }
}

import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import type { UserDoc } from "@/lib/drivers";
import {
  computeValidacaoSummary,
  mapDriverSelectOption,
  mapValidacaoMotoristaRow,
  sortValidacaoRows,
  type ValidacaoMotoristaDoc,
} from "@/lib/validacao-motorista";
import {
  activateDriversForApproved,
  loadValidacaoContext,
  resolveAdminUserRef,
  validacaoUpdatePayload,
} from "@/lib/validacao-motorista-server";
import { refToDocId } from "@/lib/firestore-ref";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getFirestore();
    const { validacoesSnap, usersById, vehiclesByUserId } =
      await loadValidacaoContext(db);

    const rows = sortValidacaoRows(
      validacoesSnap.docs.map((doc) =>
        mapValidacaoMotoristaRow(
          doc.id,
          doc.data() as ValidacaoMotoristaDoc,
          usersById,
          vehiclesByUserId,
        ),
      ),
    );

    const drivers = [...usersById.entries()]
      .filter(([, data]) => (data as UserDoc).isDriver === true)
      .map(([id, data]) => mapDriverSelectOption(id, data as UserDoc))
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));

    return NextResponse.json({
      rows,
      summary: computeValidacaoSummary(rows),
      drivers,
    });
  } catch (error) {
    console.error("[validacao-motoristas GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as solicitações de validação." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { motoristaId?: string };
    const motoristaId = body.motoristaId?.trim();

    if (!motoristaId) {
      return NextResponse.json(
        { error: "Selecione um motorista." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const userRef = db.collection("users").doc(motoristaId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: "Motorista não encontrado." },
        { status: 404 },
      );
    }

    const userData = userDoc.data() as UserDoc;
    if (userData.isDriver !== true) {
      return NextResponse.json(
        { error: "O utilizador selecionado não é motorista." },
        { status: 400 },
      );
    }

    const adminRef = await resolveAdminUserRef(db);
    const data: ValidacaoMotoristaDoc = {
      data_hora: FieldValue.serverTimestamp(),
      motorista_id: userRef,
      status: 0,
    };
    if (adminRef) data.aprovado_por = adminRef;

    const docRef = await db.collection("validacao_motorista").add(data);
    const created = await docRef.get();

    const { usersById, vehiclesByUserId } = await loadValidacaoContext(db);
    const row = mapValidacaoMotoristaRow(
      docRef.id,
      created.data() as ValidacaoMotoristaDoc,
      usersById,
      vehiclesByUserId,
    );

    return NextResponse.json({ row }, { status: 201 });
  } catch (error) {
    console.error("[validacao-motoristas POST]", error);
    return NextResponse.json(
      { error: "Não foi possível criar a solicitação de validação." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      ids?: string[];
      status?: number;
    };

    const ids = body.ids?.filter(Boolean) ?? [];
    const status = body.status;

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos uma solicitação." },
        { status: 400 },
      );
    }

    if (status == null || Number.isNaN(Number(status))) {
      return NextResponse.json(
        { error: "Selecione um estado válido." },
        { status: 400 },
      );
    }

    const statusCode = Number(status);
    if (statusCode < 0 || statusCode > 4) {
      return NextResponse.json(
        { error: "Estado inválido." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const adminRef = await resolveAdminUserRef(db);
    const payload = validacaoUpdatePayload(statusCode, adminRef);

    const refs = ids.map((id) => db.collection("validacao_motorista").doc(id));
    const snapshots = await db.getAll(...refs);

    const motoristaIds: string[] = [];
    const batch = db.batch();

    for (const snap of snapshots) {
      if (!snap.exists) continue;
      batch.update(snap.ref, payload);
      if (statusCode === 1) {
        const driverId = refToDocId((snap.data() as ValidacaoMotoristaDoc).motorista_id);
        if (driverId) motoristaIds.push(driverId);
      }
    }

    await batch.commit();

    if (statusCode === 1 && motoristaIds.length > 0) {
      await activateDriversForApproved(db, motoristaIds);
    }

    const { usersById, vehiclesByUserId } = await loadValidacaoContext(db);
    const rows = snapshots
      .filter((snap) => snap.exists)
      .map((snap) =>
        mapValidacaoMotoristaRow(
          snap.id,
          { ...(snap.data() as ValidacaoMotoristaDoc), ...payload },
          usersById,
          vehiclesByUserId,
        ),
      );

    return NextResponse.json({ rows });
  } catch (error) {
    console.error("[validacao-motoristas PATCH bulk]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar as solicitações." },
      { status: 500 },
    );
  }
}

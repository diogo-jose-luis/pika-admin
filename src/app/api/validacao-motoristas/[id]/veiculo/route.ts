import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import type { VeiculoProvisorioDoc } from "@/lib/drivers";
import {
  buildValidacaoDetail,
  mapValidacaoMotoristaRow,
  type ValidacaoMotoristaDoc,
} from "@/lib/validacao-motorista";
import {
  findVehicleDocIdForDriver,
  loadValidacaoContext,
} from "@/lib/validacao-motorista-server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      marca?: string;
      modelo?: string;
      matricula?: string;
      ano?: string | number;
    };

    const db = getFirestore();
    const validacaoRef = db.collection("validacao_motorista").doc(id);
    const validacaoDoc = await validacaoRef.get();

    if (!validacaoDoc.exists) {
      return NextResponse.json(
        { error: "Solicitação não encontrada." },
        { status: 404 },
      );
    }

    const driverId = refToDocId(
      (validacaoDoc.data() as ValidacaoMotoristaDoc).motorista_id,
    );
    if (!driverId) {
      return NextResponse.json(
        { error: "Motorista não associado à solicitação." },
        { status: 400 },
      );
    }

    const anoNum = Number.parseInt(String(body.ano ?? "").trim(), 10);
    const vehicleData: VeiculoProvisorioDoc = {
      marca: body.marca?.trim() || "",
      modelo: body.modelo?.trim() || "",
      matricula: body.matricula?.trim() || "",
      ...(Number.isFinite(anoNum) && anoNum >= 1900 && anoNum <= 2100
        ? { ano: anoNum }
        : {}),
    };

    let vehicleDocId = await findVehicleDocIdForDriver(db, driverId);
    const motoristaRef = db.collection("users").doc(driverId);

    if (vehicleDocId) {
      await db.collection("veiculo_provisorio").doc(vehicleDocId).update(vehicleData);
    } else {
      const created = await db.collection("veiculo_provisorio").add({
        ...vehicleData,
        motorista: motoristaRef,
      });
      vehicleDocId = created.id;
    }

    const { usersById, vehiclesByUserId, vehicleDocIdByUserId } =
      await loadValidacaoContext(db);
    const row = mapValidacaoMotoristaRow(
      id,
      validacaoDoc.data() as ValidacaoMotoristaDoc,
      usersById,
      vehiclesByUserId,
    );
    const detail = buildValidacaoDetail(
      row,
      usersById.get(driverId),
      vehiclesByUserId.get(driverId),
      vehicleDocIdByUserId.get(driverId) ?? vehicleDocId,
    );

    return NextResponse.json({ detail });
  } catch (error) {
    console.error("[validacao-motoristas veiculo PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar os dados do veículo." },
      { status: 500 },
    );
  }
}

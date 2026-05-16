import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  mapUserToDriverCard,
  type DriverRideStats,
  type UserDoc,
  type VeiculoProvisorioDoc,
} from "@/lib/drivers";
import { refToDocId } from "@/lib/firestore-ref";
import { normalizeUserEstado } from "@/lib/users-estado";

export const dynamic = "force-dynamic";

function emptyDriverStats(): DriverRideStats {
  return {
    completedCount: 0,
    earningsTotal: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[]; estado?: number };
    const ids = body.ids?.filter(Boolean) ?? [];
    const estado = normalizeUserEstado(body.estado);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um motorista." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const batch = db.batch();

    for (const id of ids) {
      batch.update(db.collection("users").doc(id), { estado });
    }

    await batch.commit();

    const [usersSnap, vehiclesSnap, ridesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("veiculo_provisorio").get(),
      db.collection("corrida_fake").get(),
    ]);

    const vehicleByUserId = new Map<string, VeiculoProvisorioDoc>();
    for (const doc of vehiclesSnap.docs) {
      const data = doc.data() as VeiculoProvisorioDoc;
      const motoristaId = refToDocId(data.motorista);
      if (motoristaId) vehicleByUserId.set(motoristaId, data);
    }

    const statsByDriverId = new Map<string, DriverRideStats>();
    for (const doc of ridesSnap.docs) {
      const data = doc.data();
      const motoristaId = refToDocId(data.motorista_id);
      if (!motoristaId) continue;
      const stats = statsByDriverId.get(motoristaId) ?? emptyDriverStats();
      const preco =
        typeof data.preco === "number" ? data.preco : Number(data.preco) || 0;
      const rideEstado =
        typeof data.estado === "number" ? data.estado : Number(data.estado);
      stats.earningsTotal += preco;
      if (rideEstado === 1) {
        stats.completedCount += 1;
        const estrelas =
          typeof data.estrelas === "number"
            ? data.estrelas
            : Number(data.estrelas);
        if (estrelas >= 1 && estrelas <= 5) {
          stats.ratingSum += estrelas;
          stats.ratingCount += 1;
        }
      }
      statsByDriverId.set(motoristaId, stats);
    }

    const idSet = new Set(ids);
    const drivers = usersSnap.docs
      .filter((doc) => {
        const data = doc.data() as UserDoc;
        return data.isDriver === true && idSet.has(doc.id);
      })
      .map((doc) => {
        const data = doc.data() as UserDoc;
        const stats = statsByDriverId.get(doc.id) ?? emptyDriverStats();
        return mapUserToDriverCard(
          doc.id,
          data,
          vehicleByUserId.get(doc.id),
          stats,
        );
      });

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("[motoristas estado PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o estado dos motoristas." },
      { status: 500 },
    );
  }
}

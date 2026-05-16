import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import {
  computeDriversSummary,
  mapUserToDriverCard,
  type DriverRideStats,
  type UserDoc,
  type VeiculoProvisorioDoc,
} from "@/lib/drivers";

export const dynamic = "force-dynamic";

function emptyDriverStats(): DriverRideStats {
  return {
    completedCount: 0,
    earningsTotal: 0,
    ratingSum: 0,
    ratingCount: 0,
  };
}

export async function GET() {
  try {
    const db = getFirestore();

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
      const estado =
        typeof data.estado === "number" ? data.estado : Number(data.estado);

      stats.earningsTotal += preco;

      if (estado === 1) {
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

    const drivers = usersSnap.docs
      .filter((doc) => (doc.data() as UserDoc).isDriver === true)
      .map((doc) => {
        const data = doc.data() as UserDoc;
        const stats = statsByDriverId.get(doc.id) ?? emptyDriverStats();
        return mapUserToDriverCard(
          doc.id,
          data,
          vehicleByUserId.get(doc.id),
          stats,
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt"));

    const summary = computeDriversSummary(drivers);

    return NextResponse.json({ drivers, summary });
  } catch (error) {
    console.error("[motoristas]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os motoristas." },
      { status: 500 },
    );
  }
}

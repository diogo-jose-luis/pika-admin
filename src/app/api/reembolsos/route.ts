import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import type { CorridaFakeDoc } from "@/lib/ride-history";
import type {
  DriverRideStats,
  UserDoc,
  VeiculoProvisorioDoc,
} from "@/lib/drivers";
import {
  computeRefundsSummary,
  emptyDriverStats,
  isRideEarningsEntry,
  mapMovementToRefundRow,
  mapRideDoc,
  mapUserAndRideStats,
  type MotoristaSaldoMovimentoDoc,
  type RefundRow,
} from "@/lib/reembolsos";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 450;
const GET_ALL_CHUNK = 100;

async function getDocsByIds(
  collection: string,
  ids: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const result = new Map<string, Record<string, unknown>>();
  if (unique.length === 0) return result;

  const db = getFirestore();
  for (let i = 0; i < unique.length; i += GET_ALL_CHUNK) {
    const chunk = unique.slice(i, i + GET_ALL_CHUNK);
    const snaps = await db.getAll(
      ...chunk.map((id) => db.collection(collection).doc(id)),
    );
    for (const snap of snaps) {
      if (snap.exists) result.set(snap.id, snap.data() as Record<string, unknown>);
    }
  }
  return result;
}

export async function GET() {
  try {
    const db = getFirestore();
    const [movementsSnap, vehiclesSnap, ridesSnap] = await Promise.all([
      db.collection("motorista_saldo_movimento").get(),
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
    const rideById = new Map<string, CorridaFakeDoc>();

    for (const doc of ridesSnap.docs) {
      const data = doc.data() as CorridaFakeDoc;
      rideById.set(doc.id, data);

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

    const matchingMovements = movementsSnap.docs.filter((doc) =>
      isRideEarningsEntry(doc.data() as MotoristaSaldoMovimentoDoc),
    );

    const driverIds = matchingMovements
      .map((doc) =>
        refToDocId((doc.data() as MotoristaSaldoMovimentoDoc).motorista_id),
      )
      .filter((id): id is string => Boolean(id));

    const usersById = await getDocsByIds("users", driverIds);

    const driverCards = new Map<string, ReturnType<typeof mapUserAndRideStats>>();
    for (const driverId of new Set(driverIds)) {
      driverCards.set(
        driverId,
        mapUserAndRideStats({
          userId: driverId,
          user: usersById.get(driverId) as UserDoc | undefined,
          vehicle: vehicleByUserId.get(driverId),
          stats: statsByDriverId.get(driverId) ?? emptyDriverStats(),
        }),
      );
    }

    const rows: RefundRow[] = matchingMovements
      .map((doc) => {
        const data = doc.data() as MotoristaSaldoMovimentoDoc;
        const motoristaId = refToDocId(data.motorista_id) ?? "";
        const corridaId = refToDocId(data.corrida_fake);
        return mapMovementToRefundRow(
          doc.id,
          data,
          motoristaId ? (driverCards.get(motoristaId) ?? null) : null,
          corridaId
            ? mapRideDoc(corridaId, rideById.get(corridaId), 0)
            : null,
        );
      })
      .sort((a, b) => (b.criadoEmMs ?? 0) - (a.criadoEmMs ?? 0));

    return NextResponse.json({
      rows,
      summary: computeRefundsSummary(rows),
    });
  } catch (error) {
    console.error("[reembolsos GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os reembolsos." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    let body: { ids?: unknown; jaRecebido?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
    }

    const rawIds = body.ids;
    if (!Array.isArray(rawIds) || rawIds.length === 0) {
      return NextResponse.json(
        { error: "Indique pelo menos um registo." },
        { status: 400 },
      );
    }

    const ids = [
      ...new Set(
        rawIds
          .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
          .map((id) => id.trim()),
      ),
    ];

    if (ids.length === 0) {
      return NextResponse.json({ error: "Nenhum id válido." }, { status: 400 });
    }

    if (typeof body.jaRecebido !== "boolean") {
      return NextResponse.json(
        { error: "Indique jaRecebido como true ou false." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const id of chunk) {
        batch.update(db.collection("motorista_saldo_movimento").doc(id), {
          jaRecebido: body.jaRecebido,
        });
      }
      await batch.commit();
    }

    return NextResponse.json({
      updated: ids.length,
      jaRecebido: body.jaRecebido,
    });
  } catch (error) {
    console.error("[reembolsos PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar os reembolsos." },
      { status: 500 },
    );
  }
}

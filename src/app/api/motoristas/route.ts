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
import { requireSuperAdmin } from "@/lib/require-super-admin";

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

const BATCH_SIZE = 450;

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
        { error: "Indique pelo menos um id de motorista." },
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

    const db = getFirestore();
    const idSet = new Set(ids);

    const [userSnaps, vehiclesSnap] = await Promise.all([
      Promise.all(ids.map((id) => db.collection("users").doc(id).get())),
      db.collection("veiculo_provisorio").get(),
    ]);

    const deletableUserIds: string[] = [];
    for (const snap of userSnaps) {
      if (!snap.exists) continue;
      const data = snap.data() as UserDoc;
      if (data.isDriver === true) deletableUserIds.push(snap.id);
    }

    if (deletableUserIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum motorista encontrado para eliminar." },
        { status: 404 },
      );
    }

    const vehicleDocIds: string[] = [];
    for (const doc of vehiclesSnap.docs) {
      const data = doc.data() as VeiculoProvisorioDoc;
      const motoristaId = refToDocId(data.motorista);
      if (motoristaId && idSet.has(motoristaId)) {
        vehicleDocIds.push(doc.id);
      }
    }

    const allDeletes = [
      ...deletableUserIds.map((id) => ({
        collection: "users" as const,
        id,
      })),
      ...vehicleDocIds.map((id) => ({
        collection: "veiculo_provisorio" as const,
        id,
      })),
    ];

    for (let i = 0; i < allDeletes.length; i += BATCH_SIZE) {
      const chunk = allDeletes.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const item of chunk) {
        batch.delete(db.collection(item.collection).doc(item.id));
      }
      await batch.commit();
    }

    return NextResponse.json({
      deleted: deletableUserIds.length,
      vehiclesDeleted: vehicleDocIds.length,
    });
  } catch (error) {
    console.error("[motoristas DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar os motoristas." },
      { status: 500 },
    );
  }
}

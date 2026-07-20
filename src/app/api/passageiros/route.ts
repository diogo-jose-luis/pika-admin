import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import {
  computePassengersSummary,
  mapUserToPassengerRow,
  toDate,
  type PassengerRideStats,
  type PassengerUserDoc,
} from "@/lib/passengers";
import { requireSuperAdmin } from "@/lib/require-super-admin";

export const dynamic = "force-dynamic";

function emptyPassengerStats(): PassengerRideStats {
  return {
    completedCount: 0,
    spentTotal: 0,
    ratingSum: 0,
    ratingCount: 0,
    lastRideAt: null,
  };
}

export async function GET() {
  try {
    const db = getFirestore();

    const [usersSnap, ridesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("corrida_fake").get(),
    ]);

    const statsByPassengerId = new Map<string, PassengerRideStats>();

    for (const doc of ridesSnap.docs) {
      const data = doc.data();
      const passageiroId = refToDocId(data.passageiro_id);
      if (!passageiroId) continue;

      const estado =
        typeof data.estado === "number" ? data.estado : Number(data.estado);
      if (estado !== 1) continue;

      const stats = statsByPassengerId.get(passageiroId) ?? emptyPassengerStats();
      const preco =
        typeof data.preco === "number" ? data.preco : Number(data.preco) || 0;

      stats.completedCount += 1;
      stats.spentTotal += preco;

      const estrelas =
        typeof data.estrelas_driver_passageiro === "number"
          ? data.estrelas_driver_passageiro
          : Number(data.estrelas_driver_passageiro);
      if (estrelas >= 1 && estrelas <= 5) {
        stats.ratingSum += estrelas;
        stats.ratingCount += 1;
      }

      const rideDate = toDate(data.data);
      if (
        rideDate &&
        (!stats.lastRideAt || rideDate.getTime() > stats.lastRideAt.getTime())
      ) {
        stats.lastRideAt = rideDate;
      }

      statsByPassengerId.set(passageiroId, stats);
    }

    const passengerDocs = usersSnap.docs.filter(
      (doc) => (doc.data() as PassengerUserDoc).isDriver !== true,
    );

    const createdDates: Date[] = [];
    const passengers = passengerDocs
      .map((doc) => {
        const data = doc.data() as PassengerUserDoc;
        const created = toDate(data.created_time);
        if (created) createdDates.push(created);

        const stats = statsByPassengerId.get(doc.id) ?? emptyPassengerStats();
        return mapUserToPassengerRow(0, doc.id, data, stats);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt"))
      .map((row, index) => ({ ...row, serial: index + 1 }));

    const summary = computePassengersSummary(passengers, createdDates);

    return NextResponse.json({ passengers, summary });
  } catch (error) {
    console.error("[passageiros]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os passageiros." },
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
        { error: "Indique pelo menos um id de passageiro." },
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
    const userSnaps = await Promise.all(
      ids.map((id) => db.collection("users").doc(id).get()),
    );

    const deletableUserIds: string[] = [];
    for (const snap of userSnaps) {
      if (!snap.exists) continue;
      const data = snap.data() as PassengerUserDoc;
      if (data.isDriver !== true) deletableUserIds.push(snap.id);
    }

    if (deletableUserIds.length === 0) {
      return NextResponse.json(
        { error: "Nenhum passageiro encontrado para eliminar." },
        { status: 404 },
      );
    }

    for (let i = 0; i < deletableUserIds.length; i += BATCH_SIZE) {
      const chunk = deletableUserIds.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const id of chunk) {
        batch.delete(db.collection("users").doc(id));
      }
      await batch.commit();
    }

    return NextResponse.json({ deleted: deletableUserIds.length });
  } catch (error) {
    console.error("[passageiros DELETE]", error);
    return NextResponse.json(
      { error: "Não foi possível eliminar os passageiros." },
      { status: 500 },
    );
  }
}

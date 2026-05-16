import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  mapUserToPassengerRow,
  toDate,
  type PassengerRideStats,
  type PassengerUserDoc,
} from "@/lib/passengers";
import { refToDocId } from "@/lib/firestore-ref";
import { normalizeUserEstado } from "@/lib/users-estado";

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

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[]; estado?: number };
    const ids = body.ids?.filter(Boolean) ?? [];
    const estado = normalizeUserEstado(body.estado);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um passageiro." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const batch = db.batch();

    for (const id of ids) {
      batch.update(db.collection("users").doc(id), { estado });
    }

    await batch.commit();

    const [usersSnap, ridesSnap] = await Promise.all([
      db.collection("users").get(),
      db.collection("corrida_fake").get(),
    ]);

    const statsByPassengerId = new Map<string, PassengerRideStats>();
    for (const doc of ridesSnap.docs) {
      const data = doc.data();
      const passageiroId = refToDocId(data.passageiro_id);
      if (!passageiroId) continue;
      const rideEstado =
        typeof data.estado === "number" ? data.estado : Number(data.estado);
      if (rideEstado !== 1) continue;
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

    const idSet = new Set(ids);
    const passengers = usersSnap.docs
      .filter((doc) => {
        const data = doc.data() as PassengerUserDoc;
        return data.isDriver !== true && idSet.has(doc.id);
      })
      .map((doc) => {
        const data = doc.data() as PassengerUserDoc;
        const stats = statsByPassengerId.get(doc.id) ?? emptyPassengerStats();
        return mapUserToPassengerRow(0, doc.id, data, stats);
      });

    return NextResponse.json({ passengers });
  } catch (error) {
    console.error("[passageiros estado PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o estado dos passageiros." },
      { status: 500 },
    );
  }
}

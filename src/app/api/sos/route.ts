import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import {
  mapSosToAlertRow,
  type SosAlertRow,
  type SosCorridaDoc,
  type SosDoc,
  type SosUserDoc,
} from "@/lib/sos-alerts";
import { toDate } from "@/lib/users-shared";

export const dynamic = "force-dynamic";

async function loadDocsByIds<T extends Record<string, unknown>>(
  collection: string,
  ids: string[],
): Promise<Map<string, T>> {
  const map = new Map<string, T>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;

  const db = getFirestore();
  const chunkSize = 30;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const refs = chunk.map((id) => db.collection(collection).doc(id));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) {
        map.set(snap.id, snap.data() as T);
      }
    }
  }

  return map;
}

export async function GET() {
  try {
    const db = getFirestore();
    let snapshot;

    try {
      snapshot = await db.collection("SOS").orderBy("dataHora", "desc").get();
    } catch {
      snapshot = await db.collection("SOS").get();
    }

    const sosDocs = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as SosDoc,
    }));

    const userIds: string[] = [];
    const corridaIds: string[] = [];

    for (const { data } of sosDocs) {
      const userId = refToDocId(data.userRef);
      const corridaId = refToDocId(data.corridaID);
      if (userId) userIds.push(userId);
      if (corridaId) corridaIds.push(corridaId);
    }

    const [usersMap, corridasMap] = await Promise.all([
      loadDocsByIds<SosUserDoc>("users", userIds),
      loadDocsByIds<SosCorridaDoc>("corrida_fake", corridaIds),
    ]);

    sosDocs.sort((a, b) => {
      const ta = toDate(a.data.dataHora)?.getTime() ?? 0;
      const tb = toDate(b.data.dataHora)?.getTime() ?? 0;
      return tb - ta;
    });

    const alerts: SosAlertRow[] = sosDocs.map(({ id, data }) => {
      const userId = refToDocId(data.userRef);
      const corridaId = refToDocId(data.corridaID);
      return mapSosToAlertRow(
        id,
        data,
        userId ? usersMap.get(userId) : undefined,
        corridaId ? corridasMap.get(corridaId) : undefined,
      );
    });

    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("[sos GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os alertas SOS." },
      { status: 500 },
    );
  }
}

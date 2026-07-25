import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import {
  mapSosToWatchItem,
  type SosDoc,
  type SosUserDoc,
  type SosWatchItem,
} from "@/lib/sos-alerts";
import { toDate } from "@/lib/users-shared";

export const dynamic = "force-dynamic";

/** Quantidade máxima de SOS recentes no poll (mantém o endpoint leve). */
const WATCH_LIMIT = 25;

async function loadUsersByIds(
  ids: string[],
): Promise<Map<string, SosUserDoc>> {
  const map = new Map<string, SosUserDoc>();
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return map;

  const db = getFirestore();
  const chunkSize = 30;

  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const refs = chunk.map((id) => db.collection("users").doc(id));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) {
        map.set(snap.id, snap.data() as SosUserDoc);
      }
    }
  }

  return map;
}

/**
 * Endpoint leve para o watcher global do header.
 * Só devolve os SOS mais recentes (sem join de corridas).
 */
export async function GET() {
  try {
    const db = getFirestore();
    let snapshot;

    try {
      snapshot = await db
        .collection("SOS")
        .orderBy("dataHora", "desc")
        .limit(WATCH_LIMIT)
        .get();
    } catch {
      snapshot = await db.collection("SOS").limit(WATCH_LIMIT).get();
    }

    const sosDocs = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data() as SosDoc,
    }));

    sosDocs.sort((a, b) => {
      const ta = toDate(a.data.dataHora)?.getTime() ?? 0;
      const tb = toDate(b.data.dataHora)?.getTime() ?? 0;
      return tb - ta;
    });

    const limited = sosDocs.slice(0, WATCH_LIMIT);
    const userIds = limited
      .map(({ data }) => refToDocId(data.userRef))
      .filter((id): id is string => Boolean(id));

    const usersMap = await loadUsersByIds(userIds);

    const items: SosWatchItem[] = limited.map(({ id, data }) => {
      const userId = refToDocId(data.userRef);
      return mapSosToWatchItem(
        id,
        data,
        userId ? usersMap.get(userId) : undefined,
      );
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[sos/watch GET]", error);
    return NextResponse.json(
      { error: "Não foi possível verificar alertas SOS." },
      { status: 500 },
    );
  }
}

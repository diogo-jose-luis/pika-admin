import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { getFirestore } from "@/lib/firebase-admin";
import {
  ALTERAR_DADOS_COLLECTION,
  mapAlterarDadosDetail,
  readAlterarDadosUid,
  userUpdateFromAlterarDados,
  type AlterarDadosDoc,
  type UserProfileSnippet,
} from "@/lib/alterar-dados";

const GET_ALL_CHUNK = 100;
const UID_IN_CHUNK = 30;

export type ResolvedUser = { id: string; data: UserProfileSnippet };

export async function loadAlterarDadosSnapshot(db: Firestore) {
  try {
    return await db
      .collection(ALTERAR_DADOS_COLLECTION)
      .orderBy("created_time", "desc")
      .get();
  } catch {
    return await db.collection(ALTERAR_DADOS_COLLECTION).get();
  }
}

export async function resolveUsersByUids(
  db: Firestore,
  uids: string[],
): Promise<Map<string, ResolvedUser>> {
  const result = new Map<string, ResolvedUser>();
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return result;

  const found = new Set<string>();

  for (let i = 0; i < unique.length; i += GET_ALL_CHUNK) {
    const chunk = unique.slice(i, i + GET_ALL_CHUNK);
    const snaps = await db.getAll(
      ...chunk.map((id) => db.collection("users").doc(id)),
    );
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const data = snap.data() as UserProfileSnippet;
      const resolved: ResolvedUser = { id: snap.id, data };
      result.set(snap.id, resolved);
      found.add(snap.id);
      const fieldUid =
        typeof data.uid === "string" ? data.uid.trim() : "";
      if (fieldUid) {
        result.set(fieldUid, resolved);
        found.add(fieldUid);
      }
    }
  }

  const missing = unique.filter((uid) => !found.has(uid));
  for (let i = 0; i < missing.length; i += UID_IN_CHUNK) {
    const chunk = missing.slice(i, i + UID_IN_CHUNK);
    const snap = await db
      .collection("users")
      .where("uid", "in", chunk)
      .get();
    for (const doc of snap.docs) {
      const data = doc.data() as UserProfileSnippet;
      const resolved: ResolvedUser = { id: doc.id, data };
      result.set(doc.id, resolved);
      const fieldUid =
        typeof data.uid === "string" ? data.uid.trim() : "";
      if (fieldUid) result.set(fieldUid, resolved);
    }
  }

  return result;
}

export async function loadUsersForAlterarDados(
  db: Firestore,
  docs: Array<{ data: AlterarDadosDoc }>,
) {
  const uids = docs.map((d) => readAlterarDadosUid(d.data.uid));
  return resolveUsersByUids(db, uids);
}

export async function fetchAlterarDadosDetail(id: string) {
  const db = getFirestore();
  const doc = await db.collection(ALTERAR_DADOS_COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as AlterarDadosDoc;
  const usersByUid = await resolveUsersByUids(db, [
    readAlterarDadosUid(data.uid),
  ]);
  return mapAlterarDadosDetail(id, data, usersByUid);
}

export async function applyAlterarDadosDecision(
  db: Firestore,
  ids: string[],
  estado: number,
): Promise<{
  updatedIds: string[];
  failures: Array<{ id: string; error: string }>;
}> {
  const unique = [...new Set(ids.filter(Boolean))];
  const failures: Array<{ id: string; error: string }> = [];
  const updatedIds: string[] = [];

  for (let i = 0; i < unique.length; i += GET_ALL_CHUNK) {
    const chunk = unique.slice(i, i + GET_ALL_CHUNK);
    const refs = chunk.map((id) =>
      db.collection(ALTERAR_DADOS_COLLECTION).doc(id),
    );
    const snaps = await db.getAll(...refs);

    const toApprove: Array<{
      snap: DocumentSnapshot;
      data: AlterarDadosDoc;
      uid: string;
    }> = [];

    for (const snap of snaps) {
      if (!snap.exists) {
        failures.push({ id: snap.id, error: "Solicitação não encontrada." });
        continue;
      }
      const data = snap.data() as AlterarDadosDoc;
      const uid = readAlterarDadosUid(data.uid);
      if (estado === 1 && !uid) {
        failures.push({
          id: snap.id,
          error: "A solicitação não tem uid do utilizador.",
        });
        continue;
      }
      toApprove.push({ snap, data, uid });
    }

    const usersByUid = await resolveUsersByUids(
      db,
      toApprove.map((item) => item.uid),
    );

    const batch = db.batch();
    let writes = 0;

    for (const item of toApprove) {
      if (estado === 1) {
        const user = usersByUid.get(item.uid);
        if (!user) {
          failures.push({
            id: item.snap.id,
            error: "Utilizador não encontrado em users.",
          });
          continue;
        }
        const payload = userUpdateFromAlterarDados(item.data);
        if (Object.keys(payload).length > 0) {
          batch.update(db.collection("users").doc(user.id), payload);
          writes += 1;
        }
      }

      batch.update(item.snap.ref, { estado });
      writes += 1;
      updatedIds.push(item.snap.id);
    }

    if (writes > 0) {
      await batch.commit();
    }
  }

  return { updatedIds, failures };
}

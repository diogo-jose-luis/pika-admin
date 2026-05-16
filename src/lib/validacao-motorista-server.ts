import { cookies } from "next/headers";
import { getFirestore } from "@/lib/firebase-admin";
import { refToDocId } from "@/lib/firestore-ref";
import { parseSessionUserCookie, USER_COOKIE } from "@/lib/session-user";
import type { UserDoc, VeiculoProvisorioDoc } from "@/lib/drivers";
import {
  buildValidacaoDetail,
  mapValidacaoMotoristaRow,
  normalizeStatusCode,
  type ValidacaoMotoristaDoc,
} from "@/lib/validacao-motorista";
export async function resolveAdminUserRef(db: ReturnType<typeof getFirestore>) {
  const jar = await cookies();
  const session = parseSessionUserCookie(jar.get(USER_COOKIE)?.value);
  if (!session?.email) return undefined;

  const snap = await db
    .collection("users")
    .where("email", "==", session.email.trim())
    .limit(1)
    .get();

  if (snap.empty) return undefined;
  return snap.docs[0]!.ref;
}

export async function activateDriversForApproved(
  db: ReturnType<typeof getFirestore>,
  motoristaIds: string[],
) {
  const unique = [...new Set(motoristaIds.filter(Boolean))];
  await Promise.all(
    unique.map((id) => db.collection("users").doc(id).update({ estado: 1 })),
  );
}

export async function loadValidacaoContext(db: ReturnType<typeof getFirestore>) {
  const [validacoesSnap, usersSnap, vehiclesSnap] = await Promise.all([
    db.collection("validacao_motorista").get(),
    db.collection("users").get(),
    db.collection("veiculo_provisorio").get(),
  ]);

  const usersById = new Map<string, UserDoc>();
  for (const doc of usersSnap.docs) {
    usersById.set(doc.id, doc.data() as UserDoc);
  }

  const vehiclesByUserId = new Map<string, VeiculoProvisorioDoc>();
  const vehicleDocIdByUserId = new Map<string, string>();
  for (const doc of vehiclesSnap.docs) {
    const data = doc.data() as VeiculoProvisorioDoc;
    const motoristaId = refToDocId(data.motorista);
    if (motoristaId) {
      vehiclesByUserId.set(motoristaId, data);
      vehicleDocIdByUserId.set(motoristaId, doc.id);
    }
  }

  return { validacoesSnap, usersById, vehiclesByUserId, vehicleDocIdByUserId };
}

export async function fetchValidacaoDetail(id: string) {
  const db = getFirestore();
  const doc = await db.collection("validacao_motorista").doc(id).get();
  if (!doc.exists) return null;

  const { usersById, vehiclesByUserId, vehicleDocIdByUserId } =
    await loadValidacaoContext(db);
  const data = doc.data() as ValidacaoMotoristaDoc;
  const row = mapValidacaoMotoristaRow(id, data, usersById, vehiclesByUserId);
  const driverId = refToDocId(data.motorista_id) ?? "";
  return buildValidacaoDetail(
    row,
    usersById.get(driverId),
    vehiclesByUserId.get(driverId),
    vehicleDocIdByUserId.get(driverId) ?? null,
  );
}

export async function findVehicleDocIdForDriver(
  db: ReturnType<typeof getFirestore>,
  driverUserDocId: string,
): Promise<string | null> {
  const snap = await db.collection("veiculo_provisorio").get();
  for (const doc of snap.docs) {
    const motoristaId = refToDocId((doc.data() as VeiculoProvisorioDoc).motorista);
    if (motoristaId === driverUserDocId) return doc.id;
  }
  return null;
}

export function validacaoUpdatePayload(
  status: number,
  adminRef?: Awaited<ReturnType<typeof resolveAdminUserRef>>,
): ValidacaoMotoristaDoc {
  const payload: ValidacaoMotoristaDoc = { status: normalizeStatusCode(status) };
  if (adminRef) {
    return { ...payload, aprovado_por: adminRef };
  }
  return payload;
}

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const BATCH_SIZE = 450;

function normalizeIsDriver(value: unknown): 0 | 1 | null {
  const n = typeof value === "number" ? value : Number(value);
  if (n === 0 || n === 1) return n;
  if (value === true) return 1;
  if (value === false) return 0;
  return null;
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[]; isDriver?: unknown };
    const ids = body.ids?.filter(Boolean) ?? [];
    const isDriver = normalizeIsDriver(body.isDriver);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um utilizador." },
        { status: 400 },
      );
    }

    if (isDriver == null) {
      return NextResponse.json(
        { error: "Indique isDriver como 0 (passageiro) ou 1 (motorista)." },
        { status: 400 },
      );
    }

    const db = getFirestore();

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);
      const batch = db.batch();
      for (const id of chunk) {
        batch.update(db.collection("users").doc(id), { isDriver: isDriver === 1 });
      }
      await batch.commit();
    }

    return NextResponse.json({ updated: ids.length, isDriver });
  } catch (error) {
    console.error("[users/perfil PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar o perfil dos utilizadores." },
      { status: 500 },
    );
  }
}

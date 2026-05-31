import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { normalizeUserOnline } from "@/lib/users-online";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 450;

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { ids?: string[]; online?: unknown };
    const ids = body.ids?.filter(Boolean) ?? [];
    const online = normalizeUserOnline(body.online);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um motorista." },
        { status: 400 },
      );
    }

    const db = getFirestore();

    for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
      const chunk = ids.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      for (const id of chunk) {
        batch.update(db.collection("users").doc(id), { online });
      }
      await batch.commit();
    }

    return NextResponse.json({ updated: ids.length, online });
  } catch (error) {
    console.error("[motoristas online PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a disponibilidade online." },
      { status: 500 },
    );
  }
}

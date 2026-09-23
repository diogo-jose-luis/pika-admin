import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import { sendUserPushNotifications } from "@/lib/push-notifications";
import { normalizeUserValidacao } from "@/lib/users-validacao";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 450;

const AUTHORIZE_PUSH = {
  title: "Motorista autorizado",
  body: "A sua conta de motorista foi autorizada. Já pode aceitar corridas.",
} as const;

const DEAUTHORIZE_PUSH = {
  title: "Autorização removida",
  body: "A sua autorização de motorista foi removida. Não poderá aceitar corridas até nova autorização.",
} as const;

function parseAuthorized(body: {
  authorized?: unknown;
  validacao?: unknown;
}): boolean | null {
  if (typeof body.authorized === "boolean") return body.authorized;
  if (body.validacao !== undefined) {
    return normalizeUserValidacao(body.validacao) === 1;
  }
  return null;
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      ids?: string[];
      authorized?: unknown;
      validacao?: unknown;
    };
    const ids = body.ids?.filter(Boolean) ?? [];
    const authorized = parseAuthorized(body);

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um motorista." },
        { status: 400 },
      );
    }

    if (authorized == null) {
      return NextResponse.json(
        { error: "Indique se pretende autorizar ou desautorizar." },
        { status: 400 },
      );
    }

    const db = getFirestore();
    const payload = authorized
      ? { isDriver: true, validacao: 1 }
      : { validacao: 0 };

    for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
      const chunk = ids.slice(i, i + BATCH_LIMIT);
      const batch = db.batch();
      for (const id of chunk) {
        batch.update(db.collection("users").doc(id), payload);
      }
      await batch.commit();
    }

    const push = authorized ? AUTHORIZE_PUSH : DEAUTHORIZE_PUSH;
    const { processed: notified } = await sendUserPushNotifications(
      ids.map((userId) => ({
        userId,
        title: push.title,
        body: push.body,
      })),
    );

    return NextResponse.json({
      updated: ids.length,
      authorized,
      validacao: authorized ? 1 : 0,
      notified,
    });
  } catch (error) {
    console.error("[motoristas validacao PATCH]", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a autorização dos motoristas." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getFirestore } from "@/lib/firebase-admin";
import {
  PUSH_MAX_BODY,
  PUSH_MAX_IDS,
  PUSH_MAX_TITLE,
  type PushAudience,
} from "@/lib/push-audience";
import { sendUserPushNotifications } from "@/lib/push-notifications";

export const dynamic = "force-dynamic";

type PushBody = {
  titulo?: unknown;
  mensagem?: unknown;
  ids?: unknown;
  audience?: unknown;
};

function normalizeAudience(value: unknown): PushAudience | null {
  if (value === "motoristas" || value === "passageiros" || value === "todos") {
    return value;
  }
  return null;
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean);
  return [...new Set(ids)].slice(0, PUSH_MAX_IDS);
}

async function resolveAudienceIds(audience: PushAudience): Promise<string[]> {
  const db = getFirestore();
  const snap = await db.collection("users").get();
  const ids: string[] = [];

  for (const doc of snap.docs) {
    if (ids.length >= PUSH_MAX_IDS) break;
    const isDriver = (doc.data() as { isDriver?: boolean }).isDriver === true;
    if (audience === "todos") {
      ids.push(doc.id);
    } else if (audience === "motoristas" && isDriver) {
      ids.push(doc.id);
    } else if (audience === "passageiros" && !isDriver) {
      ids.push(doc.id);
    }
  }

  return ids;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PushBody;
    const titulo =
      typeof body.titulo === "string"
        ? body.titulo.trim().slice(0, PUSH_MAX_TITLE)
        : "";
    const mensagem =
      typeof body.mensagem === "string"
        ? body.mensagem.trim().slice(0, PUSH_MAX_BODY)
        : "";

    if (!titulo || !mensagem) {
      return NextResponse.json(
        { error: "Indique o título e a mensagem da notificação." },
        { status: 400 },
      );
    }

    let ids = normalizeIds(body.ids);
    let audience: PushAudience | null = null;

    if (ids.length === 0) {
      audience = normalizeAudience(body.audience);
      if (!audience) {
        return NextResponse.json(
          {
            error:
              "Selecione utilizadores ou indique o destinatário (motoristas, passageiros ou todos).",
          },
          { status: 400 },
        );
      }
      ids = await resolveAudienceIds(audience);
    }

    if (ids.length === 0) {
      return NextResponse.json(
        { error: "Não foram encontrados destinatários para o envio." },
        { status: 400 },
      );
    }

    const { processed } = await sendUserPushNotifications(
      ids.map((userId) => ({
        userId,
        title: titulo,
        body: mensagem,
      })),
    );

    return NextResponse.json({
      ok: true,
      requested: ids.length,
      processed,
      audience: audience ?? "selecionados",
    });
  } catch (error) {
    console.error("[notifications/push POST]", error);
    return NextResponse.json(
      { error: "Não foi possível enviar as notificações push." },
      { status: 500 },
    );
  }
}

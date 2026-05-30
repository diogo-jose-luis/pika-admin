import { parseAuthUser } from "@/lib/auth-types";
import {
  SESSION_COOKIE,
  TOKEN_COOKIE,
  USER_COOKIE,
  serializeSessionUserFromAuth,
} from "@/lib/session-user";
import { NextRequest, NextResponse } from "next/server";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const record = body as { token?: string; user?: unknown };
  const token =
    typeof record.token === "string" ? record.token.trim() : "";
  const user = parseAuthUser(record.user);

  if (!token || !user) {
    return NextResponse.json(
      { error: "Token e utilizador são obrigatórios." },
      { status: 400 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, "1", cookieOpts);
  response.cookies.set(TOKEN_COOKIE, token, cookieOpts);
  response.cookies.set(
    USER_COOKIE,
    serializeSessionUserFromAuth(user),
    cookieOpts,
  );
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(TOKEN_COOKIE);
  response.cookies.delete(USER_COOKIE);
  return response;
}

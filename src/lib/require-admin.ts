import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { NIVEL_ADMIN } from "@/lib/auth-types";
import { parseSessionUserCookie, USER_COOKIE } from "@/lib/session-user";

/** Returns a 403 response when the session is missing or below Admin. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  const session = parseSessionUserCookie(jar.get(USER_COOKIE)?.value);
  if (!session || session.nivel < NIVEL_ADMIN) {
    return NextResponse.json(
      { error: "Apenas Admin pode realizar esta ação." },
      { status: 403 },
    );
  }
  return null;
}

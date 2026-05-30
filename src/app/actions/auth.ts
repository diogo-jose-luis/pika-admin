"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE,
  TOKEN_COOKIE,
  USER_COOKIE,
} from "@/lib/session-user";

/** Limpa cookies de sessão (complementar ao logout no cliente). */
export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(USER_COOKIE);
  jar.delete(TOKEN_COOKIE);
  redirect("/login");
}

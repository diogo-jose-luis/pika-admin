"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoLoginValid } from "@/lib/demo-users";
import {
  SESSION_COOKIE,
  USER_COOKIE,
  serializeSessionUser,
} from "@/lib/session-user";

export type LoginActionState = { error: string } | null;

export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Introduza email e palavra-passe." };
  }

  await new Promise((resolve) => {
    setTimeout(resolve, 600);
  });

  if (!isDemoLoginValid(email, password)) {
    return { error: "Credenciais inválidas. Verifique o email e a palavra-passe." };
  }

  const jar = await cookies();
  const opts = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
  jar.set(SESSION_COOKIE, "1", opts);
  jar.set(USER_COOKIE, serializeSessionUser(email), opts);
  redirect("/dashboard");
}

export async function logoutAction() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(USER_COOKIE);
  redirect("/login");
}

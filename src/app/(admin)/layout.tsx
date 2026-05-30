import { cookies } from "next/headers";
import { AdminShell } from "@/components/layout/AdminShell";
import {
  parseSessionUserCookie,
  USER_COOKIE,
  type SessionUser,
} from "@/lib/session-user";

async function sessionUserForLayout(): Promise<SessionUser> {
  const jar = await cookies();
  const parsed = parseSessionUserCookie(jar.get(USER_COOKIE)?.value);
  if (parsed) return parsed;
  return {
    displayName: "Administrador",
    email: "—",
    nivel: 4,
    roleLabel: "Super Admin",
  };
}

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await sessionUserForLayout();
  return <AdminShell user={user}>{children}</AdminShell>;
}

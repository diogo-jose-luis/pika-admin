import { AdminShell } from "@/components/layout/AdminShell";
import type { SessionUser } from "@/lib/session-user";

const FALLBACK_SESSION_USER: SessionUser = {
  displayName: "Administrador",
  email: "—",
  nivel: 4,
  roleLabel: "Super Admin",
};

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell user={FALLBACK_SESSION_USER}>{children}</AdminShell>;
}

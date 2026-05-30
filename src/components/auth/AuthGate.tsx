"use client";

import { useAuth } from "@/context/AuthContext";
import {
  canAccessPath,
  fallbackRouteForNivel,
} from "@/lib/permissions";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaIcon } from "@/components/ui/FaIcon";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessPath(user.nivel, pathname)) {
      router.replace(fallbackRouteForNivel(user.nivel));
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-pika-muted">
        <FaIcon name="spinner" className="h-8 w-8 animate-spin text-pika-primary" />
        <p className="text-sm font-medium">A carregar sessão…</p>
      </div>
    );
  }

  if (!user || !canAccessPath(user.nivel, pathname)) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-pika-muted">
        <FaIcon name="spinner" className="h-8 w-8 animate-spin text-pika-primary" />
        <p className="text-sm font-medium">A redirecionar…</p>
      </div>
    );
  }

  return <>{children}</>;
}

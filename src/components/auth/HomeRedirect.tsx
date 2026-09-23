"use client";

import { useAuth } from "@/context/AuthContext";
import { defaultRouteForNivel } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FaIcon } from "@/components/ui/FaIcon";

export function HomeRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.replace(defaultRouteForNivel(user.nivel));
      return;
    }
    router.replace("/login");
  }, [loading, user, router]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-pika-page text-pika-muted">
      <FaIcon name="spinner" className="h-8 w-8 animate-spin text-pika-primary" />
      <p className="text-sm font-medium">A redirecionar…</p>
    </div>
  );
}

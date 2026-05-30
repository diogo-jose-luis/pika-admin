"use client";

import { useAuth } from "@/context/AuthContext";
import { defaultRouteForNivel } from "@/lib/permissions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && token) {
      router.replace(defaultRouteForNivel(user.nivel));
    }
  }, [loading, user, token, router]);

  if (!loading && user && token) {
    return null;
  }

  return children;
}

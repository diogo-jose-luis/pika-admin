"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminFooter } from "@/components/layout/AdminFooter";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminDateProvider } from "@/components/providers/AdminDateProvider";
import type { SessionUser } from "@/lib/session-user";
import { cn } from "@/lib/cn";
import { SIDEBAR_COLLAPSED_KEY } from "@/lib/storage-keys";

type AdminShellProps = {
  children: React.ReactNode;
  user: SessionUser;
};

function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function AdminShell({ children, user }: AdminShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarReady, setSidebarReady] = useState(false);

  useEffect(() => {
    setSidebarCollapsed(readSidebarCollapsed());
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const collapsed = sidebarReady && sidebarCollapsed;

  return (
    <div className="flex h-svh min-h-0 w-full flex-row overflow-hidden bg-pika-page text-pika-ink">
      {menuOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full transition-transform duration-200 ease-out md:static md:z-auto md:translate-x-0",
          menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <AdminSidebar
          user={user}
          collapsed={collapsed}
          onNavigate={() => setMenuOpen(false)}
        />
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <AdminDateProvider>
          <AdminHeader
            user={user}
            sidebarCollapsed={collapsed}
            onMenuClick={() => setMenuOpen(true)}
            onSidebarToggle={toggleSidebarCollapsed}
          />
          <main className="scroll-pika min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
          <AdminFooter />
        </AdminDateProvider>
      </div>
    </div>
  );
}
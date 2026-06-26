"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaIcon } from "@/components/ui/FaIcon";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { useAuth } from "@/context/AuthContext";
import { nivelLabel } from "@/lib/auth-types";
import { sidebarNav } from "@/lib/nav";
import { filterSidebarNav } from "@/lib/permissions";
import {
  authUserToSessionUser,
  initialsFromDisplayName,
  type SessionUser,
} from "@/lib/session-user";
import { cn } from "@/lib/cn";

type AdminSidebarProps = {
  user: SessionUser;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function AdminSidebar({ user, onNavigate, collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user: authUser } = useAuth();
  const profile: SessionUser = authUser
    ? authUserToSessionUser(authUser)
    : user;
  const nivel = profile.nivel ?? 4;
  const navItems = filterSidebarNav(nivel, sidebarNav);
  const initials = initialsFromDisplayName(profile.displayName);

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-r border-pika-border bg-pika-card transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-pika-border",
          collapsed ? "justify-center px-2" : "gap-2 px-5",
        )}
      >
        <Link
          href="/dashboard"
          className={cn("flex items-center", collapsed ? "justify-center" : "gap-2")}
          onClick={onNavigate}
          title="Pika"
        >
          {collapsed ? (
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-pika-primary text-sm font-bold text-white shadow-sm">
              P
            </span>
          ) : (
            <>
              <Image
                src="/logo.png"
                alt="Pika"
                width={140}
                height={40}
                className="h-12 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/pika_dark.png"
                alt="Pika"
                width={140}
                height={40}
                className="hidden h-12 w-auto object-contain dark:block"
                priority
              />
            </>
          )}
        </Link>
      </div>

      <nav
        className={cn(
          "scroll-pika min-h-0 flex-1 space-y-1 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition",
                collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                active
                  ? "bg-pika-primary text-white shadow-sm"
                  : "text-pika-ink hover:bg-pika-page",
              )}
            >
              <FaIcon
                name={item.icon}
                overlay={item.iconOverlay}
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-white" : "text-pika-muted",
                )}
              />
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className={cn("shrink-0 border-t border-pika-border", collapsed ? "p-2" : "p-4")}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pika-primary text-xs font-semibold text-white"
              title={profile.displayName}
            >
              {initials}
            </div>
            <LogoutButton className="inline-flex h-9 w-9 items-center justify-center rounded-lg" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pika-primary text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-pika-ink">
                {profile.displayName}
              </p>
              <p className="truncate text-xs text-pika-muted">
                {profile.roleLabel ?? nivelLabel(nivel)}
              </p>
            </div>
            <LogoutButton className="inline-flex h-9 w-9 items-center justify-center rounded-lg" />
          </div>
        )}
      </div>
    </aside>
  );
}

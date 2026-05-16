"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import { sidebarNav } from "@/lib/nav";
import { logoutAction } from "@/app/actions/auth";
import { initialsFromDisplayName, type SessionUser } from "@/lib/session-user";
import { cn } from "@/lib/cn";

type AdminSidebarProps = {
  user: SessionUser;
  collapsed?: boolean;
  onNavigate?: () => void;
};

export function AdminSidebar({ user, onNavigate, collapsed = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const initials = initialsFromDisplayName(user.displayName);

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
            <Image
              src="/logo_pika.png"
              alt="Pika"
              width={140}
              height={40}
              className="h-9 w-auto object-contain"
              priority
            />
          )}
        </Link>
      </div>

      <nav
        className={cn(
          "scroll-pika min-h-0 flex-1 space-y-1 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {sidebarNav.map((item) => {
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
              <FontAwesomeIcon
                icon={item.icon}
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-white" : "text-pika-muted",
                )}
                fixedWidth
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
              title={user.displayName}
            >
              {initials}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
                aria-label="Terminar sessão"
                title="Terminar sessão"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pika-primary text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-pika-ink">{user.displayName}</p>
              <p className="truncate text-xs text-pika-muted">{user.email}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
                aria-label="Terminar sessão"
              >
                <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}

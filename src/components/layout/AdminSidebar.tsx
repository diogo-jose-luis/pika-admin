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
  onNavigate?: () => void;
};

export function AdminSidebar({ user, onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();
  const initials = initialsFromDisplayName(user.displayName);

  return (
    <aside className="flex h-full min-h-0 w-[260px] shrink-0 flex-col border-r border-pika-border bg-white">
      <div className="flex h-[72px] shrink-0 items-center gap-2 border-b border-pika-border px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <Image
            src="/logo_pika.png"
            alt="Pika"
            width={140}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <nav className="scroll-pika min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {sidebarNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "bg-pika-primary text-white shadow-sm"
                  : "text-pika-ink hover:bg-pika-page",
              )}
            >
              <FontAwesomeIcon
                icon={item.icon}
                className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-pika-muted")}
                fixedWidth
              />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-pika-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pika-primary text-xs font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-pika-ink">
              {user.displayName}
            </p>
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
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAnglesLeft,
  faAnglesRight,
  faBars,
  faBell,
  faCalendarDays,
  faChevronDown,
  faLocationDot,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { titleForPath } from "@/lib/nav";
import { ANGOLA_PROVINCES } from "@/lib/angola-provinces";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { useAdminDate } from "@/components/providers/AdminDateProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { initialsFromDisplayName, type SessionUser } from "@/lib/session-user";
import { cn } from "@/lib/cn";

type AdminHeaderProps = {
  user: SessionUser;
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
};

const iconBtnClass =
  "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-pika-border text-pika-ink transition hover:bg-pika-page";

export function AdminHeader({
  user,
  onMenuClick,
  sidebarCollapsed = false,
  onSidebarToggle,
}: AdminHeaderProps) {
  const pathname = usePathname();
  const { title, subtitle } = titleForPath(pathname);
  const { theme, toggleTheme, mounted } = useTheme();
  const [province, setProvince] = useState("Luanda");
  const { selectedIso, setSelectedIso, dateLabel } = useAdminDate();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const initials = initialsFromDisplayName(user.displayName);
  const isDark = theme === "dark";

  useEffect(() => {
    if (!userMenuOpen) return;
    function handlePointerDown(e: PointerEvent) {
      const el = userMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [userMenuOpen]);

  function openDatePicker() {
    const el = dateInputRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      void el.showPicker();
    } else {
      el.focus();
      el.click();
    }
  }

  return (
    <header className="flex h-[72px] shrink-0 items-center justify-between gap-4 border-b border-pika-border bg-pika-card px-4 md:px-6">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className={cn(iconBtnClass, "md:hidden")}
            aria-label="Abrir menu"
            onClick={onMenuClick}
          >
            <FontAwesomeIcon icon={faBars} className="h-5 w-5" />
          </button>
          {onSidebarToggle ? (
            <button
              type="button"
              className={cn(iconBtnClass, "hidden md:inline-flex")}
              aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
              aria-pressed={sidebarCollapsed}
              onClick={onSidebarToggle}
            >
              <FontAwesomeIcon
                icon={sidebarCollapsed ? faAnglesRight : faAnglesLeft}
                className="h-5 w-5"
              />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-pika-ink md:text-xl">
              {title}
            </h1>
            <p className="truncate text-sm text-pika-muted">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <div className="relative hidden sm:inline-flex">
          <span className="pointer-events-none absolute inset-y-0 left-0 z-0 flex w-10 items-center justify-center">
            <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4 text-pika-primary" />
          </span>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            aria-label="Província"
            className="h-10 min-w-[8.5rem] max-w-[11rem] cursor-pointer appearance-none rounded-xl border border-pika-border bg-pika-card py-2 pl-10 pr-9 text-sm font-medium text-pika-ink shadow-sm outline-none transition hover:bg-pika-page focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/20 sm:max-w-[14rem] md:min-w-[10rem] md:max-w-none"
          >
            {ANGOLA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-pika-muted">
            <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
          </span>
        </div>

        <div className="relative hidden lg:inline-flex">
          <input
            ref={dateInputRef}
            type="date"
            value={selectedIso}
            onChange={(e) => setSelectedIso(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
          <button
            type="button"
            onClick={openDatePicker}
            aria-label="Escolher data"
            className="flex h-10 min-w-[7.5rem] items-center gap-2 rounded-xl border border-pika-border bg-pika-card px-3 py-2 pr-9 pl-10 text-sm font-medium text-pika-ink shadow-sm transition hover:bg-pika-page"
          >
            <FontAwesomeIcon
              icon={faCalendarDays}
              className="pointer-events-none h-4 w-4 shrink-0 text-pika-primary"
            />
            <span className="pointer-events-none truncate">{dateLabel}</span>
          </button>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-pika-muted">
            <FontAwesomeIcon icon={faChevronDown} className="h-4 w-4" />
          </span>
        </div>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-0.5 rounded-xl border border-pika-border bg-pika-page p-1"
          aria-label={isDark ? "Ativar tema claro" : "Ativar tema escuro"}
          aria-pressed={isDark}
          onClick={toggleTheme}
        >
          <span
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
              mounted && !isDark
                ? "bg-pika-card text-amber-600 shadow-sm"
                : "text-pika-muted",
            )}
          >
            <FontAwesomeIcon icon={faSun} className="h-4 w-4" />
            <span className="hidden sm:inline">Claro</span>
          </span>
          <span
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition",
              mounted && isDark
                ? "bg-pika-card text-indigo-400 shadow-sm"
                : "text-pika-muted",
            )}
          >
            <FontAwesomeIcon icon={faMoon} className="h-4 w-4" />
            <span className="hidden sm:inline">Escuro</span>
          </span>
        </button>

        <button
          type="button"
          className={iconBtnClass}
          aria-label="Notificações"
        >
          <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
        </button>

        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            aria-label="Menu da conta"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-pika-border bg-gradient-to-br from-pika-primary to-pika-primary-dark text-xs font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            {initials}
          </button>
          {userMenuOpen ? (
            <div
              className="absolute right-0 top-12 z-50 w-60 rounded-xl border border-pika-border bg-pika-card py-2 shadow-lg"
              role="menu"
            >
              <div className="border-b border-pika-border px-3 py-2.5">
                <p className="truncate text-sm font-semibold text-pika-ink">
                  {user.displayName}
                </p>
                <p className="truncate text-xs text-pika-muted">{user.email}</p>
              </div>
              <div className="px-2 pt-1" role="none">
                <LogoutButton
                  showLabel
                  role="menuitem"
                  className="flex w-full rounded-lg px-2 py-2.5 text-left hover:bg-pika-page"
                  iconClassName="h-4 w-4 text-pika-muted"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

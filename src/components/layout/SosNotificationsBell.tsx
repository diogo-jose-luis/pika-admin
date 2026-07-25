"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faLocationDot,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { useSosWatcher } from "@/components/providers/SosWatcherProvider";
import { cn } from "@/lib/cn";

const iconBtnClass =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-pika-border text-pika-ink transition hover:bg-pika-page";

export function SosNotificationsBell() {
  const {
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    clearNotifications,
  } = useSosWatcher();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      const el = panelRef.current;
      if (el && !el.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) markAllRead();
      return next;
    });
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={iconBtnClass}
        aria-label={
          unreadCount > 0
            ? `Notificações SOS (${unreadCount} novas)`
            : "Notificações SOS"
        }
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={toggleOpen}
      >
        <FontAwesomeIcon icon={faBell} className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-pika-card">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-12 z-50 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-pika-border bg-pika-card shadow-lg"
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 border-b border-pika-border px-3 py-2.5">
            <p className="text-sm font-semibold text-pika-ink">Alertas SOS</p>
            <div className="flex items-center gap-2">
              {notifications.length > 0 ? (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="text-xs font-medium text-pika-muted transition hover:text-pika-ink"
                >
                  Limpar
                </button>
              ) : null}
              <Link
                href="/sos"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-pika-primary transition hover:underline"
              >
                Ver todos
              </Link>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-pika-muted">
              Sem alertas SOS novos nesta sessão.
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto scroll-pika">
              {notifications.map((n) => (
                <li key={n.id} className="border-b border-pika-border last:border-0">
                  <Link
                    href="/sos"
                    role="menuitem"
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "block px-3 py-3 transition hover:bg-pika-page",
                      !n.read && "bg-red-50/60",
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                        <FontAwesomeIcon
                          icon={faTriangleExclamation}
                          className="h-4 w-4"
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {n.code}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                            {n.severityLabel}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-pika-ink">
                          {n.titleLine}
                        </p>
                        <p className="mt-0.5 text-xs text-pika-muted">
                          {n.timeAgoLabel}
                        </p>
                        {n.mapsUrl ? (
                          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-pika-primary">
                            <FontAwesomeIcon
                              icon={faLocationDot}
                              className="h-3 w-3"
                            />
                            Localização disponível
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

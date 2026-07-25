"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SosWatchItem } from "@/lib/sos-alerts";

const POLL_MS = 10_000;
const ALERT_SOUND_SRC = "/nova-corrida-alerta.wav";
const MAX_HEADER_ITEMS = 20;

export type SosHeaderNotification = SosWatchItem & {
  receivedAt: number;
  read: boolean;
};

type SosWatcherContextValue = {
  notifications: SosHeaderNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markRead: (id: string) => void;
  clearNotifications: () => void;
};

const SosWatcherContext = createContext<SosWatcherContextValue | null>(null);

function playAlertSound(audio: HTMLAudioElement | null) {
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* autoplay pode ser bloqueado até haver interação do utilizador */
    });
  } catch {
    /* ignore */
  }
}

export function SosWatcherProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<SosHeaderNotification[]>(
    [],
  );
  const knownIdsRef = useRef<Set<string> | null>(null);
  const inFlightRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const audio = new Audio(ALERT_SOUND_SRC);
    audio.preload = "auto";
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const poll = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/sos/watch", {
        cache: "no-store",
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        items?: SosWatchItem[];
        error?: string;
      };

      if (!res.ok || !data.items) return;

      const items = data.items;
      const known = knownIdsRef.current;

      if (known === null) {
        knownIdsRef.current = new Set(items.map((item) => item.id));
        return;
      }

      const fresh = items.filter((item) => !known.has(item.id));
      if (fresh.length === 0) return;

      for (const item of fresh) known.add(item.id);

      playAlertSound(audioRef.current);

      const receivedAt = Date.now();
      setNotifications((prev) => {
        const incoming: SosHeaderNotification[] = fresh.map((item) => ({
          ...item,
          receivedAt,
          read: false,
        }));
        const merged = [...incoming, ...prev];
        const seen = new Set<string>();
        const deduped: SosHeaderNotification[] = [];
        for (const n of merged) {
          if (seen.has(n.id)) continue;
          seen.add(n.id);
          deduped.push(n);
          if (deduped.length >= MAX_HEADER_ITEMS) break;
        }
        return deduped;
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      /* falhas silenciosas: o poll seguinte tenta de novo */
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    void poll();

    const intervalId = window.setInterval(() => {
      void poll();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      abortRef.current?.abort();
    };
  }, [poll]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAllRead,
      markRead,
      clearNotifications,
    }),
    [notifications, unreadCount, markAllRead, markRead, clearNotifications],
  );

  return (
    <SosWatcherContext.Provider value={value}>
      {children}
    </SosWatcherContext.Provider>
  );
}

export function useSosWatcher() {
  const ctx = useContext(SosWatcherContext);
  if (!ctx) {
    throw new Error("useSosWatcher must be used within SosWatcherProvider");
  }
  return ctx;
}

"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faCheck,
  faFilter,
  faGaugeHigh,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import {
  EMPTY_LIVE_MAP,
  type LiveMapData,
} from "@/lib/live-map";
import { cn } from "@/lib/cn";

const LiveMapCanvas = dynamic(
  () => import("./LiveMapCanvas").then((m) => m.LiveMapCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center gap-2 text-pika-muted">
        <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
        <span className="text-sm font-medium">A carregar mapa…</span>
      </div>
    ),
  },
);

const MAP_FILTER_OPTIONS = [
  { id: "corridasAtivas", label: "Corridas Ativas" },
  { id: "motoristasOnline", label: "Motoristas Online" },
] as const;

type MapFilterId = (typeof MAP_FILTER_OPTIONS)[number]["id"];

type MapFilters = Record<MapFilterId, boolean>;

const DEFAULT_FILTERS: MapFilters = {
  corridasAtivas: true,
  motoristasOnline: true,
};

const AUTO_REFRESH_MS = 10 * 1000;

export function LiveMapView() {
  const [data, setData] = useState<LiveMapData>(EMPTY_LIVE_MAP);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MapFilters>(DEFAULT_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  const loadMap = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/mapa-ao-vivo", { cache: "no-store" });
      const json = (await res.json()) as LiveMapData & { error?: string };
      if (!res.ok) {
        throw new Error(json.error ?? "Erro ao carregar o mapa.");
      }
      setData({
        driversOnline: json.driversOnline ?? [],
        activeRides: json.activeRides ?? [],
        summary: json.summary ?? EMPTY_LIVE_MAP.summary,
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar o mapa.",
      );
      setData(EMPTY_LIVE_MAP);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMap();
  }, [loadMap]);

  useEffect(() => {
    const id = window.setInterval(() => void loadMap(true), AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [loadMap]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [filtersOpen]);

  const toggleFilter = (id: MapFilterId) => {
    setFilters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const activeFilterCount = MAP_FILTER_OPTIONS.filter((o) => filters[o.id]).length;
  const { summary, activeRides, driversOnline } = data;

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
      <div className="relative min-h-[min(72vh,560px)] min-w-0 flex-1 overflow-hidden rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pika-border bg-pika-card px-4 py-3">
          <p className="text-sm font-semibold text-pika-ink md:text-base">
            Luanda — mapa ao vivo
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void loadMap(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-pika-border bg-pika-card px-3 py-2 text-xs font-semibold text-pika-ink shadow-sm transition hover:bg-pika-page disabled:opacity-50 md:text-sm"
            >
              {refreshing ? (
                <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin text-pika-primary" />
              ) : (
                <span className="text-pika-primary">↻</span>
              )}
              Atualizar
            </button>
            <div ref={filtersRef} className="relative">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-haspopup="listbox"
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border bg-pika-card px-3 py-2 text-xs font-semibold shadow-sm transition md:text-sm",
                  filtersOpen
                    ? "border-pika-primary text-pika-primary ring-2 ring-pika-primary/20"
                    : "border-pika-border text-pika-ink hover:bg-pika-page",
                )}
              >
                <FontAwesomeIcon icon={faFilter} className="text-pika-primary" />
                Filtros
                <span className="rounded-full bg-pika-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-pika-primary">
                  {activeFilterCount}
                </span>
              </button>

              {filtersOpen ? (
                <div
                  role="listbox"
                  aria-label="Filtros do mapa"
                  className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-pika-border bg-pika-card p-2 shadow-lg"
                >
                  {MAP_FILTER_OPTIONS.map((opt) => {
                    const checked = filters[opt.id];
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="option"
                        aria-selected={checked}
                        onClick={() => toggleFilter(opt.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-pika-ink transition hover:bg-pika-page"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition",
                            checked
                              ? "border-pika-primary bg-pika-primary text-white"
                              : "border-pika-border bg-pika-card",
                          )}
                        >
                          {checked ? (
                            <FontAwesomeIcon icon={faCheck} className="h-3 w-3" />
                          ) : null}
                        </span>
                        <span className="font-medium">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {loadError ? (
          <p
            className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}

        <div className="relative h-[min(64vh,480px)] w-full md:h-[min(68vh,520px)]">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-pika-muted">
              <FontAwesomeIcon icon={faSpinner} className="h-6 w-6 animate-spin" />
              <span className="text-sm font-medium">A carregar localizações…</span>
            </div>
          ) : (
            <LiveMapCanvas
              drivers={driversOnline}
              rides={activeRides}
              filters={filters}
            />
          )}

          <div className="pointer-events-none absolute bottom-4 left-4 z-[1000] rounded-xl border border-pika-border bg-pika-card/95 px-3 py-2.5 text-xs shadow-md backdrop-blur-sm">
            <p className="mb-2 font-semibold text-pika-ink">Legenda</p>
            <div className="flex flex-col gap-2 text-pika-muted">
              <LegendItem color="bg-pika-primary" label="Corridas ativas (estado 0)" />
              <LegendItem color="bg-emerald-500" label="Motoristas online" />
            </div>
          </div>
        </div>
      </div>

      <aside className="flex w-full shrink-0 flex-col gap-4 xl:w-[320px]">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-pika-ink">Resumo</h2>
          <ul className="mt-4 space-y-4">
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm text-pika-muted">Corridas Ativas</span>
              <span className="flex items-center gap-2 text-lg font-bold text-pika-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pika-primary/15 text-pika-primary">
                  <FontAwesomeIcon icon={faCar} className="h-4 w-4" />
                </span>
                {loading ? "…" : summary.activeRides}
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm text-pika-muted">Motoristas Online</span>
              <span className="flex items-center gap-2 text-lg font-bold text-pika-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FontAwesomeIcon icon={faGaugeHigh} className="h-4 w-4" />
                </span>
                {loading ? "…" : summary.driversOnline}
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-pika-muted">
            Atualização automática a cada 10 segundos. Apenas registos com coordenadas
            GPS válidas são exibidos.
          </p>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-pika-border bg-pika-card shadow-sm">
          <div className="border-b border-pika-border px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-pika-ink">Corridas Ativas</h2>
              <span className="rounded-full bg-pika-primary/15 px-2 py-0.5 text-xs font-bold text-pika-primary">
                {loading ? "…" : activeRides.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-pika-muted">
              Corridas com estado em andamento (0)
            </p>
          </div>
          <ul className="scroll-pika max-h-[min(52vh,420px)] flex-1 divide-y divide-pika-border overflow-y-auto">
            {loading ? (
              <li className="px-5 py-8 text-center text-sm text-pika-muted">
                A carregar…
              </li>
            ) : activeRides.length === 0 ? (
              <li className="px-5 py-8 text-center text-sm text-pika-muted">
                Nenhuma corrida ativa com localização no momento.
              </li>
            ) : (
              activeRides.map((item) => (
                <li key={item.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="max-w-[120px] truncate text-xs font-bold text-pika-muted">
                      #{item.id.slice(0, 8)}
                    </span>
                    <span className="rounded-full bg-pika-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pika-primary">
                      Em andamento
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-pika-ink">{item.driver}</p>
                  <p className="text-xs text-pika-muted">{item.passenger}</p>
                  <p className="mt-2 text-xs text-pika-ink">{item.route}</p>
                  {item.eta !== "—" ? (
                    <p className="mt-2 text-xs font-semibold text-pika-primary">
                      ETA: {item.eta}
                    </p>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm",
          color,
        )}
      >
        <FontAwesomeIcon icon={faCar} className="h-3 w-3" />
      </span>
      {label}
    </span>
  );
}

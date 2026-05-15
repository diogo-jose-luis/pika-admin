"use client";

import { useCallback, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faExpand,
  faFilter,
  faGaugeHigh,
  faLocationArrow,
  faLocationDot,
  faMinus,
  faPlus,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/cn";

type MapPoint = { x: number; y: number };

const ROUTES: { from: MapPoint; to: MapPoint }[] = [
  { from: { x: 18, y: 42 }, to: { x: 38, y: 58 } },
  { from: { x: 52, y: 28 }, to: { x: 68, y: 44 } },
  { from: { x: 72, y: 62 }, to: { x: 58, y: 78 } },
];

const RIDE_MARKERS: MapPoint[] = [
  { x: 18, y: 42 },
  { x: 38, y: 58 },
  { x: 52, y: 28 },
  { x: 68, y: 44 },
  { x: 72, y: 62 },
  { x: 32, y: 72 },
];

const AVAILABLE_MARKERS: MapPoint[] = [
  { x: 28, y: 22 },
  { x: 82, y: 32 },
  { x: 44, y: 38 },
  { x: 88, y: 68 },
  { x: 14, y: 68 },
];

const ACTIVE_RIDES_LIST = [
  {
    id: "P001",
    driver: "Carlos Mendes",
    passenger: "Maria Silva",
    route: "Vila de viana -> Benfica",
    eta: "8 min",
  },
  {
    id: "P001",
    driver: "Carlos Mendes",
    passenger: "Maria Silva",
    route: "Vila de viana -> Benfica",
    eta: "8 min",
  },
  {
    id: "P001",
    driver: "Carlos Mendes",
    passenger: "Maria Silva",
    route: "Vila de viana -> Benfica",
    eta: "8 min",
  },
];

export function LiveMapView() {
  const [zoom, setZoom] = useState(1);

  const zoomIn = useCallback(() => setZoom((z) => Math.min(1.35, z + 0.1)), []);
  const zoomOut = useCallback(() => setZoom((z) => Math.max(0.85, z - 0.1)), []);

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-stretch">
      <div className="relative min-h-[min(72vh,560px)] min-w-0 flex-1 overflow-hidden rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-pika-border bg-pika-card px-4 py-3">
          <p className="text-sm font-semibold text-pika-ink md:text-base">Luanda - LD</p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-pika-border bg-pika-card px-3 py-2 text-xs font-semibold text-pika-ink shadow-sm transition hover:bg-pika-page md:text-sm"
            >
              <FontAwesomeIcon icon={faRotateRight} className="text-pika-primary" />
              Atualizar
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-pika-border bg-pika-card px-3 py-2 text-xs font-semibold text-pika-ink shadow-sm transition hover:bg-pika-page md:text-sm"
            >
              <FontAwesomeIcon icon={faFilter} className="text-pika-muted" />
              Filtros
            </button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-pika-border text-pika-muted transition hover:bg-pika-page hover:text-pika-ink"
              aria-label="Expandir mapa"
            >
              <FontAwesomeIcon icon={faExpand} className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div
          className="relative h-[min(64vh,480px)] w-full overflow-hidden md:h-[min(68vh,520px)]"
          style={{
            backgroundColor: "#e6eaea",
            backgroundImage: `
              linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px),
              linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
          }}
        >
          <div
            className="absolute inset-0 origin-center transition-transform duration-200 ease-out"
            style={{ transform: `scale(${zoom})` }}
          >
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden
            >
              {ROUTES.map((r, i) => (
                <line
                  key={i}
                  x1={r.from.x}
                  y1={r.from.y}
                  x2={r.to.x}
                  y2={r.to.y}
                  stroke="#38bdf8"
                  strokeWidth={0.55}
                  strokeDasharray="1.2 1.2"
                  strokeLinecap="round"
                  opacity={0.85}
                />
              ))}
            </svg>

            {RIDE_MARKERS.map((m, i) => (
              <MapMarker
                key={`ride-${i}`}
                leftPct={m.x}
                topPct={m.y}
                variant="ride"
              />
            ))}
            {AVAILABLE_MARKERS.map((m, i) => (
              <MapMarker
                key={`av-${i}`}
                leftPct={m.x}
                topPct={m.y}
                variant="available"
              />
            ))}
          </div>

          <div className="pointer-events-auto absolute bottom-4 left-4 rounded-xl border border-pika-border bg-pika-card/95 px-3 py-2.5 text-xs shadow-md backdrop-blur-sm">
            <p className="mb-2 font-semibold text-pika-ink">Legenda</p>
            <div className="flex flex-col gap-2 text-pika-muted">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pika-primary text-white shadow-sm">
                  <FontAwesomeIcon icon={faCar} className="h-3 w-3" />
                </span>
                Corrida ativa
              </span>
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                  <FontAwesomeIcon icon={faCar} className="h-3 w-3" />
                </span>
                Disponível
              </span>
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-lg border border-pika-border bg-pika-card shadow-md">
            <button
              type="button"
              onClick={zoomIn}
              className="flex h-10 w-10 items-center justify-center border-b border-pika-border text-pika-ink transition hover:bg-pika-page"
              aria-label="Aumentar zoom"
            >
              <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              className="flex h-10 w-10 items-center justify-center text-pika-ink transition hover:bg-pika-page"
              aria-label="Diminuir zoom"
            >
              <FontAwesomeIcon icon={faMinus} className="h-4 w-4" />
            </button>
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
                50
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm text-pika-muted">Motoristas Online</span>
              <span className="flex items-center gap-2 text-lg font-bold text-pika-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <FontAwesomeIcon icon={faGaugeHigh} className="h-4 w-4" />
                </span>
                124
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm text-pika-muted">Em deslocamento</span>
              <span className="flex items-center gap-2 text-lg font-bold text-pika-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pika-primary/15 text-pika-primary">
                  <FontAwesomeIcon icon={faLocationArrow} className="h-4 w-4" />
                </span>
                24
              </span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-sm text-pika-muted">Aguardando Passageiro</span>
              <span className="flex items-center gap-2 text-lg font-bold text-pika-ink">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                  <FontAwesomeIcon icon={faLocationDot} className="h-4 w-4" />
                </span>
                50
              </span>
            </li>
          </ul>
        </div>

        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-pika-border bg-pika-card shadow-sm">
          <div className="border-b border-pika-border px-5 py-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-pika-ink">Corridas Ativas</h2>
              <span className="rounded-full bg-pika-primary/15 px-2 py-0.5 text-xs font-bold text-pika-primary">
                4
              </span>
            </div>
            <p className="mt-1 text-xs text-pika-muted">Melhor desempenho hoje.</p>
          </div>
          <ul className="scroll-pika max-h-[min(52vh,420px)] flex-1 divide-y divide-pika-border overflow-y-auto">
            {ACTIVE_RIDES_LIST.map((item, idx) => (
              <li key={idx} className="px-5 py-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-pika-muted">{item.id}</span>
                  <span className="rounded-full bg-pika-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-pika-primary">
                    Em andamento
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-pika-ink">{item.driver}</p>
                <p className="text-xs text-pika-muted">{item.passenger}</p>
                <p className="mt-2 text-xs text-pika-ink">{item.route}</p>
                <p className="mt-2 text-xs font-semibold text-pika-primary">
                  ETA: {item.eta}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function MapMarker({
  leftPct,
  topPct,
  variant,
}: {
  leftPct: number;
  topPct: number;
  variant: "ride" | "available";
}) {
  return (
    <div
      className="absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md md:h-10 md:w-10"
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      <span
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full",
          variant === "ride" ? "bg-pika-primary" : "bg-emerald-500",
        )}
      >
        <FontAwesomeIcon icon={faCar} className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </span>
    </div>
  );
}

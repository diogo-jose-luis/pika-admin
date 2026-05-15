"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faCalculator,
  faClock,
  faKey,
  faLocationDot,
  faMapPin,
  faRoute,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { isPlaceInAngola } from "@/lib/angola-places";
import { formatKz, parseKzInput } from "@/lib/format-kz";
import {
  calculateRidePrice,
  DEFAULT_PEAK_SCHEDULE,
  parseDatetimeLocalValue,
  toDatetimeLocalValue,
  WEEKDAY_LABELS,
  type PeakDaySchedule,
} from "@/lib/price-simulator";

const DEFAULT_API_KEY = "AIzaSyC6QVStEYmrghpqCVrtKM4r1W1D6ykg98w";

function directionsErrorMessage(
  status?: string,
  errorMessage?: string,
): string {
  if (
    status === "REQUEST_DENIED" &&
    errorMessage?.toLowerCase().includes("not authorized")
  ) {
    return "Ative a Directions API no Google Cloud e inclua-a nas restrições da chave.";
  }
  return errorMessage ?? "Não foi possível calcular a distância da rota.";
}

type PlaceResult = {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
};

export type SelectedPlace = {
  label: string;
  lat: number;
  lng: number;
};

function inputClass(extra?: string) {
  return cn(
    "mt-1.5 w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:bg-pika-card focus:ring-2 focus:ring-pika-primary/20",
    extra,
  );
}

function compactInputClass(extra?: string) {
  return cn(
    "w-full rounded-lg border border-pika-border bg-pika-card px-2.5 py-2 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/20",
    extra,
  );
}

function PlaceAutocomplete({
  id,
  label,
  hint,
  accent,
  value,
  query,
  onQueryChange,
  onSelect,
  onClear,
  apiKey,
}: {
  id: string;
  label: string;
  hint: string;
  accent: "origin" | "destination";
  value: SelectedPlace | null;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (place: SelectedPlace) => void;
  onClear: () => void;
  apiKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceResult[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (value || !query.trim() || query.trim().length < 2 || !apiKey.trim()) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          query: query.trim(),
          key: apiKey.trim(),
        });
        const res = await fetch(`/api/places/textsearch?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.status === "OK" && Array.isArray(data.results)) {
          const inAngola = data.results.filter((place: PlaceResult) =>
            isPlaceInAngola(place),
          );
          setSuggestions(inAngola.slice(0, 6));
          setOpen(true);
        } else if (data.status === "ZERO_RESULTS") {
          setSuggestions([]);
          setOpen(true);
        } else {
          setSuggestions([]);
          setError(data.error_message ?? "Não foi possível pesquisar locais.");
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Erro ao pesquisar. Tente novamente.");
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, apiKey, value]);

  const accentRing =
    accent === "origin"
      ? "focus-within:ring-2 focus-within:ring-emerald-500/25 focus-within:border-emerald-500"
      : "focus-within:ring-2 focus-within:ring-orange-500/25 focus-within:border-orange-500";

  const accentIcon =
    accent === "origin" ? "text-emerald-600" : "text-orange-600";

  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-pika-ink">
        {label}
      </label>
      <p className="mt-0.5 text-xs text-pika-muted">{hint}</p>
      <div ref={wrapRef} className={cn("relative mt-2 rounded-xl", accentRing)}>
        <span
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2",
            accentIcon,
          )}
        >
          <FontAwesomeIcon
            icon={accent === "origin" ? faLocationDot : faMapPin}
            className="h-4 w-4"
          />
        </span>
        <input
          id={id}
          type="text"
          value={query}
          autoComplete="off"
          placeholder={
            accent === "origin" ? "Ex.: Aeroporto de Luanda" : "Ex.: Talatona"
          }
          onChange={(e) => {
            onQueryChange(e.target.value);
            if (value) onClear();
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          className={cn(
            inputClass("mt-0 bg-pika-card pl-10 pr-10"),
            value && "border-emerald-300/80 bg-emerald-50/40",
          )}
        />
        {loading ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-pika-muted">
            <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
          </span>
        ) : null}
        {open && suggestions.length > 0 ? (
          <ul
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-pika-border bg-pika-card py-1 shadow-lg"
          >
            {suggestions.map((place) => {
              const labelText =
                place.formatted_address || place.name || "Local";
              return (
                <li key={place.place_id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm transition hover:bg-pika-page"
                    onClick={() => {
                      const loc = place.geometry.location;
                      onSelect({
                        label: labelText,
                        lat: loc.lat,
                        lng: loc.lng,
                      });
                      onQueryChange(labelText);
                      setOpen(false);
                      setSuggestions([]);
                    }}
                  >
                    <span className="font-medium text-pika-ink">
                      {place.name}
                    </span>
                    {place.formatted_address &&
                    place.formatted_address !== place.name ? (
                      <span className="mt-0.5 block text-xs text-pika-muted">
                        {place.formatted_address}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
        {open && !loading && suggestions.length === 0 && query.length >= 2 ? (
          <p className="absolute z-20 mt-1 w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2 text-xs text-pika-muted shadow-lg">
            Nenhum local em Angola para &quot;{query}&quot;
          </p>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function PeakScheduleEditor({
  schedule,
  onChange,
}: {
  schedule: PeakDaySchedule[];
  onChange: (next: PeakDaySchedule[]) => void;
}) {
  const updateDay = (index: number, patch: Partial<PeakDaySchedule>) => {
    const next = schedule.map((row, i) =>
      i === index ? { ...row, ...patch } : row,
    );
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-pika-border">
      <div className="hidden bg-pika-page/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-pika-muted sm:grid sm:grid-cols-[1fr_7rem_7rem] sm:gap-3">
        <span>Dia</span>
        <span>Início pico</span>
        <span>Fim pico</span>
      </div>
      <ul className="divide-y divide-pika-border">
        {WEEKDAY_LABELS.map((label, index) => (
          <li
            key={label}
            className="grid gap-3 bg-pika-card px-4 py-3 sm:grid-cols-[1fr_7rem_7rem] sm:items-center sm:gap-3"
          >
            <span className="text-sm font-semibold text-pika-ink">{label}</span>
            <label className="block sm:contents">
              <span className="mb-1 block text-xs text-pika-muted sm:hidden">
                Início pico
              </span>
              <input
                type="time"
                value={schedule[index]?.start ?? ""}
                onChange={(e) => updateDay(index, { start: e.target.value })}
                className={compactInputClass()}
              />
            </label>
            <label className="block sm:contents">
              <span className="mb-1 block text-xs text-pika-muted sm:hidden">
                Fim pico
              </span>
              <input
                type="time"
                value={schedule[index]?.end ?? ""}
                onChange={(e) => updateDay(index, { end: e.target.value })}
                className={compactInputClass()}
              />
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PriceSimulatorCard({
  tarifaBase,
  tarifaPorKm,
}: {
  tarifaBase: string;
  tarifaPorKm: string;
}) {
  const originId = useId();
  const destId = useId();
  const apiKeyId = useId();
  const simulationId = useId();

  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [multiplicadorPico, setMultiplicadorPico] = useState("");
  const [multiplicadorDemanda, setMultiplicadorDemanda] = useState("");
  const [peakSchedule, setPeakSchedule] =
    useState<PeakDaySchedule[]>(DEFAULT_PEAK_SCHEDULE);
  const [simulationAtInput, setSimulationAtInput] = useState(() =>
    toDatetimeLocalValue(new Date()),
  );

  const [origin, setOrigin] = useState<SelectedPlace | null>(null);
  const [destination, setDestination] = useState<SelectedPlace | null>(null);
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");

  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState<string | null>(null);

  const simulationAt = useMemo(
    () => parseDatetimeLocalValue(simulationAtInput) ?? new Date(),
    [simulationAtInput],
  );

  const fetchRouteDistance = useCallback(async () => {
    if (!origin || !destination || !apiKey.trim()) {
      setDistanceKm(null);
      setDistanceLoading(false);
      setDistanceError(null);
      return;
    }

    setDistanceLoading(true);
    setDistanceError(null);

    try {
      const params = new URLSearchParams({
        origin: `${origin.lat},${origin.lng}`,
        destination: `${destination.lat},${destination.lng}`,
        key: apiKey.trim(),
      });
      const res = await fetch(`/api/places/directions?${params}`);
      const data = await res.json();

      if (data.status === "OK" && data.routes?.[0]?.legs?.[0]?.distance?.value) {
        const meters = data.routes[0].legs[0].distance.value as number;
        setDistanceKm(Math.round((meters / 1000) * 10) / 10);
      } else {
        setDistanceKm(null);
        setDistanceError(
          directionsErrorMessage(data.status, data.error_message),
        );
      }
    } catch {
      setDistanceKm(null);
      setDistanceError("Erro ao calcular a rota. Tente novamente.");
    } finally {
      setDistanceLoading(false);
    }
  }, [origin, destination, apiKey]);

  useEffect(() => {
    void fetchRouteDistance();
  }, [fetchRouteDistance]);

  const priceBreakdown = useMemo(() => {
    if (distanceKm === null) return null;

    return calculateRidePrice({
      tarifaBase: parseKzInput(tarifaBase),
      tarifaPorKm: parseKzInput(tarifaPorKm),
      multiplicadorPicoKm: parseKzInput(multiplicadorPico),
      multiplicadorDemandaKm: parseKzInput(multiplicadorDemanda),
      distanceKm,
      simulationAt,
      peakSchedule,
    });
  }, [
    distanceKm,
    tarifaBase,
    tarifaPorKm,
    multiplicadorPico,
    multiplicadorDemanda,
    simulationAt,
    peakSchedule,
  ]);

  const perKm = parseKzInput(tarifaPorKm);
  const picoKm = parseKzInput(multiplicadorPico);
  const demandaKm = parseKzInput(multiplicadorDemanda);
  const canEstimate = Boolean(origin && destination && priceBreakdown);

  const simulationWeekday = WEEKDAY_LABELS[simulationAt.getDay()];

  return (
    <section className="overflow-hidden rounded-2xl border border-pika-border bg-pika-card shadow-sm">
      <div className="border-b border-pika-border bg-gradient-to-r from-pika-primary/10 via-white to-orange-50/80 px-5 py-5 md:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pika-primary text-white shadow-sm">
              <FontAwesomeIcon icon={faCalculator} className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-pika-ink md:text-lg">
                Simulador de Preço
              </h2>
              <p className="mt-1 max-w-xl text-sm text-pika-muted">
                Estime corridas com tarifa base, km, pico e demanda conforme o
                dia e hora da simulação.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-pika-border bg-pika-card/90 px-3 py-2 text-xs text-pika-muted shadow-sm">
            <span className="font-semibold text-pika-ink">Fórmula</span>
            <p className="mt-1 font-mono text-[11px] leading-relaxed text-pika-ink/90">
              Base + (tarifa/km × km) + (pico/km × km)* + (demanda/km × km)†
            </p>
            <p className="mt-1 text-[10px] leading-snug">
              * se horário de pico · † se demanda &gt; 0
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        <div className="flex flex-col gap-4 rounded-xl border border-dashed border-pika-border bg-pika-page/60 p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label
              htmlFor={apiKeyId}
              className="inline-flex items-center gap-2 text-sm font-semibold text-pika-ink"
            >
              <FontAwesomeIcon icon={faKey} className="h-3.5 w-3.5 text-pika-muted" />
              Chave da API Google
            </label>
            <input
              id={apiKeyId}
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className={inputClass("mt-1.5 font-mono text-xs sm:text-sm")}
              spellCheck={false}
            />
          </div>
          <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 sm:self-end">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
              Pesquisa restrita a
            </p>
            <p className="mt-0.5 text-sm font-bold text-emerald-900">Angola (ao)</p>
          </div>
        </div>

        <div className="grid gap-4 rounded-xl border border-pika-border bg-pika-page/40 p-4 md:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-pika-ink">
              Multiplicador horário de pico (Kz/km)
            </label>
            <p className="mt-0.5 text-xs text-pika-muted">
              Soma ao preço quando a simulação cair num horário de pico
            </p>
            <input
              type="text"
              placeholder="0"
              value={multiplicadorPico}
              onChange={(e) => setMultiplicadorPico(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-pika-ink">
              Multiplicador de demanda (Kz/km)
            </label>
            <p className="mt-0.5 text-xs text-pika-muted">
              Valor extra por km; ignorado se for zero ou negativo
            </p>
            <input
              type="text"
              placeholder="0"
              value={multiplicadorDemanda}
              onChange={(e) => setMultiplicadorDemanda(e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label
              htmlFor={simulationId}
              className="inline-flex items-center gap-2 text-sm font-semibold text-pika-ink"
            >
              <FontAwesomeIcon icon={faClock} className="h-3.5 w-3.5 text-pika-muted" />
              Data e hora da simulação
            </label>
            <p className="mt-0.5 text-xs text-pika-muted">
              Define o dia da semana e se está em pico
            </p>
            <input
              id={simulationId}
              type="datetime-local"
              value={simulationAtInput}
              onChange={(e) => setSimulationAtInput(e.target.value)}
              className={inputClass()}
            />
            {priceBreakdown ? (
              <p
                className={cn(
                  "mt-2 text-xs font-medium",
                  priceBreakdown.isPeak ? "text-orange-700" : "text-pika-muted",
                )}
              >
                {simulationWeekday}
                {priceBreakdown.isPeak
                  ? " · em horário de pico"
                  : " · fora do horário de pico"}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-pika-ink">
            Horários de pico por dia da semana
          </h3>
          <p className="mt-1 text-xs text-pika-muted">
            Defina início e fim do pico para cada dia. Deixe vazio para dias sem
            pico. Intervalos noturnos (ex.: 22:00–06:00) são suportados.
          </p>
          <div className="mt-3">
            <PeakScheduleEditor
              schedule={peakSchedule}
              onChange={setPeakSchedule}
            />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <PlaceAutocomplete
            id={originId}
            label="Origem"
            hint="Pesquise e selecione o ponto de partida"
            accent="origin"
            value={origin}
            query={originQuery}
            onQueryChange={setOriginQuery}
            onSelect={setOrigin}
            onClear={() => setOrigin(null)}
            apiKey={apiKey}
          />
          <PlaceAutocomplete
            id={destId}
            label="Destino"
            hint="Pesquise e selecione o ponto de chegada"
            accent="destination"
            value={destination}
            query={destQuery}
            onQueryChange={setDestQuery}
            onSelect={setDestination}
            onClear={() => setDestination(null)}
            apiKey={apiKey}
          />
        </div>

        {origin || destination ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-pika-ink">
            <span className="max-w-[40%] truncate font-medium text-emerald-700">
              {origin?.label ?? "—"}
            </span>
            <FontAwesomeIcon
              icon={faArrowRight}
              className="h-3.5 w-3.5 shrink-0 text-pika-muted"
            />
            <span className="max-w-[40%] truncate font-medium text-orange-700">
              {destination?.label ?? "—"}
            </span>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-5">
          <div className="flex items-center gap-3 rounded-xl border border-pika-border bg-pika-page/50 p-4 lg:col-span-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pika-card text-pika-primary shadow-sm">
              <FontAwesomeIcon icon={faRoute} className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Distância da rota
              </p>
              {distanceLoading ? (
                <p className="mt-1 flex items-center gap-2 text-lg font-bold text-pika-ink">
                  <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                  A calcular…
                </p>
              ) : distanceKm !== null ? (
                <p className="mt-1 text-2xl font-bold text-pika-ink">
                  {distanceKm.toLocaleString("pt-AO")}{" "}
                  <span className="text-base font-semibold text-pika-muted">km</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-pika-muted">
                  Selecione origem e destino
                </p>
              )}
              {distanceError ? (
                <p className="mt-1 text-xs text-red-600">{distanceError}</p>
              ) : null}
            </div>
          </div>

          <div
            className={cn(
              "rounded-xl border-2 p-4 lg:col-span-3",
              canEstimate
                ? "border-pika-primary/30 bg-gradient-to-br from-pika-primary/5 to-white"
                : "border-pika-border bg-slate-50/80",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Preço estimado da corrida
            </p>

            {canEstimate && priceBreakdown ? (
              <>
                <p className="mt-2 text-3xl font-bold text-pika-primary md:text-4xl">
                  {formatKz(priceBreakdown.total)}
                </p>
                <ul className="mt-4 space-y-2 border-t border-pika-border/80 pt-4 text-sm">
                  <li className="flex justify-between gap-4">
                    <span className="text-pika-muted">Tarifa base</span>
                    <span className="font-semibold text-pika-ink">
                      {formatKz(priceBreakdown.base)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-4">
                    <span className="text-pika-muted">
                      {distanceKm} km × {formatKz(perKm)}/km
                    </span>
                    <span className="font-semibold text-pika-ink">
                      {formatKz(priceBreakdown.distancePart)}
                    </span>
                  </li>
                  {priceBreakdown.peakPart > 0 ? (
                    <li className="flex justify-between gap-4 text-orange-800">
                      <span>
                        Horário de pico · {distanceKm} km × {formatKz(picoKm)}/km
                      </span>
                      <span className="font-semibold">
                        {formatKz(priceBreakdown.peakPart)}
                      </span>
                    </li>
                  ) : null}
                  {priceBreakdown.demandPart > 0 ? (
                    <li className="flex justify-between gap-4 text-violet-800">
                      <span>
                        Demanda · {distanceKm} km × {formatKz(demandaKm)}/km
                      </span>
                      <span className="font-semibold">
                        {formatKz(priceBreakdown.demandPart)}
                      </span>
                    </li>
                  ) : null}
                  <li className="flex justify-between gap-4 border-t border-pika-border pt-2 font-bold text-pika-ink">
                    <span>Total</span>
                    <span>{formatKz(priceBreakdown.total)}</span>
                  </li>
                </ul>
              </>
            ) : (
              <p className="mt-3 text-sm text-pika-muted">
                Preencha as tarifas, escolha origem e destino para ver o valor
                estimado.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

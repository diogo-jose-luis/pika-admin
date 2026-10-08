"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { DEFAULT_MAP_ZOOM, LUANDA_CENTER, type LiveMapLatLng } from "@/lib/live-map";
import { RIDE_TRACKING_REFRESH_MS, type RideTracking } from "@/lib/ride-tracking";
import "leaflet/dist/leaflet.css";

const GOOGLE_TILES_URL =
  "https://{s}.google.com/vt/lyrs=m&hl=pt-PT&x={x}&y={y}&z={z}";
const GOOGLE_SUBDOMAINS = ["mt0", "mt1", "mt2", "mt3"];
const CAR_SIZE = 44;
/** Abaixo desta distância (graus) não se recalcula o rumo — evita giros com ruído do GPS. */
const MIN_HEADING_DELTA = 0.00002;

type RideTrackingMapProps = {
  tracking: RideTracking;
  follow: boolean;
};

function pinIcon(color: string, glyph: string) {
  return L.divIcon({
    className: "pika-leaflet-marker",
    html: `<span style="display:flex;width:30px;height:30px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.28);align-items:center;justify-content:center;font-size:14px;line-height:1">${glyph}</span>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function carIcon() {
  return L.divIcon({
    className: "pika-leaflet-marker",
    html: `<img src="/vehicles/pika-car-map-v2-transparent.png" alt="" draggable="false" style="width:${CAR_SIZE}px;height:${CAR_SIZE}px;transition:transform .4s linear;filter:drop-shadow(0 3px 4px rgba(0,0,0,.35));" />`,
    iconSize: [CAR_SIZE, CAR_SIZE],
    iconAnchor: [CAR_SIZE / 2, CAR_SIZE / 2],
  });
}

function bearingDegrees(from: LiveMapLatLng, to: LiveMapLatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const φ1 = toRad(from.lat);
  const φ2 = toRad(to.lat);
  const Δλ = toRad(to.lng - from.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Marcador do motorista com deslocação suave entre atualizações e rotação pelo rumo. */
function DriverMarker({
  position,
  label,
}: {
  position: LiveMapLatLng;
  label: string;
}) {
  const icon = useMemo(() => carIcon(), []);
  const markerRef = useRef<L.Marker | null>(null);
  const currentRef = useRef<LiveMapLatLng>(position);
  const headingRef = useRef(0);
  const initialRef = useRef(position);

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const from = currentRef.current;
    const to = position;
    const dLat = to.lat - from.lat;
    const dLng = to.lng - from.lng;

    if (Math.abs(dLat) > MIN_HEADING_DELTA || Math.abs(dLng) > MIN_HEADING_DELTA) {
      headingRef.current = bearingDegrees(from, to);
      const img = marker.getElement()?.querySelector("img");
      if (img) img.style.transform = `rotate(${headingRef.current}deg)`;
    }

    const duration = RIDE_TRACKING_REFRESH_MS * 0.9;
    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const next = { lat: from.lat + dLat * t, lng: from.lng + dLng * t };
      currentRef.current = next;
      marker.setLatLng([next.lat, next.lng]);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frame);
  }, [position]);

  return (
    <Marker
      ref={markerRef}
      position={[initialRef.current.lat, initialRef.current.lng]}
      icon={icon}
      zIndexOffset={1000}
    >
      <Tooltip direction="top" offset={[0, -CAR_SIZE / 2]}>
        {label}
      </Tooltip>
    </Marker>
  );
}

function MapViewport({
  tracking,
  follow,
}: {
  tracking: RideTracking;
  follow: boolean;
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (fittedRef.current) return;
    const points: [number, number][] = [
      tracking.driverLocation,
      tracking.origin,
      tracking.destination,
      ...tracking.route,
    ]
      .filter((p): p is LiveMapLatLng => p != null)
      .map((p) => [p.lat, p.lng]);

    if (points.length === 0) return;
    if (points.length === 1) map.setView(points[0]!, 15);
    else map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 16 });
    fittedRef.current = true;
  }, [map, tracking]);

  const driverLat = tracking.driverLocation?.lat;
  const driverLng = tracking.driverLocation?.lng;

  useEffect(() => {
    if (!follow || driverLat == null || driverLng == null) return;
    map.panTo([driverLat, driverLng], { animate: true, duration: 1 });
  }, [map, follow, driverLat, driverLng]);

  return null;
}

export function RideTrackingMap({ tracking, follow }: RideTrackingMapProps) {
  const originIcon = useMemo(() => pinIcon("#0d9488", "📍"), []);
  const destinationIcon = useMemo(() => pinIcon("#ef4444", "🏁"), []);

  const target = tracking.driverArrived ? tracking.destination : tracking.origin;
  const fallbackLine =
    tracking.route.length < 2 && tracking.driverLocation && target
      ? [tracking.driverLocation, target]
      : null;

  return (
    <MapContainer
      center={[LUANDA_CENTER.lat, LUANDA_CENTER.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      className="h-full w-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution="&copy; Google Maps"
        url={GOOGLE_TILES_URL}
        subdomains={GOOGLE_SUBDOMAINS}
        maxZoom={20}
      />
      <MapViewport tracking={tracking} follow={follow} />

      {tracking.route.length >= 2 ? (
        <>
          <Polyline
            positions={tracking.route.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#1e3a8a", weight: 8, opacity: 0.35 }}
          />
          <Polyline
            positions={tracking.route.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: "#2563eb", weight: 5, opacity: 0.95 }}
          />
        </>
      ) : null}

      {fallbackLine ? (
        <Polyline
          positions={fallbackLine.map((p) => [p.lat, p.lng])}
          pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.8, dashArray: "8 8" }}
        />
      ) : null}

      {tracking.origin ? (
        <Marker position={[tracking.origin.lat, tracking.origin.lng]} icon={originIcon}>
          <Tooltip direction="top" offset={[0, -15]}>
            {tracking.originLabel}
          </Tooltip>
        </Marker>
      ) : null}

      {tracking.destination ? (
        <Marker
          position={[tracking.destination.lat, tracking.destination.lng]}
          icon={destinationIcon}
        >
          <Tooltip direction="top" offset={[0, -15]}>
            {tracking.destinationLabel}
          </Tooltip>
        </Marker>
      ) : null}

      {tracking.driverLocation ? (
        <DriverMarker position={tracking.driverLocation} label={tracking.driver} />
      ) : null}
    </MapContainer>
  );
}

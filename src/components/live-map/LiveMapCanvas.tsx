"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import type {
  LiveMapActiveRide,
  LiveMapDriver,
} from "@/lib/live-map";
import { DEFAULT_MAP_ZOOM, LUANDA_CENTER } from "@/lib/live-map";
import "leaflet/dist/leaflet.css";

type MapFilters = {
  corridasAtivas: boolean;
  motoristasOnline: boolean;
};

type LiveMapCanvasProps = {
  drivers: LiveMapDriver[];
  rides: LiveMapActiveRide[];
  filters: MapFilters;
};

function createMarkerIcon(color: string) {
  return L.divIcon({
    className: "pika-leaflet-marker",
    html: `<span style="display:flex;width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.28);align-items:center;justify-content:center;font-size:15px;line-height:1">🚗</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function createDriverIcon(color: string, name: string) {
  const safeName = escapeHtml(name);
  return L.divIcon({
    className: "pika-leaflet-marker",
    html: `<div style="display:flex;flex-direction:column;align-items:center;">
      <span style="display:flex;width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.28);align-items:center;justify-content:center;font-size:15px;line-height:1">🚗</span>
      <span style="margin-top:3px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#fff;color:#111827;font-size:11px;font-weight:600;padding:1px 7px;border-radius:9px;box-shadow:0 1px 4px rgba(0,0,0,.25);">${safeName}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
}

function FitBounds({
  drivers,
  rides,
}: {
  drivers: LiveMapDriver[];
  rides: LiveMapActiveRide[];
}) {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (fittedRef.current) return;

    const points: [number, number][] = [
      ...drivers.map((d) => [d.lat, d.lng] as [number, number]),
      ...rides.map((r) => [r.lat, r.lng] as [number, number]),
    ];

    if (points.length === 0) {
      map.setView([LUANDA_CENTER.lat, LUANDA_CENTER.lng], DEFAULT_MAP_ZOOM);
      return;
    }
    if (points.length === 1) {
      map.setView(points[0]!, 14);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 15 });
    }
    fittedRef.current = true;
  }, [map, drivers, rides]);

  return null;
}

export function LiveMapCanvas({ drivers, rides, filters }: LiveMapCanvasProps) {
  const rideIcon = useMemo(() => createMarkerIcon("#0d9488"), []);

  const visibleDrivers = filters.motoristasOnline ? drivers : [];
  const visibleRides = filters.corridasAtivas ? rides : [];

  return (
    <MapContainer
      center={[LUANDA_CENTER.lat, LUANDA_CENTER.lng]}
      zoom={DEFAULT_MAP_ZOOM}
      className="h-full w-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds drivers={visibleDrivers} rides={visibleRides} />

      {visibleDrivers.map((driver) => (
        <Marker
          key={`driver-${driver.id}`}
          position={[driver.lat, driver.lng]}
          icon={createDriverIcon("#22c55e", driver.name)}
        >
          <Tooltip direction="top" offset={[0, -16]}>
            {driver.name}
          </Tooltip>
          <Popup>
            <div className="min-w-[140px] text-sm">
              <p className="font-bold text-neutral-900">{driver.name}</p>
              <p className="mt-1 text-xs text-neutral-600">Motorista online</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {visibleRides.map((ride) => (
        <Marker
          key={`ride-${ride.id}`}
          position={[ride.lat, ride.lng]}
          icon={rideIcon}
        >
          <Popup>
            <div className="min-w-[180px] text-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
                Corrida em andamento
              </p>
              <p className="mt-1 font-bold text-neutral-900">{ride.driver}</p>
              <p className="text-xs text-neutral-600">{ride.passenger}</p>
              <p className="mt-2 text-xs text-neutral-800">{ride.route}</p>
              {ride.eta !== "—" ? (
                <p className="mt-1 text-xs font-semibold text-teal-700">
                  ETA: {ride.eta}
                </p>
              ) : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

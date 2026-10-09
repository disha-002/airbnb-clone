"use client";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { Circle, MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet";
import { HomePinGlyph } from "./WizardIcons";

const INDIA: [number, number] = [22.5, 79];

/** Moves the map when a new address is picked, and reports the centre when the host drags it. */
function Sync({ lat, lng, zoom, onMove }: { lat: number | null; lng: number | null; zoom: number; onMove?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (lat === null || lng === null) return;
    const c = map.getCenter();
    if (Math.abs(c.lat - lat) > 1e-6 || Math.abs(c.lng - lng) > 1e-6) map.setView([lat, lng], Math.max(map.getZoom(), zoom));
  }, [lat, lng, zoom, map]);
  useEffect(() => { if (lat !== null) map.setZoom(zoom); }, [zoom]); // eslint-disable-line react-hooks/exhaustive-deps -- zoom out for "approximate"
  useMapEvents({
    moveend: () => {
      if (!onMove || lat === null) return;
      const c = map.getCenter();
      onMove(Number(c.lat.toFixed(6)), Number(c.lng.toFixed(6)));
    },
  });
  return null;
}

/**
 * Airbnb's "Is the pin in the right spot?" map: the pin stays in the middle and the host drags the
 * map underneath it. With `precise` off it shows a shaded area instead of the exact spot.
 */
export default function PinMap({
  lat, lng, precise = true, onMove, children, hint = false, interactive = true,
}: {
  lat: number | null; lng: number | null; precise?: boolean; onMove?: (lat: number, lng: number) => void;
  children?: React.ReactNode; hint?: boolean; interactive?: boolean;
}) {
  const has = lat !== null && lng !== null;
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-soft">
      <MapContainer center={has ? [lat, lng] : INDIA} zoom={has ? 16 : 4} zoomControl={false} scrollWheelZoom={interactive} inertiaMaxSpeed={1500}
        dragging={interactive} doubleClickZoom={interactive} touchZoom={interactive} className="h-full w-full">
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {interactive && <ZoomControl position="bottomleft" />}
        <Sync lat={lat} lng={lng} zoom={precise ? 16 : 14} onMove={onMove} />
        {has && !precise && <Circle center={[lat, lng]} radius={400} pathOptions={{ color: "#ff385c", weight: 2, fillColor: "#ff385c", fillOpacity: 0.15 }} />}
      </MapContainer>

      {has && precise && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] flex -translate-x-1/2 -translate-y-full flex-col items-center">
          <span className="flex h-12 w-12 animate-[drop_.35s_ease-out] items-center justify-center rounded-full bg-[#222] text-white shadow-lg">
            <HomePinGlyph />
          </span>
          <span className="-mt-1 h-0 w-0 border-x-[7px] border-t-[8px] border-x-transparent border-t-[#222]" />
        </div>
      )}
      {has && !precise && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[500] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#222] text-white shadow-lg">
          <HomePinGlyph />
        </span>
      )}
      {has && hint && (
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-[500] mt-5 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#222] px-4 py-2 text-sm font-semibold text-white">
          Drag the map to reposition the pin
        </span>
      )}
      {children}
    </div>
  );
}

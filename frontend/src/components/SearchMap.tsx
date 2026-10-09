"use client";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { money } from "@/lib/format";
import type { ListingCardData } from "@/lib/types";
import { StarIcon } from "./icons";

const INDIA: L.LatLngTuple = [22.5, 79];

/** Airbnb-style price pill used as the marker. */
function pricePin(label: string, active: boolean) {
  return L.divIcon({
    className: "", // drop Leaflet's default white square
    html: `<span class="price-pin${active ? " price-pin--active" : ""}">${label}</span>`,
    iconSize: [0, 0], // the pill centres itself with CSS
  });
}

/** Zoom to fit the current results whenever the set of listings changes. */
function FitToListings({ listings }: { listings: ListingCardData[] }) {
  const map = useMap();
  const key = listings.map((l) => l.id).join(",");
  useEffect(() => {
    if (!listings.length) return;
    const bounds = L.latLngBounds(listings.map((l) => [l.lat, l.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 13 });
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function CloseOnMapClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

export default function SearchMap({
  listings, nights, hoveredId,
}: {
  listings: ListingCardData[]; nights: number; hoveredId: number | null;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = listings.find((l) => l.id === selectedId) ?? null;
  useEffect(() => setSelectedId(null), [listings]);

  const pins = useMemo(
    () => listings.map((l) => ({ l, label: money(l.price_per_night * nights) })),
    [listings, nights],
  );

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl">
      <MapContainer center={INDIA} zoom={5} scrollWheelZoom className="h-full w-full" zoomControl={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <FitToListings listings={listings} />
        <CloseOnMapClick onClick={() => setSelectedId(null)} />
        {pins.map(({ l, label }) => {
          const active = l.id === hoveredId || l.id === selectedId;
          return (
            <Marker key={l.id} position={[l.lat, l.lng]} icon={pricePin(label, active)}
              zIndexOffset={active ? 1000 : 0}
              eventHandlers={{ click: () => setSelectedId(l.id) }} />
          );
        })}
      </MapContainer>

      {selected && (
        <Link href={`/listings/${selected.id}`}
          className="absolute bottom-4 left-1/2 z-[500] flex w-[min(340px,calc(100%-32px))] -translate-x-1/2 overflow-hidden rounded-2xl bg-surface shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={selected.cover_url} alt="" className="h-28 w-28 shrink-0 object-cover" />
          <div className="min-w-0 p-3 text-sm">
            <p className="truncate font-semibold">{selected.property_type} in {selected.city}</p>
            <p className="truncate text-muted">{selected.title}</p>
            <p className="mt-1"><span className="font-semibold">{money(selected.price_per_night * nights)}</span> for {nights} night{nights > 1 ? "s" : ""}</p>
            {selected.rating && <p className="mt-0.5 flex items-center gap-1"><StarIcon /> {selected.rating.toFixed(2).replace(/0$/, "")}</p>}
          </div>
        </Link>
      )}
    </div>
  );
}

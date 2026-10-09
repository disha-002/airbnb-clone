"use client";
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { api } from "@/lib/api";

interface Amenity { id: number; name: string }
const TYPES = ["Room", "Flat", "Apartment", "Home", "Villa", "Cabin"];
export const FILTER_KEYS = ["min_price", "max_price", "property_type", "bedrooms", "amenity_ids"];

export default function FiltersModal({
  open, onClose, query, onApply,
}: {
  open: boolean; onClose: () => void; query: string;
  onApply: (next: URLSearchParams) => void;
}) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [minP, setMinP] = useState("");
  const [maxP, setMaxP] = useState("");
  const [type, setType] = useState("");
  const [beds, setBeds] = useState(0);
  const [amen, setAmen] = useState<number[]>([]);

  useEffect(() => { api<Amenity[]>("/amenities").then(setAmenities).catch(() => { }); }, []);

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(query);
    setMinP(params.get("min_price") ?? "");
    setMaxP(params.get("max_price") ?? "");
    setType(params.get("property_type") ?? "");
    setBeds(Number(params.get("bedrooms") ?? 0));
    setAmen(params.getAll("amenity_ids").map(Number));
  }, [open, query]);

  const apply = () => {
    const next = new URLSearchParams(query);
    FILTER_KEYS.forEach((k) => next.delete(k));
    if (minP) next.set("min_price", minP);
    if (maxP) next.set("max_price", maxP);
    if (type) next.set("property_type", type);
    if (beds) next.set("bedrooms", String(beds));
    amen.forEach((id) => next.append("amenity_ids", String(id)));
    onApply(next);
    onClose();
  };

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-medium ${active ? "border-ink bg-soft ring-1 ring-ink" : "border-hairline hover:border-ink"}`;

  return (
    <Modal
      open={open} onClose={onClose} title="Filters"
      footer={
        <>
          <button className="font-semibold underline" onClick={() => { setMinP(""); setMaxP(""); setType(""); setBeds(0); setAmen([]); }}>Clear all</button>
          <button onClick={apply} className="rounded-lg bg-ink px-6 py-3 font-semibold text-white">Show places</button>
        </>
      }
    >
      <h3 className="text-lg font-semibold">Price range</h3>
      <p className="mb-3 text-sm text-muted">Nightly price before fees</p>
      <div className="flex items-center gap-3">
        <label className="flex-1 rounded-xl border border-hairline px-4 py-2">
          <span className="block text-xs text-muted">Minimum</span>
          <input type="number" min={0} value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="₹0" className="w-full outline-none" />
        </label>
        <span>–</span>
        <label className="flex-1 rounded-xl border border-hairline px-4 py-2">
          <span className="block text-xs text-muted">Maximum</span>
          <input type="number" min={0} value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="₹10000+" className="w-full outline-none" />
        </label>
      </div>

      <h3 className="mb-3 mt-8 text-lg font-semibold">Type of place</h3>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setType("")} className={chip(type === "")}>Any</button>
        {TYPES.map((t) => <button key={t} onClick={() => setType(t)} className={chip(type === t)}>{t}</button>)}
      </div>

      <h3 className="mb-3 mt-8 text-lg font-semibold">Bedrooms</h3>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((n) => (
          <button key={n} onClick={() => setBeds(n)} className={chip(beds === n)}>{n === 0 ? "Any" : n === 4 ? "4+" : n}</button>
        ))}
      </div>

      <h3 className="mb-3 mt-8 text-lg font-semibold">Amenities</h3>
      <div className="grid grid-cols-2 gap-3">
        {amenities.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={amen.includes(a.id)}
              onChange={() => setAmen(amen.includes(a.id) ? amen.filter((x) => x !== a.id) : [...amen, a.id])} />
            {a.name}
          </label>
        ))}
      </div>
    </Modal>
  );
}

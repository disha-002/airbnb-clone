"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, uploadImage } from "@/lib/api";
import type { Amenity } from "@/lib/types";
import { useToast } from "@/context/ToastContext";

const TYPES = ["Room", "Flat", "Apartment", "Home", "Villa", "Cabin"];
const CATEGORIES = ["Trending", "Beachfront", "Cabins", "Amazing views", "Design", "Tropical", "Iconic cities"];
const COORDS: Record<string, [number, number]> = {
  goa: [15.5, 73.83], manali: [32.24, 77.19], shimla: [31.1, 77.17], mumbai: [19.08, 72.88],
  "new delhi": [28.61, 77.21], jaipur: [26.91, 75.79], udaipur: [24.58, 73.71], rishikesh: [30.09, 78.27],
  munnar: [10.09, 77.06], bengaluru: [12.97, 77.59], mussoorie: [30.46, 78.07], chandigarh: [30.73, 76.78],
};

export interface ListingFormValues {
  title: string; description: string; property_type: string; category: string;
  city: string; country: string; lat: string; lng: string;
  price_per_night: string; cleaning_fee: string;
  max_guests: number; bedrooms: number; beds: number; bathrooms: number;
  photo_urls: string[]; amenity_ids: number[];
}

export const EMPTY_LISTING: ListingFormValues = {
  title: "", description: "", property_type: "House", category: "Trending",
  city: "", country: "", lat: "", lng: "", price_per_night: "", cleaning_fee: "0",
  max_guests: 2, bedrooms: 1, beds: 1, bathrooms: 1, photo_urls: [""], amenity_ids: [],
};

const field = "w-full rounded-xl border border-hairline px-4 py-3 outline-none focus:border-ink";

function Counter({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span>{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className="h-8 w-8 rounded-full border border-muted disabled:opacity-30">−</button>
        <span className="w-5 text-center">{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-full border border-muted">+</button>
      </div>
    </div>
  );
}

/* eslint-disable @next/next/no-img-element */
export default function ListingForm({
  initial = EMPTY_LISTING, listingId,
}: { initial?: ListingFormValues; listingId?: number }) {
  const router = useRouter();
  const toast = useToast();
  const [v, setV] = useState<ListingFormValues>(initial);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { api<Amenity[]>("/amenities").then(setAmenities).catch(() => { }); }, []);

  const set = <K extends keyof ListingFormValues>(k: K, val: ListingFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const setCity = (city: string) => {
    const known = COORDS[city.trim().toLowerCase()];
    setV((p) => ({ ...p, city, ...(known && !p.lat && !p.lng ? { lat: String(known[0]), lng: String(known[1]) } : {}) }));
  };

  const setPhoto = (i: number, url: string) => set("photo_urls", v.photo_urls.map((u, j) => (j === i ? url : u)));

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all([...files].map(uploadImage));
      set("photo_urls", [...v.photo_urls.filter(Boolean), ...urls]);
    } catch (e) { toast((e as Error).message); }
    setUploading(false);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (v.title.trim().length < 3) e.title = "Give your place a title (at least 3 characters)";
    if (!v.description.trim()) e.description = "Add a description";
    if (!v.city.trim()) e.city = "City is required";
    if (!v.country.trim()) e.country = "Country is required";
    if (!(Number(v.price_per_night) > 0)) e.price = "Enter a nightly price above 0";
    if (v.cleaning_fee && Number(v.cleaning_fee) < 0) e.cleaning = "Cleaning fee can’t be negative";
    if (!v.photo_urls.some((u) => u.trim())) e.photos = "Add at least one photo";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) { toast("Please fix the highlighted fields"); return; }
    setSaving(true); setApiError(null);
    const body = {
      title: v.title.trim(), description: v.description.trim(),
      property_type: v.property_type, category: v.category,
      city: v.city.trim(), country: v.country.trim(),
      lat: Number(v.lat) || 0, lng: Number(v.lng) || 0,
      price_per_night: Math.round(Number(v.price_per_night)), cleaning_fee: Math.round(Number(v.cleaning_fee) || 0),
      max_guests: v.max_guests, bedrooms: v.bedrooms, beds: v.beds, bathrooms: v.bathrooms,
      photo_urls: v.photo_urls.map((u) => u.trim()).filter(Boolean), amenity_ids: v.amenity_ids,
    };
    try {
      await api(listingId ? `/host/listings/${listingId}` : "/host/listings", { method: listingId ? "PUT" : "POST", body: JSON.stringify(body) });
      toast(listingId ? "Listing updated" : "Listing published");
      router.push("/host");
    } catch (e) { setApiError((e as Error).message); setSaving(false); }
  };

  const err = (k: string) => errors[k] && <p className="mt-1 text-sm text-rausch">{errors[k]}</p>;
  const label = "mb-1 block text-sm font-semibold";

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl px-5 pb-20 md:px-0">
      <h1 className="mb-8 text-[28px] font-semibold">{listingId ? "Edit your listing" : "Create a new listing"}</h1>

      <section className="space-y-5">
        <div><label className={label}>Title</label><input className={field} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Sunny loft near the old town" />{err("title")}</div>
        <div><label className={label}>Description</label><textarea rows={5} className={field} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="Tell guests what makes your place special" />{err("description")}</div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Type of place</label><select className={field} value={v.property_type} onChange={(e) => set("property_type", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div><label className={label}>Category</label><select className={field} value={v.category} onChange={(e) => set("category", e.target.value)}>{CATEGORIES.map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
      </section>

      <hr className="my-8 border-hairline" />
      <h2 className="mb-4 text-[22px] font-semibold">Location</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>City</label><input className={field} value={v.city} onChange={(e) => setCity(e.target.value)} />{err("city")}</div>
        <div><label className={label}>Country</label><input className={field} value={v.country} onChange={(e) => set("country", e.target.value)} />{err("country")}</div>
        <div><label className={label}>Latitude (optional)</label><input type="number" step="any" className={field} value={v.lat} onChange={(e) => set("lat", e.target.value)} /></div>
        <div><label className={label}>Longitude (optional)</label><input type="number" step="any" className={field} value={v.lng} onChange={(e) => set("lng", e.target.value)} /></div>
      </div>

      <hr className="my-8 border-hairline" />
      <h2 className="mb-4 text-[22px] font-semibold">Pricing</h2>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>Price per night (₹)</label><input type="number" min={1} className={field} value={v.price_per_night} onChange={(e) => set("price_per_night", e.target.value)} />{err("price")}</div>
        <div><label className={label}>Cleaning fee (₹)</label><input type="number" min={0} className={field} value={v.cleaning_fee} onChange={(e) => set("cleaning_fee", e.target.value)} />{err("cleaning")}</div>
      </div>

      <hr className="my-8 border-hairline" />
      <h2 className="mb-2 text-[22px] font-semibold">Basics</h2>
      <Counter label="Guests" value={v.max_guests} min={1} onChange={(n) => set("max_guests", n)} />
      <Counter label="Bedrooms" value={v.bedrooms} min={0} onChange={(n) => set("bedrooms", n)} />
      <Counter label="Beds" value={v.beds} min={1} onChange={(n) => set("beds", n)} />
      <Counter label="Bathrooms" value={v.bathrooms} min={0} onChange={(n) => set("bathrooms", n)} />

      <hr className="my-8 border-hairline" />
      <h2 className="mb-4 text-[22px] font-semibold">Amenities</h2>
      <div className="grid grid-cols-2 gap-3">
        {amenities.map((a) => (
          <label key={a.id} className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" className="h-5 w-5 accent-ink" checked={v.amenity_ids.includes(a.id)}
              onChange={() => set("amenity_ids", v.amenity_ids.includes(a.id) ? v.amenity_ids.filter((x) => x !== a.id) : [...v.amenity_ids, a.id])} />
            {a.name}
          </label>
        ))}
      </div>

      <hr className="my-8 border-hairline" />
      <h2 className="mb-1 text-[22px] font-semibold">Photos</h2>
      <p className="mb-4 text-sm text-muted">The first photo is the cover. Paste image URLs or upload files (JPEG/PNG/WebP, up to 5 MB).</p>
      <div className="space-y-3">
        {v.photo_urls.map((u, i) => (
          <div key={i} className="flex items-center gap-3">
            {u ? <img src={u} alt="" className="h-12 w-16 rounded-lg bg-soft object-cover" /> : <div className="h-12 w-16 rounded-lg bg-soft" />}
            <input className={field} value={u} onChange={(e) => setPhoto(i, e.target.value)} placeholder="https://…" />
            <button type="button" aria-label="Remove photo" onClick={() => set("photo_urls", v.photo_urls.filter((_, j) => j !== i))} className="px-2 text-xl text-muted">×</button>
          </div>
        ))}
      </div>
      {err("photos")}
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" onClick={() => set("photo_urls", [...v.photo_urls, ""])} className="rounded-lg border border-ink px-4 py-2 text-sm font-semibold">Add photo URL</button>
        <label className="cursor-pointer rounded-lg border border-ink px-4 py-2 text-sm font-semibold">
          {uploading ? "Uploading…" : "Upload images"}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </label>
      </div>

      {apiError && <p className="mt-8 rounded-lg bg-rausch/10 p-3 text-sm font-medium text-rausch">{apiError}</p>}
      <div className="mt-8 flex gap-3">
        <button disabled={saving || uploading} className="rounded-xl bg-ink px-8 py-3.5 font-semibold text-surface disabled:opacity-50">{saving ? "Saving…" : listingId ? "Save changes" : "Publish listing"}</button>
        <button type="button" onClick={() => router.push("/host")} className="rounded-xl px-6 py-3.5 font-semibold underline">Cancel</button>
      </div>
    </form>
  );
}

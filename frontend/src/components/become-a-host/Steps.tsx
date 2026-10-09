"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, uploadImage } from "@/lib/api";
import { money } from "@/lib/format";
import {
  DESCRIPTION_MAX, MIN_PHOTOS, ROOM_TYPES, STEPS, STRUCTURES, TITLE_MAX, blockingIssue,
  type DraftPatch, type HostDraft, type Place,
} from "@/lib/hostWizard";
import type { Amenity } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { AMENITY_LABEL, AmenityIcon } from "../ListingIcons";
import AddressSearch from "./AddressSearch";
import IsoHouse from "./IsoHouse";
import { RoomTypeIcon, StructureIcon } from "./WizardIcons";

// Leaflet touches `window`, so the map only renders in the browser.
const PinMap = dynamic(() => import("./PinMap"), { ssr: false, loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-soft" /> });

export interface StepProps {
  draft: HostDraft;
  update: (patch: DraftPatch) => void;
  setBusy: (busy: boolean) => void;
}

const wrap = "mx-auto w-full max-w-[640px] px-6 pb-16 pt-6 md:pt-10";
const h1 = "text-[26px] font-semibold leading-[30px] tracking-tight md:text-[32px] md:leading-[36px]";
const sub = "mt-2 text-base leading-6 text-muted md:text-lg";
/** Selected cards get a 2px ring instead of a thicker border, so the layout doesn't shift. */
const card = (on: boolean) =>
  `rounded-xl border text-left transition active:scale-[0.97] ${on ? "border-transparent bg-soft shadow-[0_0_0_2px_rgb(var(--ink))]" : "border-hairline hover:shadow-[0_0_0_1px_rgb(var(--ink))]"}`;

/* ---------- Step 1 / 2 / 3 intro pages ---------- */

const INTROS = {
  "about-your-place": { n: 1, level: 1, title: "Tell us about your place", text: "In this step, we’ll ask you which type of property you have and if guests will book the entire place or just a room. Then let us know the location and how many guests can stay." },
  "stand-out": { n: 2, level: 2, title: "Make your place stand out", text: `In this step, you’ll add some of the amenities your place offers, plus ${MIN_PHOTOS} or more photos. Then you’ll create a title and description.` },
  "finish-setup": { n: 3, level: 3, title: "Finish up and publish", text: "Finally, you’ll set your nightly price and choose whether to start with a special offer. Answer a few quick questions and publish when you’re ready." },
} as const;

export function Intro({ slug }: { slug: keyof typeof INTROS }) {
  const s = INTROS[slug];
  return (
    <div className="mx-auto grid min-h-full max-w-[1280px] items-center gap-6 px-6 py-8 md:grid-cols-2 md:gap-12 md:px-16">
      <div className="order-2 md:order-1">
        <p className="text-lg font-semibold">Step {s.n}</p>
        <h1 className="mt-3 text-[36px] font-semibold leading-[40px] tracking-tight md:mt-4 md:text-[48px] md:leading-[54px]">{s.title}</h1>
        <p className="mt-4 text-lg leading-7 md:mt-6">{s.text}</p>
      </div>
      <IsoHouse key={slug} level={s.level} className="order-1 mx-auto w-full max-w-[560px] md:order-2" />
    </div>
  );
}

/* ---------- Phase 1 ---------- */

export function Structure({ draft, update }: StepProps) {
  return (
    <div className={wrap}>
      <h1 className={`${h1} text-center`}>Which of these best describes your place?</h1>
      <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4" role="radiogroup" aria-label="Property type">
        {STRUCTURES.map((s) => (
          <button key={s} type="button" role="radio" aria-checked={draft.structure === s} onClick={() => update({ structure: s })}
            className={`flex min-h-[96px] flex-col justify-between gap-2 p-4 ${card(draft.structure === s)}`}>
            <StructureIcon name={s} className="h-9 w-9" />
            <span className="text-base font-semibold">{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function PrivacyType({ draft, update }: StepProps) {
  return (
    <div className={wrap}>
      <h1 className={h1}>What type of place will guests have?</h1>
      <div className="mt-8 space-y-4" role="radiogroup" aria-label="Type of place">
        {ROOM_TYPES.map((t) => (
          <button key={t.key} type="button" role="radio" aria-checked={draft.room_type === t.key} onClick={() => update({ room_type: t.key })}
            className={`flex w-full items-center justify-between gap-6 px-6 py-5 ${card(draft.room_type === t.key)}`}>
            <span>
              <span className="block text-lg font-semibold">{t.title}</span>
              <span className="mt-1 block max-w-[440px] text-sm leading-5 text-muted">{t.text}</span>
            </span>
            <RoomTypeIcon type={t.key} className="h-10 w-10 shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

const pickPlace = (p: Place): Partial<HostDraft> => ({ address: p.label, city: p.city, country: p.country, lat: p.lat, lng: p.lng });

export function Location({ draft, update }: StepProps) {
  const has = draft.lat !== null;
  return (
    <div className={wrap}>
      <h1 className={h1}>{has ? "Is the pin in the right spot?" : "Where’s your place located?"}</h1>
      <p className={sub}>Your address is only shared with guests after they’ve made a reservation.</p>
      <div className="mt-8 h-[440px] md:h-[520px]">
        <PinMap lat={draft.lat} lng={draft.lng} hint onMove={(lat, lng) => update({ lat, lng })}>
          <div className="absolute inset-x-4 top-4 z-[1000] md:inset-x-6 md:top-6">
            <AddressSearch variant="map" value={draft.address} autoFocus={!has} onPick={(p) => update(pickPlace(p))} />
          </div>
        </PinMap>
      </div>
      {has && <p className="mt-3 text-sm text-muted">Listing will show as <span className="font-semibold text-ink">{draft.city}, {draft.country}</span></p>}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-8 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-ink" : "bg-hairline"}`}>
      <span className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface shadow transition-all ${on ? "left-5" : "left-1"}`}>
        {on && <svg viewBox="0 0 12 12" className="h-3 w-3 text-ink" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2.5 6.2 2.3 2.3 4.7-5" /></svg>}
      </span>
    </button>
  );
}

export function PreciseLocation({ draft, update }: StepProps) {
  return (
    <div className={wrap}>
      <h1 className={h1}>Choose how guests see your location on a map</h1>
      <p className={sub}>We only share your address after guests book. Until then, they’ll see {draft.precise_location ? "the exact spot" : "an approximate location"}.</p>
      <div className="mt-8 h-[460px] md:h-[540px]">
        <PinMap lat={draft.lat} lng={draft.lng} precise={draft.precise_location} interactive={false}>
          <div className="absolute inset-x-4 top-4 z-[1000] flex h-14 items-center gap-3 rounded-full bg-surface px-6 text-base shadow-[0_6px_20px_rgba(0,0,0,0.12)] md:inset-x-6">
            <span className="truncate">{draft.address || "No address yet"}</span>
          </div>
          <div className="absolute inset-x-4 bottom-4 z-[1000] flex items-start justify-between gap-4 rounded-2xl bg-surface p-5 shadow-[0_6px_20px_rgba(0,0,0,0.15)] md:inset-x-6">
            <div>
              <p className="text-base font-semibold">Show precise location</p>
              <p className="mt-1 text-sm text-muted">Let guests see your home’s exact location on the map before they book.</p>
            </div>
            <Toggle on={draft.precise_location} onChange={(v) => update({ precise_location: v })} label="Show precise location" />
          </div>
        </PinMap>
      </div>
    </div>
  );
}

function Counter({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void }) {
  const btn = "flex h-8 w-8 items-center justify-center rounded-full border border-hairline text-lg text-muted hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-hairline";
  return (
    <div className="flex items-center justify-between border-b border-hairline py-6 last:border-0">
      <span className="text-lg">{label}</span>
      <div className="flex items-center gap-4">
        <button type="button" aria-label={`Decrease ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>−</button>
        <span className="w-6 text-center text-base" aria-live="polite">{value}{value >= max ? "+" : ""}</span>
        <button type="button" aria-label={`Increase ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className={btn}>+</button>
      </div>
    </div>
  );
}

export function FloorPlan({ draft, update }: StepProps) {
  return (
    <div className={wrap}>
      <h1 className={h1}>Share some basics about your place</h1>
      <p className={sub}>You’ll add more details later, such as bed types.</p>
      <div className="mt-6">
        <Counter label="Guests" value={draft.max_guests} min={1} max={16} onChange={(n) => update({ max_guests: n })} />
        <Counter label="Bedrooms" value={draft.bedrooms} min={0} max={50} onChange={(n) => update({ bedrooms: n })} />
        <Counter label="Beds" value={draft.beds} min={1} max={50} onChange={(n) => update({ beds: n })} />
        <Counter label="Bathrooms" value={draft.bathrooms} min={0} max={50} onChange={(n) => update({ bathrooms: n })} />
      </div>
    </div>
  );
}

/* ---------- Phase 2 ---------- */

const AMENITY_GROUPS: [string, string[]][] = [
  ["What about these guest favourites?", ["Wifi", "TV", "Kitchen", "Washer", "Free parking", "Air conditioning", "Workspace", "Hot water"]],
  ["Do you have any standout amenities?", ["Pool", "Balcony", "Breakfast included", "Power backup"]],
  ["And a few more", []], // anything the backend adds later lands here
];

export function Amenities({ draft, update }: StepProps) {
  const [all, setAll] = useState<Amenity[] | null>(null);
  useEffect(() => { api<Amenity[]>("/amenities").then(setAll).catch(() => setAll([])); }, []);
  const toggle = (id: number) =>
    update({ amenity_ids: draft.amenity_ids.includes(id) ? draft.amenity_ids.filter((x) => x !== id) : [...draft.amenity_ids, id] });
  const grouped = new Set(AMENITY_GROUPS.flatMap(([, names]) => names));

  return (
    <div className={wrap}>
      <h1 className={h1}>Tell guests what your place has to offer</h1>
      <p className={sub}>You can add more amenities after you publish your listing.</p>
      {all === null && <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">{[...Array(6)].map((_, i) => <div key={i} className="h-[110px] animate-pulse rounded-xl bg-soft" />)}</div>}
      {all && AMENITY_GROUPS.map(([heading, names]) => {
        const items = names.length ? all.filter((a) => names.includes(a.name)) : all.filter((a) => !grouped.has(a.name));
        if (!items.length) return null;
        return (
          <section key={heading} className="mt-8">
            <h2 className="mb-4 text-lg font-semibold">{heading}</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {items.map((a) => {
                const on = draft.amenity_ids.includes(a.id);
                return (
                  <button key={a.id} type="button" aria-pressed={on} onClick={() => toggle(a.id)}
                    className={`flex min-h-[110px] flex-col justify-between gap-3 p-4 ${card(on)}`}>
                    <AmenityIcon name={a.name} className="h-8 w-8" />
                    <span className="text-base font-semibold">{AMENITY_LABEL[a.name] ?? a.name}</span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function Camera() {
  return (
    <svg viewBox="0 0 120 90" className="h-28 w-36" aria-hidden>
      <ellipse cx="60" cy="82" rx="40" ry="5" fill="#000" opacity=".06" />
      <path d="M36 22c4-14 44-14 48 0" fill="none" stroke="#7a4a2a" strokeWidth="5" strokeLinecap="round" />
      <rect x="22" y="26" width="76" height="50" rx="9" fill="#d9dcdf" />
      <rect x="22" y="26" width="76" height="16" rx="8" fill="#eef0f2" />
      <rect x="30" y="20" width="14" height="8" rx="2" fill="#bfc4c9" />
      <circle cx="60" cy="54" r="18" fill="#9aa1a8" />
      <circle cx="60" cy="54" r="13" fill="#3a3f45" />
      <circle cx="56" cy="50" r="4" fill="#fff" opacity=".6" />
      <circle cx="86" cy="34" r="3" fill="#ff385c" />
    </svg>
  );
}

export function Photos({ draft, update, setBusy }: StepProps) {
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(0);
  const [over, setOver] = useState(false);
  useEffect(() => setBusy(pending > 0), [pending, setBusy]); // keeps Next disabled while uploads run

  const add = async (files: FileList | File[] | null) => {
    const list = [...(files ?? [])].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setPending((n) => n + list.length);
    const results = await Promise.allSettled(list.map(uploadImage));
    const urls = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    const failed = results.find((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failed) toast(failed.reason?.message ?? "Some photos couldn’t be uploaded");
    update((d) => ({ photo_urls: [...d.photo_urls, ...urls] }));
    setPending((n) => n - list.length);
  };
  const remove = (i: number) => update({ photo_urls: draft.photo_urls.filter((_, j) => j !== i) });
  const makeCover = (i: number) => update({ photo_urls: [draft.photo_urls[i], ...draft.photo_urls.filter((_, j) => j !== i)] });
  const count = draft.photo_urls.length;
  const kind = (draft.structure || "place").toLowerCase();
  const dropProps = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); add(e.dataTransfer.files); },
  };

  return (
    <div className={wrap}>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
        onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      {count === 0 && pending === 0 ? (
        <>
          <h1 className={h1}>Add some photos of your {kind}</h1>
          <p className={sub}>You’ll need {MIN_PHOTOS} photos to get started. You can add more or make changes later.</p>
          <div {...dropProps}
            className={`mt-8 flex h-[420px] flex-col items-center justify-center gap-6 rounded-xl border border-dashed transition-colors ${over ? "border-ink bg-hairline/40" : "border-ink/40 bg-soft"}`}>
            <Camera />
            <button type="button" onClick={() => input.current?.click()} className="rounded-lg border border-ink/20 bg-surface px-5 py-2.5 text-base font-semibold hover:border-ink">Add photos</button>
            <p className="text-sm text-muted">or drag them here · JPEG, PNG or WebP up to 5 MB</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className={h1}>{count >= MIN_PHOTOS ? "Ta-da! How does this look?" : "Add some photos of your " + kind}</h1>
              <p className={sub}>{count >= MIN_PHOTOS ? "Your first photo is the cover. You can change it any time." : `Add ${MIN_PHOTOS - count} more to continue (${count} of ${MIN_PHOTOS}).`}</p>
            </div>
            <button type="button" onClick={() => input.current?.click()} aria-label="Add photos"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft text-2xl hover:bg-hairline">+</button>
          </div>
          <div {...dropProps} className={`mt-8 grid grid-cols-2 gap-4 rounded-xl ${over ? "outline-dashed outline-2 outline-offset-4 outline-ink" : ""}`}>
            {draft.photo_urls.map((u, i) => (
              <figure key={u + i} className={`group relative overflow-hidden rounded-xl bg-soft ${i === 0 ? "col-span-2 aspect-[3/2]" : "aspect-square"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                {i === 0 && <span className="absolute left-3 top-3 rounded-md bg-surface px-3 py-1.5 text-sm font-semibold shadow">Cover photo</span>}
                <div className="absolute right-3 top-3 flex gap-2 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                  {i > 0 && <button type="button" onClick={() => makeCover(i)} className="rounded-full bg-surface/95 px-3 py-1.5 text-xs font-semibold shadow">Make cover</button>}
                  <button type="button" onClick={() => remove(i)} aria-label={`Delete photo ${i + 1}`} className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/95 text-lg shadow">×</button>
                </div>
              </figure>
            ))}
            {[...Array(pending)].map((_, i) => (
              <div key={`p${i}`} className="flex aspect-square items-center justify-center rounded-xl bg-soft">
                <span className="h-7 w-7 animate-spin rounded-full border-2 border-hairline border-t-ink" aria-label="Uploading" />
              </div>
            ))}
            <button type="button" onClick={() => input.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/40 text-base font-semibold hover:bg-soft">
              <span className="text-3xl font-normal">+</span>Add more
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function CountedText({ value, max, rows, onChange, label, placeholder, big }: { value: string; max: number; rows: number; onChange: (v: string) => void; label: string; placeholder?: string; big?: boolean }) {
  const over = value.length > max;
  return (
    <div className="mt-8">
      <textarea aria-label={label} rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)}
        className={`w-full resize-none rounded-xl border bg-surface p-6 outline-none ${big ? "text-2xl leading-8" : "text-lg leading-7"} ${over ? "border-2 border-rausch" : "border-ink/40 focus:border-2 focus:border-ink"}`} />
      <p className={`mt-2 text-sm font-semibold ${over ? "text-rausch" : "text-muted"}`}>{value.length}/{max}</p>
      {over && <p className="mt-1 text-sm text-rausch">The maximum number of characters allowed is {max}.</p>}
    </div>
  );
}

export function Title({ draft, update }: StepProps) {
  return (
    <div className={wrap}>
      <h1 className={h1}>Now, let’s give your {(draft.structure || "place").toLowerCase()} a title</h1>
      <p className={sub}>Short titles work best. Have fun with it – you can always change it later.</p>
      <CountedText label="Title" value={draft.title} max={TITLE_MAX} rows={4} big onChange={(title) => update({ title })} />
    </div>
  );
}

export function Description({ draft, update }: StepProps) {
  return (
    <div className={wrap}>
      <h1 className={h1}>Create your description</h1>
      <p className={sub}>Share what makes your place special.</p>
      <CountedText label="Description" value={draft.description} max={DESCRIPTION_MAX} rows={7}
        placeholder="You’ll have a great time at this comfortable place to stay." onChange={(description) => update({ description })} />
    </div>
  );
}

/* ---------- Phase 3 ---------- */

const SERVICE_FEE_RATE = 0.14; // same as the backend quote
const MAX_PRICE = 1_000_000;
const digits = (s: string) => Math.min(Number(s.replace(/\D/g, "") || 0), MAX_PRICE);

export function Price({ draft, update }: StepProps) {
  const [open, setOpen] = useState(false);
  const fee = Math.round(draft.price * SERVICE_FEE_RATE);
  const shown = draft.price.toLocaleString("en-IN");
  const issue = blockingIssue(draft, "price");
  return (
    <div className={wrap}>
      <h1 className={h1}>Now, set your price</h1>
      <p className={sub}>You can change it anytime.</p>
      <label className="mt-12 flex items-center justify-center text-[64px] font-heavy leading-none tracking-tight md:text-[96px]">
        <span>₹</span>
        <input aria-label="Price per night" inputMode="numeric" value={shown} onChange={(e) => update({ price: digits(e.target.value) })}
          style={{ width: `${Math.max(shown.length, 1) * 0.62}em` }} className="bg-transparent text-left outline-none" />
      </label>
      {issue && <p className="mt-2 text-center text-sm text-rausch">{issue}</p>}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mx-auto mt-4 flex items-center gap-1 text-base text-muted hover:text-ink">
        Guest price before taxes {money(draft.price + fee)}
        <svg viewBox="0 0 16 16" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      {open && (
        <div className="mx-auto mt-6 max-w-[420px] animate-[rise_.25s_ease-out] space-y-3 rounded-xl border border-hairline p-5 text-base">
          <p className="flex justify-between"><span>Base price</span><span>{money(draft.price)}</span></p>
          <p className="flex justify-between"><span>Guest service fee</span><span>{money(fee)}</span></p>
          <p className="flex justify-between border-t border-hairline pt-3 font-semibold"><span>Guest price before taxes</span><span>{money(draft.price + fee)}</span></p>
          <p className="flex justify-between rounded-lg bg-soft px-3 py-2 font-semibold"><span>You earn</span><span>{money(draft.price)}</span></p>
        </div>
      )}
      <div className="mx-auto mt-10 flex max-w-[420px] items-center justify-between rounded-xl border border-hairline px-5 py-4">
        <div>
          <p className="text-base font-semibold">Cleaning fee</p>
          <p className="text-sm text-muted">Optional, charged once per stay</p>
        </div>
        <label className="flex items-center gap-1 rounded-lg border border-ink/30 px-3 py-2 text-base focus-within:border-ink">
          ₹<input aria-label="Cleaning fee" inputMode="numeric" value={draft.cleaning_fee ? draft.cleaning_fee.toLocaleString("en-IN") : ""} placeholder="0"
            onChange={(e) => update({ cleaning_fee: digits(e.target.value) })} className="w-20 bg-transparent outline-none" />
        </label>
      </div>
    </div>
  );
}

const OFFERS = [
  { pct: 20, title: "New listing promotion", text: "Offer 20% off to help you get your first bookings and reviews." },
  { pct: 10, title: "Limited-time deal", text: "A smaller discount to stand out in search results." },
  { pct: 0, title: "No special offer", text: "Guests see your regular nightly price." },
];

export function Discount({ draft, update }: StepProps) {
  const preset = OFFERS.some((o) => o.pct === draft.discount_pct);
  const [custom, setCustom] = useState(!preset);
  const pay = draft.price - Math.round((draft.price * draft.discount_pct) / 100);
  return (
    <div className={wrap}>
      <h1 className={h1}>Add a special offer</h1>
      <p className={sub}>Help your place stand out. Guests see your original price crossed out.</p>
      <div className="mt-8 space-y-4" role="radiogroup" aria-label="Special offer">
        {OFFERS.map((o) => {
          const on = !custom && draft.discount_pct === o.pct;
          return (
            <button key={o.pct} type="button" role="radio" aria-checked={on} onClick={() => { setCustom(false); update({ discount_pct: o.pct }); }}
              className={`flex w-full items-center gap-5 px-5 py-5 ${card(on)}`}>
              <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-lg font-semibold">{o.pct}%</span>
              <span className="flex-1"><span className="block text-base font-semibold">{o.title}</span><span className="mt-0.5 block text-sm text-muted">{o.text}</span></span>
            </button>
          );
        })}
        <div className={`flex w-full items-center gap-5 px-5 py-5 ${card(custom)}`} onClick={() => setCustom(true)} role="radio" aria-checked={custom} tabIndex={-1}>
          <label className="flex h-14 w-16 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface text-lg font-semibold focus-within:border-ink">
            <input aria-label="Custom discount percent" inputMode="numeric" value={custom ? String(draft.discount_pct) : ""} placeholder="–"
              onFocus={() => setCustom(true)} onChange={(e) => update({ discount_pct: Math.min(Number(e.target.value.replace(/\D/g, "") || 0), 99) })}
              className="w-7 bg-transparent text-right outline-none" />%
          </label>
          <span className="flex-1"><span className="block text-base font-semibold">Custom offer</span><span className="mt-0.5 block text-sm text-muted">Pick any discount up to 90%.</span></span>
        </div>
      </div>
      {blockingIssue(draft, "discount") && <p className="mt-3 text-sm text-rausch">{blockingIssue(draft, "discount")}</p>}
      {draft.discount_pct > 0 && draft.discount_pct <= 90 && (
        <p className="mt-6 text-base">Guests will pay <s className="text-muted">{money(draft.price)}</s> <span className="font-semibold">{money(pay)}</span> a night.</p>
      )}
    </div>
  );
}

export function Receipt({ draft }: StepProps) {
  const missing = STEPS.map((s) => ({ s, issue: blockingIssue(draft, s.slug) })).filter((x) => x.issue);
  const pay = draft.price - Math.round((draft.price * draft.discount_pct) / 100);
  const next = [
    ["Confirm a few details and publish", "We’ll let you know if you need to verify your identity or register with the local government."],
    ["Set up your calendar", "Choose which dates your listing is available. Booked dates are blocked automatically."],
    ["Adjust your settings", "Edit photos, pricing, amenities and more from Listings at any time."],
  ];
  return (
    <div className="mx-auto w-full max-w-[1000px] px-6 pb-16 pt-6 md:pt-10">
      <h1 className="text-[32px] font-semibold leading-tight tracking-tight md:text-[48px]">Review your listing</h1>
      <p className={sub}>Here’s what we’ll show to guests. Make sure everything looks good.</p>
      <div className="mt-10 grid items-start gap-12 md:grid-cols-2">
        <div className="rounded-3xl p-4 shadow-[0_6px_24px_rgba(0,0,0,0.12)]">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {draft.photo_urls[0] && <img src={draft.photo_urls[0]} alt="" className="h-full w-full object-cover" />}
            <span className="absolute left-3 top-3 rounded-md bg-surface px-3 py-1.5 text-sm font-semibold shadow">Show preview</span>
          </div>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{draft.title || "Untitled listing"}</p>
              <p className="text-base">
                {draft.discount_pct > 0 && <s className="mr-1 text-muted">{money(draft.price)}</s>}
                <span className="font-semibold">{money(pay)}</span> night
              </p>
            </div>
            <p className="shrink-0 text-base">New ★</p>
          </div>
          <p className="mt-1 text-sm text-muted">{draft.city}{draft.country && `, ${draft.country}`} · {draft.max_guests} guest{draft.max_guests > 1 ? "s" : ""} · {draft.bedrooms} bedroom{draft.bedrooms === 1 ? "" : "s"}</p>
        </div>
        <div>
          <h2 className="text-[22px] font-semibold">What’s next?</h2>
          <ul className="mt-6 space-y-6">
            {next.map(([t, d]) => (
              <li key={t} className="flex gap-4">
                <svg viewBox="0 0 24 24" className="mt-0.5 h-7 w-7 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 2.5v4M16 2.5v4M8 14l2.5 2.5L16 12" /></svg>
                <span><span className="block text-lg font-semibold">{t}</span><span className="mt-1 block text-base text-muted">{d}</span></span>
              </li>
            ))}
          </ul>
          {missing.length > 0 && (
            <div className="mt-8 rounded-xl bg-rausch/10 p-4 text-sm">
              <p className="font-semibold text-rausch">Before you publish:</p>
              <ul className="mt-2 space-y-1">
                {missing.map(({ s, issue }) => <li key={s.slug}><Link href={`/become-a-host/${s.slug}`} className="underline">{issue}</Link></li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

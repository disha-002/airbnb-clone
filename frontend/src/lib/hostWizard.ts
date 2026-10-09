"use client";
import { useCallback, useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";

/* The "Become a host" wizard: steps, choices, the saved draft, and address lookup. */

export type RoomType = "entire" | "room" | "shared";

/** Airbnb's "Which of these best describes your place?" list, in Airbnb's order. */
export const STRUCTURES = [
  "House", "Flat/apartment", "Barn", "Bed & breakfast", "Boat", "Cabin", "Campervan/motorhome",
  "Casa particular", "Castle", "Cave", "Container", "Cycladic home", "Dammuso", "Dome", "Earth home",
  "Farm", "Guest house", "Hotel", "Houseboat", "Minsu", "Riad", "Ryokan", "Shepherd’s hut", "Tent",
  "Tiny home", "Tower", "Tree house", "Trullo", "Windmill", "Yurt",
];

export const ROOM_TYPES: { key: RoomType; title: string; text: string }[] = [
  { key: "entire", title: "An entire place", text: "Guests have the whole place to themselves." },
  { key: "room", title: "A room", text: "Guests have their own room in a home, plus access to shared spaces." },
  { key: "shared", title: "A shared room in a hostel", text: "Guests sleep in a shared room in a professionally managed hostel with staff on-site 24/7." },
];

/** The wizard never asks for a category bar tab, so one is picked from the structure. */
export function categoryFor(structure: string): string {
  if (["Cabin", "Barn", "Tree house", "Tiny home", "Shepherd’s hut", "Tent", "Yurt", "Farm", "Earth home", "Cave"].includes(structure)) return "Cabins";
  if (["Boat", "Houseboat"].includes(structure)) return "Beachfront";
  if (["Castle", "Tower", "Windmill", "Dome", "Container", "Cycladic home", "Dammuso", "Trullo", "Riad", "Ryokan", "Minsu"].includes(structure)) return "Design";
  return "Trending";
}

/** Each step is its own URL, like /become-a-host/structure. Phases fill the three progress bars. */
export const STEPS = [
  { slug: "about-your-place", phase: 0, title: "Step 1: Tell us about your place" },
  { slug: "structure", phase: 0, title: "Choose your property type" },
  { slug: "privacy-type", phase: 0, title: "Choose the type of place" },
  { slug: "location", phase: 0, title: "Enter the location" },
  { slug: "precise-location", phase: 0, title: "Choose how guests see your location" },
  { slug: "floor-plan", phase: 0, title: "Select the total guests and rooms" },
  { slug: "stand-out", phase: 1, title: "Step 2: Make your place stand out" },
  { slug: "amenities", phase: 1, title: "Choose your amenities" },
  { slug: "photos", phase: 1, title: "Add some photos" },
  { slug: "title", phase: 1, title: "Create your title" },
  { slug: "description", phase: 1, title: "Create your description" },
  { slug: "finish-setup", phase: 2, title: "Step 3: Finish up and publish" },
  { slug: "price", phase: 2, title: "Set your price" },
  { slug: "discount", phase: 2, title: "Add a special offer" },
  { slug: "receipt", phase: 2, title: "Review your listing" },
] as const;
export type StepSlug = (typeof STEPS)[number]["slug"];

/** How full each of the three bars is (0..1) while on step `index`. */
export function phaseProgress(index: number): number[] {
  const cur = STEPS[index].phase;
  return [0, 1, 2].map((p) => {
    if (p < cur) return 1;
    if (p > cur) return 0;
    const inPhase = STEPS.filter((s) => s.phase === p);
    return inPhase.findIndex((s) => s.slug === STEPS[index].slug) / inPhase.length;
  });
}

export const MIN_PHOTOS = 5;
export const TITLE_MAX = 32;
export const DESCRIPTION_MAX = 500;
export const MIN_PRICE = 100;

export interface HostDraft {
  step: StepSlug;
  address: string; city: string; country: string; lat: number | null; lng: number | null;
  structure: string; room_type: RoomType; precise_location: boolean;
  max_guests: number; bedrooms: number; beds: number; bathrooms: number;
  amenity_ids: number[]; photo_urls: string[];
  title: string; description: string;
  price: number; cleaning_fee: number; discount_pct: number;
}

export const EMPTY_DRAFT: HostDraft = {
  step: "about-your-place",
  address: "", city: "", country: "", lat: null, lng: null,
  structure: "", room_type: "entire", precise_location: true,
  max_guests: 4, bedrooms: 1, beds: 1, bathrooms: 1,
  amenity_ids: [], photo_urls: [], title: "", description: "",
  price: 2500, cleaning_fee: 0, discount_pct: 0,
};

/** Which step still needs something before the listing can go live (null = all good). */
export function blockingIssue(d: HostDraft, slug: StepSlug): string | null {
  switch (slug) {
    case "structure": return d.structure ? null : "Pick the type of property";
    case "location": return d.lat !== null && d.city ? null : "Enter your address";
    case "photos": return d.photo_urls.length >= MIN_PHOTOS ? null : `Add at least ${MIN_PHOTOS} photos`;
    case "title": return d.title.trim().length >= 3 && d.title.length <= TITLE_MAX ? null : `Title must be 3–${TITLE_MAX} characters`;
    case "description": return d.description.trim() && d.description.length <= DESCRIPTION_MAX ? null : "Add a description";
    case "price": return d.price >= MIN_PRICE ? null : `Price must be at least ₹${MIN_PRICE}`;
    case "discount": return d.discount_pct >= 0 && d.discount_pct <= 90 ? null : "Offers can be 0–90% off";
    default: return null;
  }
}

/** The request body for POST /host/listings. */
export function draftToListing(d: HostDraft) {
  return {
    title: d.title.trim(), description: d.description.trim(),
    property_type: d.structure, room_type: d.room_type, category: categoryFor(d.structure),
    city: d.city, country: d.country, lat: d.lat ?? 0, lng: d.lng ?? 0, precise_location: d.precise_location,
    price_per_night: d.price, cleaning_fee: d.cleaning_fee, discount_pct: d.discount_pct,
    max_guests: d.max_guests, bedrooms: d.bedrooms, beds: d.beds, bathrooms: d.bathrooms,
    photo_urls: d.photo_urls, amenity_ids: d.amenity_ids,
  };
}

export type DraftPatch = Partial<HostDraft> | ((d: HostDraft) => Partial<HostDraft>);

const key = (userId: number) => `hostDraft:${userId}`;

export function readDraft(userId: number): HostDraft | null {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? { ...EMPTY_DRAFT, ...JSON.parse(raw) } : null;
  } catch { return null; }
}

/** Draft kept in localStorage per host, so "Save & exit" (or a reload) picks up where they left off. */
export function useHostDraft() {
  const { user } = useUser();
  const [draft, setDraft] = useState<HostDraft | null>(() => (user ? readDraft(user.id) ?? EMPTY_DRAFT : null));

  useEffect(() => { if (user) setDraft(readDraft(user.id) ?? EMPTY_DRAFT); }, [user]);

  /** Accepts a patch, or a function of the latest draft (for async work like uploads). */
  const update = useCallback((patch: DraftPatch) => {
    setDraft((prev) => {
      const base = prev ?? EMPTY_DRAFT;
      const next = { ...base, ...(typeof patch === "function" ? patch(base) : patch) };
      try { if (user) localStorage.setItem(key(user.id), JSON.stringify(next)); } catch {}
      return next;
    });
  }, [user]);

  const clear = useCallback(() => {
    try { if (user) localStorage.removeItem(key(user.id)); } catch {}
    setDraft(EMPTY_DRAFT);
  }, [user]);

  return { draft, update, clear };
}

export interface Place { label: string; main: string; secondary: string; city: string; country: string; lat: number; lng: number }

interface PhotonProps {
  name?: string; housenumber?: string; street?: string; locality?: string; district?: string;
  city?: string; county?: string; state?: string; country?: string; osm_value?: string;
}

const uniq = (xs: (string | undefined)[]) => xs.filter((x, i, a): x is string => !!x && a.indexOf(x) === i);

/**
 * Address suggestions from Photon (komoot's free OpenStreetMap geocoder; no API key, and unlike
 * nominatim.org it allows search-as-you-type). Results are biased towards India.
 */
export async function searchPlaces(q: string, signal?: AbortSignal): Promise<Place[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=5&lang=en&lat=22.5&lon=79`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Address search is unavailable right now");
  const json: { features: { properties: PhotonProps; geometry: { coordinates: [number, number] } }[] } = await res.json();
  return json.features.map(({ properties: p, geometry }) => {
    const street = uniq([p.housenumber && p.street ? `${p.housenumber} ${p.street}` : p.street]);
    const isTown = ["city", "town", "village"].includes(p.osm_value ?? "");
    // Delhi-style results have no city, only a district ("South East Delhi") inside a city-state ("Delhi").
    const county = p.county && p.state && p.county.endsWith(p.state) ? p.state : p.county;
    const city = (isTown ? p.name : p.city ?? county ?? p.state ?? p.name) ?? "";
    const main = p.name ?? street[0] ?? city;
    const secondary = uniq([...street, p.locality, p.district, p.city, p.state, p.country]).filter((x) => x !== main).join(", ");
    return {
      label: uniq([main, ...secondary.split(", ")]).join(", "), main, secondary,
      city, country: p.country ?? "", lng: geometry.coordinates[0], lat: geometry.coordinates[1],
    };
  });
}

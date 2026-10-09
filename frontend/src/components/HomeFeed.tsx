"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ListingCardData, ListingPage } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import Carousel from "./Carousel";
import ListingRow from "./ListingRow";
import OfferCard from "./OfferCard";
import { Destinations, ExperienceTiles, Inspiration, ServiceTiles } from "./Extras";
import { SERVICE_ROWS } from "@/lib/services";

const SUBTITLES: Record<string, string> = {
  Goa: "Indian coast with beach shacks",
  Manali: "Himalayan town with mountain trails",
  Shimla: "Himalayan city with colonial streets",
  Mumbai: "Bollywood hub on India’s west coast",
  "New Delhi": "India’s capital with grand boulevards",
  Jaipur: "The Pink City of palaces and forts",
  Udaipur: "City of lakes in Rajasthan",
  Rishikesh: "Himalayan city in India with ashrams",
  Munnar: "Tea gardens and misty hills in Kerala",
  Bengaluru: "India’s tech hub with lively cafés",
  Mussoorie: "Hill station in Uttarakhand",
  Chandigarh: "India’s modernist capital city",
};

// Rotating headline styles, as on Airbnb's home page.
const STYLES = [
  { title: (c: string) => `Guest favourite homes in ${c}`, nights: 1 },
  { title: (c: string) => `Popular homes in ${c}`, nights: 1 },
  { title: (c: string) => `Available in ${c} this weekend`, nights: 2 },
  { title: (c: string) => `Stay in ${c}`, nights: 1 },
  { title: (c: string) => `Places to stay in ${c}`, nights: 1 },
  { title: (c: string) => `Check out homes in ${c}`, nights: 1 },
];

/**
 * "all"   - the All tab: 4 city rows, then experiences + services, then 4 more city rows.
 * "homes" - the Homes tab: every city row, nothing else.
 */
export default function HomeFeed({ variant }: { variant: "all" | "homes" }) {
  const { user, ready } = useUser();
  const [items, setItems] = useState<ListingCardData[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready) return; // wait so wishlist hearts reflect the logged-in user
    api<ListingPage>("/listings?page_size=120")
      .then((p) => setItems(p.items))
      .catch(() => setError(true));
  }, [ready, user?.id]);

  const byCity = useMemo(() => {
    const m = new Map<string, ListingCardData[]>();
    items?.forEach((l) => m.set(l.city, [...(m.get(l.city) ?? []), l]));
    return [...m.entries()];
  }, [items]);

  if (error)
    return <p className="px-5 py-20 text-center text-muted">Couldn’t reach the server. Is the backend running on port 8000?</p>;

  if (!items)
    return (
      <div className="space-y-8 px-5 md:px-10 min-[1440px]:px-12">
        {[0, 1].map((i) => (
          <div key={i}>
            <div className="mb-4 h-7 w-64 animate-pulse rounded bg-soft" />
            <div className="flex gap-4 overflow-hidden">
              {[0, 1, 2, 3].map((j) => <div key={j} className="aspect-[1.05/1] w-[43vw] max-w-[270px] shrink-0 animate-pulse rounded-card bg-soft" />)}
            </div>
          </div>
        ))}
      </div>
    );

  const rows = byCity.map(([city, listings], i) => {
    const s = STYLES[i % STYLES.length];
    return (
      <ListingRow key={city} title={s.title(city)} subtitle={SUBTITLES[city] ?? ""}
        href={`/search?q=${encodeURIComponent(city)}`} listings={listings} nights={s.nights} />
    );
  });

  if (variant === "homes") return <>{rows}<Inspiration /></>;

  const photography = SERVICE_ROWS[0].services;
  return (
    <>
      {rows.slice(0, 4)}
      <ExperienceTiles />
      <ServiceTiles />
      <Carousel title="Capture memories nearby" href="/services#photography" itemCount={photography.length}>
        {photography.map((o) => <OfferCard key={o.id} offer={o} kind="services" />)}
      </Carousel>
      {rows.slice(4, 8)}
      <Destinations />
      <Inspiration />
    </>
  );
}

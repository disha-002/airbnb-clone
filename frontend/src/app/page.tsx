"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { ListingCardData, ListingPage } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import ListingRow from "@/components/ListingRow";
import { Destinations, ExperienceTiles, Inspiration, ServiceTiles } from "@/components/Extras";

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

export default function Home() {
  const { user, ready } = useUser();
  const [items, setItems] = useState<ListingCardData[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!ready) return; // wait so wishlist hearts reflect the logged-in user
    api<ListingPage>("/listings?page_size=48")
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
      <div className="space-y-8 px-5 md:px-10">
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

  return (
    <>
      {byCity.map(([city, listings], i) => {
        const s = STYLES[i % STYLES.length];
        return (
          <Fragment key={city}>
            <ListingRow
              title={s.title(city)}
              subtitle={SUBTITLES[city] ?? ""}
              href={`/search?q=${encodeURIComponent(city)}`}
              listings={listings}
              nights={s.nights}
            />
            {/* Experiences / services rows are placeholders, interleaved like the real home page */}
            {i === 2 && <ExperienceTiles />}
            {i === 3 && <ServiceTiles />}
          </Fragment>
        );
      })}
      <Destinations />
      <Inspiration />
    </>
  );
}

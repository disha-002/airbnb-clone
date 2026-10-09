"use client";
import Link from "next/link";
import { useState } from "react";
import { EXPERIENCE_CATEGORIES } from "@/lib/experiences";
import { ArrowRight } from "./icons";
import { ServiceCategoryTiles } from "./Services";

/* eslint-disable @next/next/no-img-element */

const DESTS = [
  { name: "Dubai", sub: "Prime beach spot" },
  { name: "Bangkok", sub: "Vibrant nightlife" },
  { name: "Tokyo", sub: "Epic architecture" },
  { name: "Paris", sub: "Romantic streets" },
  { name: "Lisbon", sub: "Sunny hills & trams" },
];

/** Phone-only block (the laptop home page doesn't show it). */
export function Destinations() {
  return (
    <section className="mb-10 md:hidden">
      <h2 className="px-5 text-[26px] font-semibold tracking-tight">Destinations for you</h2>
      <div className="no-scrollbar mt-4 flex gap-4 overflow-x-auto px-5">
        {DESTS.map((d) => (
          <div key={d.name} className="w-[40vw] min-w-[150px] max-w-[240px] shrink-0">
            <img src={`https://picsum.photos/seed/dest-${d.name}/600/600`} alt={d.name} className="aspect-square w-full rounded-card object-cover" />
            <p className="mt-2 px-1 font-semibold">{d.name}</p>
            <p className="px-1 text-[15px] text-muted">{d.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ title, href = "#" }: { title: string; href?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 md:px-10 min-[1440px]:px-12">
      <h2 className="text-[22px] font-heavy leading-7 tracking-tight md:text-xl md:leading-6 md:tracking-[-0.18px]">{title}</h2>
      <Link href={href} aria-label={title} className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10"><ArrowRight /></Link>
    </div>
  );
}

// 7 tiles fill a laptop row, like Airbnb's.
const TILE_W =
  "w-[40vw] min-w-[150px] max-w-[220px] shrink-0 md:w-[calc((100vw_-_120px)/5)] md:max-w-none " +
  "lg:w-[calc((100vw_-_140px)/7)] min-[1440px]:w-[min(calc((100vw_-_156px)/7),229px)]";

/** Category tiles linking to the Experiences tab. */
export function ExperienceTiles() {
  return (
    <section className="mb-8 md:mb-10">
      <SectionHeading title="Explore experiences nearby" href="/experiences" />
      <div className="no-scrollbar mt-4 flex gap-2.5 overflow-x-auto px-5 md:px-10 min-[1440px]:px-12">
        {EXPERIENCE_CATEGORIES.map((c) => (
          <Link key={c.label} href="/experiences" className={TILE_W}>
            <img src={c.photo} alt="" loading="lazy" className="aspect-square w-full rounded-card object-cover" />
            <p className="mt-2 px-0.5 text-[13px] font-medium">{c.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Home page block linking to the Services tab. */
export function ServiceTiles() {
  return <ServiceCategoryTiles title="Find services near you" />;
}

const rentals = (names: string[], kind: string) => names.map((n) => [n, kind] as [string, string]);
const INSPIRATION: Record<string, [string, string][]> = {
  Popular: [
    ["Tokyo", "Holiday rentals"], ["Pocono Mountains", "House rentals"], ["Raleigh", "House rentals"], ["Kauai", "Monthly Rentals"],
    ["Nashville", "Monthly Rentals"], ["Montreal", "House rentals"], ["Barcelona", "Flat rentals"], ["Daytona Beach", "Villa rentals"],
    ["Brooklyn", "Monthly Rentals"], ["Galveston", "Villa rentals"], ["Outer Banks", "Flat rentals"], ["Chicago", "Flat rentals"],
    ["St. Petersburg", "Holiday rentals"], ["Broken Bow", "House rentals"], ["Memphis", "House rentals"], ["Pittsburgh", "House rentals"], ["Destin", "Holiday rentals"],
    ["Savannah", "Holiday rentals"], ["Gatlinburg", "Cabin rentals"], ["San Diego", "Beach house rentals"], ["Myrtle Beach", "Flat rentals"],
    ["Scottsdale", "Villa rentals"], ["Panama City Beach", "Holiday rentals"],
  ],
  "Arts & culture": rentals(["Florence", "Vienna", "Kyoto", "Paris", "Prague", "Rome", "Istanbul", "Lisbon", "Seville", "Amsterdam", "Berlin", "Edinburgh"], "Flat rentals"),
  Beach: rentals(["Malibu", "Tulum", "Goa", "Bali", "Phuket", "Cancún", "Maui", "Santorini", "Algarve", "Gold Coast", "Miami Beach", "Cape Town"], "Beach house rentals"),
  Mountains: rentals(["Aspen", "Manali", "Shimla", "Banff", "Chamonix", "Queenstown", "Zermatt", "Lake Tahoe", "Park City", "Big Bear", "Innsbruck", "Whistler"], "Cabin rentals"),
  Outdoors: rentals(["Yosemite", "Sedona", "Lake Placid", "Asheville", "Moab", "Bend", "Jackson Hole", "Glacier", "Joshua Tree", "Big Sur", "Smoky Mountains", "Zion"], "Cabin rentals"),
  "Things to do": rentals(["Orlando", "Las Vegas", "New York", "Austin", "London", "Singapore", "Sydney", "Dubai", "Bangkok", "Mumbai", "Delhi", "Jaipur"], "Holiday rentals"),
};

export function Inspiration() {
  const [tab, setTab] = useState("Popular");
  const [all, setAll] = useState(false);
  const list = INSPIRATION[tab];
  // collapsed: 7 cells on phone/tablet, 17 on laptop (3 full rows of 6), then a "Show more" cell
  const shown = all ? list : list.slice(0, 17);

  return (
    <section className="bg-soft px-5 pb-6 pt-12 md:px-10 min-[1440px]:px-12 md:pb-16">
      <h2 className="text-[22px] font-semibold leading-[26px] tracking-tight md:tracking-normal">Inspiration for future getaways</h2>
      <div className="no-scrollbar mt-6 flex gap-8 overflow-x-auto border-b border-hairline">
        {Object.keys(INSPIRATION).map((t) => (
          <button key={t} onClick={() => { setTab(t); setAll(false); }}
            className={`-mb-px shrink-0 pb-3 text-[15px] font-medium leading-[18px] md:text-sm md:leading-[18px] ${tab === t ? "border-b-[3px] border-ink text-ink" : "text-muted hover:text-ink"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-7 md:grid-cols-4 lg:grid-cols-6">
        {shown.map(([place, kind], i) => (
          <div key={place} className={!all && i >= 7 ? "hidden lg:block" : ""}>
            <p className="font-semibold leading-[18px] md:text-sm md:leading-[18px]">{place}</p>
            <p className="text-[15px] leading-[18px] text-muted md:text-sm md:leading-[18px]">{kind}</p>
          </div>
        ))}
        {list.length > 7 && (
          <button onClick={() => setAll(!all)} className={`flex items-start gap-1 text-left font-semibold md:text-sm ${list.length <= 17 ? "lg:hidden" : ""}`}>
            {all ? "Show less" : "Show more"} <span className={`transition ${all ? "rotate-180" : ""}`}>⌄</span>
          </button>
        )}
      </div>
    </section>
  );
}

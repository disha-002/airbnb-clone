"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ListingCardData } from "@/lib/types";
import ListingCard from "./ListingCard";
import { ArrowRight } from "./icons";

// Phone: ~2 cards across. Laptop: 4 -> 6 -> 7 cards across, like Airbnb.
const CARD_W =
  "w-[43vw] min-w-[165px] max-w-[270px] shrink-0 snap-start " +
  "md:w-[calc((100vw_-_80px)/4_-_10px)] md:min-w-0 md:max-w-none " +
  "lg:w-[calc((100vw_-_80px)/6_-_10px)] " +
  "xl:w-[min(calc((100vw_-_80px)/7_-_10px),235px)]";

/** Last tile in each carousel: three tilted photos + "See all". */
function SeeAllCard({ href, listings }: { href: string; listings: ListingCardData[] }) {
  const pics = listings.slice(0, 3).map((l) => l.cover_url);
  const pos = [
    "left-[18%] top-[6%] -rotate-6 z-0",
    "right-[12%] top-[16%] rotate-6 z-10",
    "left-[12%] top-[34%] -rotate-3 z-20",
  ];
  return (
    <Link href={href} className={`${CARD_W} self-start`}>
      <div className="flex aspect-[1.05/1] flex-col items-center justify-center rounded-card bg-white shadow-pill ring-1 ring-black/5">
        <div className="relative h-[52%] w-[72%]">
          {pics.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={src} alt=""
              className={`absolute h-[62%] w-[52%] rounded-lg border-[3px] border-white object-cover shadow-md ${pos[i]}`} />
          ))}
        </div>
        <span className="mt-3 text-lg font-semibold">See all</span>
      </div>
    </Link>
  );
}

/** One city section: heading + arrow, laptop scroll buttons, horizontally scrolling cards. */
export default function ListingRow({
  title, subtitle, href, listings, nights = 1,
}: {
  title: string; subtitle: string; href: string; listings: ListingCardData[]; nights?: number;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, listings.length]);

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: "smooth" });

  const arrow = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 hover:bg-black/10";
  const scrollBtn = "h-8 w-8 items-center justify-center rounded-full bg-black/5 enabled:hover:bg-black/10 enabled:hover:scale-105 disabled:text-black/25";

  return (
    <section className="mb-8 md:mb-10">
      <div className="flex items-start justify-between gap-3 px-5 md:px-10">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[26px] font-semibold leading-8 tracking-tight md:text-[22px]">{title}</h2>
            <Link href={href} aria-label={`See all: ${title}`} className={`${arrow} hidden md:flex`}><ArrowRight /></Link>
          </div>
          <p className="mt-0.5 text-[15px] text-muted">{subtitle}</p>
        </div>
        {/* phone: arrow on the right */}
        <Link href={href} aria-label={`See all: ${title}`} className={`${arrow} mt-1 h-9 w-9 md:hidden`}><ArrowRight /></Link>
        {/* laptop: scroll buttons */}
        <div className="hidden gap-2 md:flex">
          <button onClick={() => scrollBy(-1)} disabled={!canLeft} aria-label="Scroll left" className={`${scrollBtn} flex`}>
            <ArrowRight className="h-4 w-4 rotate-180" />
          </button>
          <button onClick={() => scrollBy(1)} disabled={!canRight} aria-label="Scroll right" className={`${scrollBtn} flex`}>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={scroller} onScroll={update}
        className="no-scrollbar mt-4 flex snap-x gap-3.5 overflow-x-auto px-5 md:gap-2.5 md:px-10 md:scroll-pl-10">
        {listings.map((l) => <ListingCard key={l.id} listing={l} nights={nights} className={CARD_W} />)}
        <SeeAllCard href={href} listings={listings} />
      </div>
    </section>
  );
}

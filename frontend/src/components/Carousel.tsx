"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "./icons";

// Card widths measured from Airbnb: 12px gaps; 40px side padding, or 48px from 1440px up.
// Phone: ~2 across. Tablet: 4. Laptop: 6. From 1440px: 7 (capped by the 1760px page width).
export const CARD_W =
  "w-[43vw] min-w-[165px] max-w-[270px] shrink-0 snap-start " +
  "md:w-[calc((100vw_-_116px)/4)] md:min-w-0 md:max-w-none " +
  "lg:w-[calc((100vw_-_140px)/6)] " +
  "min-[1440px]:w-[min(calc((100vw_-_168px)/7),227px)]";

/** Section heading (+ "see all" arrow), laptop scroll buttons, and a horizontally scrolling track. */
export default function Carousel({
  title, subtitle, href, itemCount, children,
}: {
  title: string; subtitle?: string; href: string; itemCount: number; children: React.ReactNode;
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
  }, [update, itemCount]);

  const scrollBy = (dir: 1 | -1) =>
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.85, behavior: "smooth" });

  const arrow = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10";
  const scrollBtn = "h-8 w-8 items-center justify-center rounded-full bg-ink/5 enabled:hover:bg-ink/10 enabled:hover:scale-105 disabled:text-ink/25";

  return (
    <section className="mb-8 md:mb-10">
      <div className="flex items-start justify-between gap-3 px-5 md:px-10 min-[1440px]:px-12">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[22px] font-heavy leading-7 tracking-tight md:text-xl md:leading-6 md:tracking-[-0.18px]">{title}</h2>
            <Link href={href} aria-label={`See all: ${title}`} className={`${arrow} hidden md:flex`}><ArrowRight /></Link>
          </div>
          {subtitle && <p className="mt-0.5 text-[15px] text-muted md:text-sm md:leading-[18px]">{subtitle}</p>}
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
        className="no-scrollbar mt-4 flex snap-x gap-3.5 overflow-x-auto px-5 md:gap-3 md:px-10 md:scroll-pl-10 min-[1440px]:px-12 min-[1440px]:scroll-pl-12">
        {children}
      </div>
    </section>
  );
}

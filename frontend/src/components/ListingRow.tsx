"use client";
import Link from "next/link";
import type { ListingCardData } from "@/lib/types";
import Carousel, { CARD_W } from "./Carousel";
import ListingCard from "./ListingCard";

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
      <div className="flex aspect-[1.05/1] flex-col items-center justify-center rounded-card bg-surface shadow-pill ring-1 ring-black/5">
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

/** One city section of the home page. */
export default function ListingRow({
  title, subtitle, href, listings, nights = 1,
}: {
  title: string; subtitle: string; href: string; listings: ListingCardData[]; nights?: number;
}) {
  return (
    <Carousel title={title} subtitle={subtitle} href={href} itemCount={listings.length}>
      {listings.map((l) => <ListingCard key={l.id} listing={l} nights={nights} className={CARD_W} compact />)}
      <SeeAllCard href={href} listings={listings} />
    </Carousel>
  );
}

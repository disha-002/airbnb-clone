import type { ListingDetail, Review } from "@/lib/types";
import { StarIcon } from "./icons";
import { Laurel } from "./ListingIcons";
import Reveal from "./Reveal";

/* eslint-disable @next/next/no-img-element */
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
const fmt = (r: number) => r.toFixed(2).replace(/0$/, "").replace(/\.$/, ".0");

/** Airbnb awards "Guest favourite" to the best-rated, well-reviewed homes. */
export const isGuestFavourite = (l: Pick<ListingDetail, "rating" | "review_count">) => (l.rating ?? 0) >= 4.8 && l.review_count >= 3;

function ago(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5);
  if (days < 7) return days <= 1 ? "Today" : `${days} days ago`;
  if (days < 30) return plural(Math.floor(days / 7), "week") + " ago";
  if (days < 365) return plural(Math.floor(days / 30), "month") + " ago";
  return plural(Math.floor(days / 365), "year") + " ago";
}
function onAirbnb(iso: string) {
  const months = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (30.44 * 864e5)));
  return months < 12 ? `${plural(months, "month")} on Airbnb` : `${plural(Math.floor(months / 12), "year")} on Airbnb`;
}
const TINTS = [["#FBE9DC", "#9B3D0B"], ["#DDF2E6", "#14602F"], ["#E3EAFB", "#26408B"], ["#F7E1EF", "#8A1F62"], ["#FFF3C9", "#7A5A00"]];
function Avatar({ name }: { name: string }) {
  const [bg, fg] = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];
  return <span style={{ background: bg, color: fg }} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-medium">{name[0]?.toUpperCase()}</span>;
}

const CATEGORIES: [string, string, React.ReactNode][] = [
  ["Cleanliness", "", <path key="a" d="M9 3h5l2 4H9zM8 7h8v3H8zM6 10h12l-1 11H7z" />],
  ["Accuracy", "", <g key="b"><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></g>],
  ["Check-in", "", <g key="c"><circle cx="9" cy="9" r="5" /><path d="m13 13 8 8M17 17l-2 2" /></g>],
  ["Communication", "", <path key="d" d="M4 5h16v11H11l-5 4v-4H4z" />],
  ["Location", "", <path key="e" d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14" />],
  ["Value", "", <g key="f"><path d="M3 4h8l10 10-7 7L4 11z" /><circle cx="8" cy="9" r="1.5" /></g>],
];

function Card({ r }: { r: Review }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-4">
        <Avatar name={r.guest.name} />
        <div><p className="text-base font-semibold">{r.guest.name.split(" ")[0]}</p><p className="text-base text-muted">{onAirbnb(r.guest.created_at)}</p></div>
      </div>
      <p className="mb-2 flex items-center gap-0.5 text-sm">
        {Array.from({ length: r.rating }, (_, i) => <StarIcon key={i} className="h-2.5 w-2.5" />)}
        <span className="mx-1.5">·</span><span>{ago(r.created_at)}</span>
      </p>
      <p className="text-base leading-6">{r.comment}</p>
    </div>
  );
}

export default function ListingReviews({ listing }: { listing: ListingDetail }) {
  const { reviews, rating } = listing;
  const fav = isGuestFavourite(listing);
  const score = rating ? fmt(rating) : "New";
  const dist = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length / Math.max(1, reviews.length));

  return (
    <div id="reviews" className="mx-5 border-t border-hairline py-12 md:mx-0">
      {rating && reviews.length > 0 ? (
        <>
          <Reveal className="text-center">
            <div className="flex items-center justify-center gap-2">
              {fav && <Laurel className="h-[88px] w-[44px] md:h-[120px] md:w-[60px]" />}
              <span className="text-[80px] font-bold leading-none md:text-[116px]">{score}</span>
              {fav && <Laurel flip className="h-[88px] w-[44px] md:h-[120px] md:w-[60px]" />}
            </div>
            {fav ? (
              <>
                <h2 className="mt-4 text-[26px] font-semibold">Guest favourite</h2>
                <p className="mx-auto mt-3 max-w-[420px] text-lg leading-6 text-muted">This home is a guest favourite based on ratings, reviews and reliability</p>
              </>
            ) : (
              <h2 className="mt-4 text-[22px] font-semibold">{plural(listing.review_count, "review")}</h2>
            )}
          </Reveal>

          <Reveal className="mt-12 grid grid-cols-2 gap-y-6 border-b border-hairline pb-10 md:grid-cols-[1.3fr_repeat(6,1fr)]">
            <div className="col-span-2 pr-6 md:col-span-1">
              <p className="mb-2 text-sm font-medium">Overall rating</p>
              <div className="space-y-1">
                {dist.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-[10px] leading-none">
                    <span className="w-2">{5 - i}</span>
                    <span className="h-1 flex-1 overflow-hidden rounded-full bg-hairline">
                      <span className="block h-full origin-left animate-[grow_1s_ease-out_both] rounded-full bg-ink" style={{ width: `${d * 100}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {CATEGORIES.map(([name, , icon]) => (
              <div key={name} className="flex flex-col justify-between border-l border-hairline pl-4 md:pl-5">
                <div><p className="text-sm font-medium">{name}</p><p className="text-sm font-semibold">{score}</p></div>
                <svg viewBox="0 0 24 24" className="mt-4 h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </div>
            ))}
          </Reveal>
        </>
      ) : (
        <h2 className="mb-8 text-[22px] font-semibold">No reviews yet</h2>
      )}

      <div className="mt-10 grid gap-x-24 gap-y-10 md:grid-cols-2">
        {reviews.map((r, i) => <Reveal key={r.id} delay={(i % 2) * 120}><Card r={r} /></Reveal>)}
      </div>
    </div>
  );
}

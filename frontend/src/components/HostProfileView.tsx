"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { PublicProfile } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import Avatar from "./Avatar";
import ListingCard from "./ListingCard";
import { MedalIcon } from "./ListingIcons";
import { StarIcon } from "./icons";

const yearsSince = (iso: string) => Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 864e5)));
const monthYear = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { month: "long", year: "numeric" });

/**
 * /users/show/[id]: someone else's profile, reached by clicking a host's photo. Same layout as
 * your own profile page: the identity card on the left, "About" with reviews and listings on the right.
 */
export default function HostProfileView({ id }: { id: number }) {
  const { user: me } = useUser();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    setData(null); setMissing(false);
    api<PublicProfile>(`/users/${id}/profile`).then(setData)
      .catch((e) => setMissing(e instanceof ApiError && e.status === 404));
  }, [id, me?.id]);

  if (missing)
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">This profile isn’t available</h1>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Back to homes</Link>
      </div>
    );
  if (!data) return <div className="mx-auto mt-10 h-64 max-w-[1000px] animate-pulse rounded-2xl bg-soft" />;

  const { user, listings, reviews, review_count, rating } = data;
  const first = user.name.split(" ")[0];
  const isHost = user.role === "host";
  const years = yearsSince(user.created_at);
  const roleLabel = isHost ? (user.is_superhost ? "Superhost" : "Host") : "Guest";
  const stats = isHost
    ? [
        { value: String(review_count), label: review_count === 1 ? "Review" : "Reviews" },
        { value: rating !== null ? rating.toFixed(2) : "–", label: "Rating", star: rating !== null },
        years > 0 ? { value: String(years), label: years === 1 ? "Year hosting" : "Years hosting" } : { value: String(Math.max(1, Math.floor((Date.now() - new Date(user.created_at).getTime()) / (30.44 * 864e5)))), label: "Months hosting" },
      ]
    : [];

  return (
    <div className="min-h-[calc(100vh-84px)] md:grid md:grid-cols-[auto_1fr]">
      <aside className="border-hairline px-5 pt-8 md:min-h-[calc(100vh-84px)] md:w-[38vw] md:max-w-[600px] md:border-r md:pl-[10vw] md:pr-10 md:pt-12">
        <div className="md:sticky md:top-28">
          <div className="flex animate-[rise_0.4s_cubic-bezier(0.2,0,0,1)_both] items-center gap-6 rounded-3xl bg-surface px-6 py-7 shadow-[0_6px_20px_rgba(0,0,0,0.2)]">
            <div className="flex flex-1 flex-col items-center text-center">
              <div className="relative">
                <Avatar user={user} className="h-[104px] w-[104px] text-5xl" />
                {user.is_superhost && (
                  <span className="absolute bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-rausch">
                    <MedalIcon className="h-4 w-4 text-white" />
                  </span>
                )}
              </div>
              <p className="mt-3 text-[32px] font-bold leading-tight tracking-tight">{first}</p>
              <p className="flex items-center gap-1 text-sm font-medium">
                {user.is_superhost && <MedalIcon className="h-3.5 w-3.5" />}{roleLabel}
              </p>
            </div>
            {stats.length > 0 && (
              <dl className="w-[96px] shrink-0 divide-y divide-hairline">
                {stats.map((s) => (
                  <div key={s.label} className="py-2.5 first:pt-0 last:pb-0">
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="flex items-center gap-1 text-[22px] font-bold leading-tight">{s.value}{s.star && <StarIcon className="h-3.5 w-3.5" />}</dd>
                    <dd className="text-[10px] font-semibold">{s.label}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <p className="mt-6 hidden text-sm text-muted md:block">On Airbnb since {monthYear(user.created_at)}</p>
        </div>
      </aside>

      <main className="min-w-0 px-5 pb-20 pt-8 md:px-[6vw] md:pt-12">
        <div className="max-w-[880px] animate-[fade-in_0.3s_ease-out_both]">
          <h1 className="text-[32px] font-semibold tracking-tight">About {first}</h1>
          <ul className="mt-6 space-y-4 text-base">
            <li className="flex items-center gap-3">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
              On Airbnb since {monthYear(user.created_at)}
            </li>
            {user.is_superhost && (
              <li className="flex items-center gap-3"><MedalIcon className="h-6 w-6" />Superhost: experienced, highly rated host</li>
            )}
            {isHost && (
              <li className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M3 11 12 4l9 7v9H3z" /><path d="M9 20v-6h6v6" /></svg>
                {listings.length === 1 ? "1 listing" : `${listings.length} listings`}
              </li>
            )}
          </ul>

          {isHost && (
            <>
              <hr className="my-10 border-hairline" />
              <h2 className="text-[22px] font-semibold tracking-tight">{first}’s reviews</h2>
              {reviews.length === 0 ? (
                <p className="mt-4 text-muted">{first} doesn’t have any reviews yet.</p>
              ) : (
                <div className="no-scrollbar -mx-5 mt-6 flex snap-x gap-4 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
                  {reviews.map((r) => (
                    <article key={r.id} className="flex h-[220px] w-[300px] shrink-0 snap-start flex-col rounded-2xl border border-hairline p-5">
                      <p className="flex items-center gap-1 text-xs">
                        {Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className={`h-2.5 w-2.5 ${i < r.rating ? "" : "opacity-20"}`} />)}
                        <span className="ml-1 font-semibold">· {monthYear(r.created_at)}</span>
                      </p>
                      <p className="mt-3 line-clamp-4 flex-1 text-base leading-6">“{r.comment || "Great stay."}”</p>
                      <div className="mt-3 flex items-center gap-3">
                        <Avatar user={r.guest} className="h-10 w-10 text-base" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{r.guest.name.split(" ")[0]}</p>
                          <Link href={`/listings/${r.listing_id}`} className="block truncate text-sm text-muted hover:underline">{r.listing_title}</Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <hr className="my-10 border-hairline" />
              <h2 className="text-[22px] font-semibold tracking-tight">{first}’s listings</h2>
              {listings.length === 0 ? (
                <p className="mt-4 text-muted">No active listings right now.</p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                  {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

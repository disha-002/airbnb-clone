"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import { parseISO } from "@/lib/dates";
import type { ListingDetail, Trip } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import Avatar from "./Avatar";

/* eslint-disable @next/next/no-img-element */
const CHECK_IN = "16:00";
const CHECK_OUT = "11:00";
const day = (d: string) => parseISO(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const short = (d: string) => parseISO(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
/** Airbnb-style confirmation code, derived from the booking so it is stable across visits. */
function code(id: number, created: string) {
  let n = (id * 2654435761 + new Date(created).getTime()) >>> 0;
  let out = "";
  for (let i = 0; i < 10; i++) { n = (n * 1664525 + 1013904223) >>> 0; out += "ABCDEFGHJKLMNPQRSTUVWXYZ"[n % 24]; }
  return out;
}

const ico = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  chat: ico(<path d="M4 5h16v11H10l-5 4v-4H4z" />),
  place: ico(<g><rect x="3" y="4" width="18" height="12" rx="1" /><path d="M8 20h8M12 16v4" /></g>),
  clock: ico(<g><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></g>),
  people: ico(<g><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.5a3 3 0 0 1 0 5.5M18 14.5c2 .7 3 2.7 3 5.5" /></g>),
  pets: ico(<g><circle cx="7" cy="9" r="1.5" /><circle cx="12" cy="6" r="1.5" /><circle cx="17" cy="9" r="1.5" /><path d="M12 12c-3 0-5 3-5 5 0 2 2 2 5 2s5 0 5-2c0-2-2-5-5-5ZM4 4l16 16" /></g>),
  party: ico(<g><path d="M5 20 9 8l7 7zM14 4l1 3M18 8l3-1M17 3v2" /><path d="M4 4l16 16" /></g>),
  smoke: ico(<g><path d="M3 15h14v3H3zM19 15v3M21 15v3M18 11c0-2 2-2 2-4" /><path d="M4 4l16 16" /></g>),
  receipt: ico(<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />),
  expense: ico(<g><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M12 8v8M8 12h8" /></g>),
  globe: ico(<g><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c-3 3-3 15 0 18M12 3c3 3 3 15 0 18" /></g>),
  help: ico(<g><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17h.01" /></g>),
  logo: ico(<path d="M12 20c-2-2-5-5-5-8a5 5 0 0 1 10 0c0 3-3 6-5 8Z" />),
};
const Chevron = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
);

function Row({ icon, title, sub, onClick, href, chevron }: { icon: React.ReactNode; title: string; sub?: string; onClick?: () => void; href?: string; chevron?: boolean }) {
  const inner = (
    <>
      {icon}
      <div className="flex-1 text-left"><p className="text-base">{title}</p>{sub && <p className="text-base text-muted">{sub}</p>}</div>
      {chevron && <Chevron />}
    </>
  );
  const cls = "group/row flex w-full items-center gap-4 border-b border-hairline py-4 transition duration-200 hover:bg-soft/60 active:scale-[0.99] [&_svg:last-child]:transition-transform [&_svg:last-child]:duration-200 hover:[&_svg:last-child]:translate-x-1";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button onClick={onClick} className={cls}>{inner}</button>;
}
const Band = () => <div className="-mx-5 h-2 bg-soft md:-mx-0 md:hidden" />;
const H = ({ children }: { children: React.ReactNode }) => <h2 className="mb-5 text-[26px] font-semibold leading-8">{children}</h2>;

export default function TripDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user, ready } = useUser();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [slide, setSlide] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const go = (d: number) => strip.current?.scrollBy({ left: d * strip.current.clientWidth, behavior: "smooth" });
  const [rules, setRules] = useState(false);
  const [bio, setBio] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    api<Trip[]>("/trips").then((ts) => {
      const t = ts.find((x) => x.id === Number(id)) ?? null;
      setTrip(t);
      if (t) api<ListingDetail>(`/listings/${t.listing_id}`).then(setListing).catch(() => {});
    }).catch(() => setTrip(null));
  }, [ready, user, id]);

  if (ready && !user)
    return <div className="px-5 py-20 text-center"><h1 className="text-2xl font-semibold">Log in to see this trip</h1><Link href="/login" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link></div>;
  if (trip === null)
    return <div className="px-5 py-20 text-center"><h1 className="text-2xl font-semibold">We couldn’t find that reservation</h1><Link href="/trips" className="mt-6 inline-block underline">Back to trips</Link></div>;
  if (!trip) return <div className="mx-auto grid max-w-[1100px] gap-16 px-5 pt-20 md:grid-cols-2 md:px-10"><div className="aspect-square animate-pulse rounded-2xl bg-soft" /><div className="space-y-4"><div className="h-8 w-2/3 animate-pulse rounded bg-soft" /><div className="h-40 animate-pulse rounded-2xl bg-soft" /></div></div>;

  const host = listing?.host;
  const first = host?.name.split(" ")[0] ?? "your host";
  const photos = listing?.photos.map((p) => p.url) ?? [trip.listing.cover_url];
  const freeUntil = new Date(parseISO(trip.check_in).getTime() - 864e5);
  const freeText = freeUntil.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const guestCount = trip.guests;

  return (
    <div className="mx-auto max-w-[1100px] animate-[slide-in_0.35s_cubic-bezier(0.2,0,0,1)_both] px-5 pb-20 md:px-10">
      <div className="flex h-16 items-center">
        <button onClick={() => router.push("/trips")} aria-label="Close" className="group flex h-10 w-10 items-center justify-center rounded-full shadow-[0_1px_6px_rgba(0,0,0,0.2)] transition hover:bg-soft active:scale-95 md:shadow-none">
          <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
      </div>

      {trip.status === "cancelled" && <p className="mb-4 rounded-xl bg-soft p-4 text-sm font-semibold">This reservation was cancelled.</p>}

      <div className="gap-16 md:grid md:grid-cols-2">
        {/* Left: hero */}
        <div className="animate-[rise_0.4s_ease-out_both]">
          <h1 className="mb-8 mt-2 text-[32px] font-semibold leading-9 tracking-tight">Your stay at {first}’s place</h1>
          <div className="relative overflow-hidden rounded-2xl">
            <div ref={strip} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth"
              onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
              {photos.slice(0, 8).map((u) => <img key={u} src={u} alt="" className="aspect-[1/1] w-full shrink-0 snap-center object-cover" />)}
            </div>
            {slide > 0 && <button onClick={() => go(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105 md:flex"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#222]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 6-6 6 6 6" /></svg></button>}
            {slide < Math.min(photos.length, 8) - 1 && <button onClick={() => go(1)} aria-label="Next photo" className="absolute right-3 top-1/2 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-105 md:flex"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[#222]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg></button>}
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {photos.slice(0, 8).map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === slide ? "w-3 bg-white" : "w-1.5 bg-white/60"}`} />)}
            </div>
          </div>
          <div className="mt-6 flex border-b border-hairline pb-6">
            <div className="flex-1"><p className="text-base font-semibold">Check-in</p><p className="mt-1 text-base text-muted">{day(trip.check_in)}</p><p className="text-base text-muted">{CHECK_IN}</p></div>
            <div className="flex-1 border-l border-hairline pl-6 text-right"><p className="text-base font-semibold">Checkout</p><p className="mt-1 text-base text-muted">{day(trip.check_out)}</p><p className="text-base text-muted">{CHECK_OUT}</p></div>
          </div>
          <Row icon={I.chat} title="Message your Host" sub={first} href="/messages" />
          <Row icon={I.place} title="Your place" sub={trip.listing.property_type + " in " + trip.listing.city} href={`/listings/${trip.listing_id}`} />
          {host && (
            <div className="border-b border-hairline py-6">
              <div className="flex items-center gap-4">
                <Link href={`/users/show/${host.id}`} aria-label={`${first}’s profile`} className="shrink-0 transition hover:opacity-90"><Avatar user={host} className="h-14 w-14 text-xl" /></Link>
                <div><p className="text-base font-semibold">Hosted by {first}</p><p className="text-sm text-muted">{host.is_superhost ? "Superhost" : "Host"}</p></div>
              </div>
              <p className={`mt-4 text-base leading-6 ${bio ? "" : "line-clamp-3"}`}>{listing?.description}</p>
              <button onClick={() => setBio(!bio)} className="mt-1 font-semibold underline">{bio ? "Show less" : "Show more"}</button>
            </div>
          )}
        </div>

        {/* Right: details */}
        <div className="animate-[rise_0.5s_ease-out_both]">
          <Band />
          <section className="animate-[rise_0.5s_ease-out_0.1s_both] py-8 md:pt-[104px]">
            <H>Reservation details</H>
            <div className="flex items-center justify-between border-b border-hairline pb-6">
              <div><p className="text-base font-semibold">Who’s coming</p><p className="mt-1 text-base text-muted">{guestCount} guest{guestCount > 1 ? "s" : ""}</p></div>
              <div className="flex -space-x-3">
                {Array.from({ length: Math.min(guestCount, 3) }, (_, i) => i === 0 && user
                  ? <Avatar key={i} user={user} className="h-12 w-12 border-2 border-surface text-lg" />
                  : <span key={i} className="flex h-12 w-12 items-end justify-center overflow-hidden rounded-full border-2 border-surface bg-[#7b8794]"><span className="h-8 w-8 rounded-full bg-[#a9b3bd] translate-y-3" /></span>)}
              </div>
            </div>
            <div className="border-b border-hairline py-6"><p className="text-base font-semibold">Confirmation code</p><p className="mt-1 text-base text-muted">{code(trip.id, trip.created_at)}</p></div>
            <div className="py-6">
              <p className="text-base font-semibold">Cancellation policy</p>
              <p className="mt-3 text-base leading-6 text-muted">Free cancellation before {CHECK_IN} on {freeText}. Cancel before check-in at {CHECK_IN} on {short(trip.check_in)} for a partial refund.</p>
              <button onClick={() => toast("Full cancellation policy is coming soon")} className="mt-1 font-semibold underline">Read more</button>
            </div>
            <Row icon={I.globe} title="Get a PDF for visa purposes" onClick={() => window.print()} chevron />
          </section>

          <Band />
          <section className="animate-[rise_0.5s_ease-out_0.2s_both] py-8">
            <H>Payment info</H>
            <div className="pb-5"><p className="text-base font-semibold">Total cost</p><p className="mt-1 text-base text-muted">{money(trip.total)}</p></div>
            <Row icon={I.expense} title="Add details for expensing your trip" onClick={() => toast("Expense details are coming soon")} chevron />
            <Row icon={I.receipt} title="Get receipt" onClick={() => window.print()} chevron />
          </section>

          <Band />
          <section className="animate-[rise_0.5s_ease-out_0.3s_both] py-8">
            <H>Get support anytime</H>
            <p className="mb-2 text-base text-muted">If you need help, we’re available 24/7 from anywhere in the world.</p>
            <Row icon={I.logo} title="Contact Airbnb Support" onClick={() => toast("Support is coming soon")} chevron />
            <Row icon={I.help} title="Visit the Help Centre" onClick={() => toast("Help Centre is coming soon")} chevron />
          </section>

          <Band />
          <section className="animate-[rise_0.5s_ease-out_0.4s_both] py-8">
            <button onClick={() => setRules(!rules)} className="flex w-full items-center justify-between text-left">
              <H>House rules</H>
              <svg viewBox="0 0 24 24" className={`mb-5 h-5 w-5 transition ${rules ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m9 6 6 6-6 6" /></svg>
            </button>
            <div className={`grid transition-all duration-300 ${rules ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden">
                <p className="mb-6 text-base leading-6">You’ll be staying in someone’s home, so please treat it with care and respect.</p>
                <h3 className="mb-2 text-[22px] font-semibold">Checking in and out</h3>
                <Row icon={I.clock} title={`Check-in after ${CHECK_IN}`} />
                <Row icon={I.clock} title={`Checkout before ${CHECK_OUT}`} />
                <h3 className="mb-2 mt-8 text-[22px] font-semibold">During your stay</h3>
                <Row icon={I.people} title={`${listing?.max_guests ?? trip.guests} guests maximum`} />
                <Row icon={I.pets} title="No pets" />
                <Row icon={I.party} title="No parties or events" />
                <Row icon={I.smoke} title="No smoking" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

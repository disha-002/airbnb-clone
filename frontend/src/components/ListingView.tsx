"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { BookedRange, addDays, iso, nightsBetween, parseISO, todayISO } from "@/lib/dates";
import { money, offerPrice, placeLabel } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import BookingCard from "./BookingCard";
import ContactHostModal from "./ContactHostModal";
import { useAuthModal } from "@/context/AuthModalContext";
import DateRangePicker from "./DateRangePicker";
import Gallery from "./Gallery";
import Modal from "./Modal";
import Reveal from "./Reveal";
import ListingReviews, { isGuestFavourite } from "./ListingReviews";
import { Laurel } from "./ListingIcons";
import { Logo } from "./icons";
import { HeartIcon, StarIcon } from "./icons";
import Avatar from "./Avatar";
import {
  AMENITY_LABEL, AmenityIcon, DeskIcon, DoorIcon, FlagIcon, KeyIcon, MedalIcon, PinIcon, PriceTagIcon, ShareIcon,
} from "./ListingIcons";

// "Room" -> "Room in Goa", the rest are whole places, like Airbnb's "Entire rental unit in Noida".
/** Airbnb opens a listing with a stay already picked: the first free night from today. */
function firstFreeNight(booked: BookedRange[]): [string, string] {
  let d = todayISO();
  for (let i = 0; i < 365 && booked.some((r) => d >= r.check_in && d < r.check_out); i++) d = iso(addDays(parseISO(d), 1));
  return [d, iso(addDays(parseISO(d), 1))];
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const fmtRating = (r: number) => r.toFixed(2).replace(/0$/, "");
const longDate = (d: string) => parseISO(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function hostingFor(since: string) {
  const months = Math.max(1, Math.floor((Date.now() - new Date(since).getTime()) / (30.44 * 864e5)));
  return months < 12 ? `${plural(months, "month")} hosting` : `${plural(Math.floor(months / 12), "year")} hosting`;
}

/** Up to three "why this place" highlights, derived from the listing's data. */
function highlights(l: ListingDetail) {
  const first = l.host.name.split(" ")[0];
  const has = (a: string) => l.amenities.some((x) => x.name === a);
  const all = [
    (l.rating ?? 0) >= 4.8 && { Icon: KeyIcon, title: "Great check-in experience", text: "Recent guests loved the smooth start to this stay." },
    (l.rating ?? 0) >= 4.6 && { Icon: PinIcon, title: "Great location", text: "Guests who stayed here in the past year loved the location." },
    l.host.is_superhost && { Icon: MedalIcon, title: `${first} is a Superhost`, text: "Superhosts are experienced, highly rated hosts." },
    has("Workspace") && { Icon: DeskIcon, title: "Dedicated workspace", text: "A common area with wifi that’s well suited for working." },
    /self check-in/i.test(l.description) && { Icon: DoorIcon, title: "Self check-in", text: "You can check in with the building staff." },
  ];
  return all.filter(Boolean).slice(0, 3) as { Icon: typeof KeyIcon; title: string; text: string }[];
}

/* eslint-disable @next/next/no-img-element */
export default function ListingView() {
  const { id } = useParams<{ id: string }>();
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const desktop = useIsDesktop();
  const { user, ready } = useUser();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [booked, setBooked] = useState<BookedRange[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [start, setStart] = useState<string | null>(sp.get("check_in"));
  const [end, setEnd] = useState<string | null>(sp.get("check_out"));
  const [guests, setGuests] = useState(Number(sp.get("guests") ?? 1) || 1);
  const [wished, setWished] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [about, setAbout] = useState(false);
  const [allAmenities, setAllAmenities] = useState(false);
  const [contact, setContact] = useState(false);
  const { openLogin } = useAuthModal();

  // Laptop: a section nav replaces the (non-sticky) header once the photos scroll away,
  // and gains a price + Reserve button once the booking card does too.
  const photosRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [showNav, setShowNav] = useState(false);
  const [navReserve, setNavReserve] = useState(false);
  useEffect(() => {
    const on = () => {
      setShowNav((photosRef.current?.getBoundingClientRect().bottom ?? 1) < 0);
      setNavReserve((cardRef.current?.getBoundingClientRect().bottom ?? 1) < 80);
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    if (!ready) return;
    Promise.all([api<ListingDetail>(`/listings/${id}`), api<BookedRange[]>(`/listings/${id}/availability`)])
      .then(([l, b]) => {
        setListing(l); setBooked(b); setWished(l.wishlisted); setGuests((g) => Math.min(g, l.max_guests));
        if (!sp.get("check_in") || !sp.get("check_out")) { const [s, e] = firstFreeNight(b); setStart(s); setEnd(e); }
      })
      .catch((e) => setError(e.message));
  }, [id, ready, user?.id]);

  // Drop dates carried over from a search if they clash with an existing booking.
  useEffect(() => {
    if (start && end && booked.some((r) => start < r.check_out && r.check_in < end)) {
      setStart(null); setEnd(null);
      toast("Those dates aren’t available for this place");
    }
  }, [booked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="px-5 py-20 text-center text-muted">{error}</p>;
  if (!listing) return <div className="mx-auto max-w-[1120px] px-5 md:px-10"><div className="aspect-[1120/423] animate-pulse rounded-xl bg-soft" /></div>;

  const toggleWish = async () => {
    if (!user) { toast("Log in to save places"); router.push("/login"); return; }
    const next = !wished;
    setWished(next);
    try { await api(`/wishlist/${listing.id}`, { method: next ? "POST" : "DELETE" }); toast(next ? "Saved to wishlist" : "Removed from wishlist"); }
    catch { setWished(!next); }
  };

  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast("Link copied"); }
    catch { toast("Couldn’t copy the link"); }
  };

  const reserve = () => {
    // Logged-out guests go to "Confirm and pay" too; step 1 there is logging in.
    if (user?.id === listing.host.id) { toast("You can’t book your own listing"); return; }
    if (!start || !end) { toast("Select your dates first"); return; }
    setReserving(true);
    setTimeout(() => setReserving(false), 8000); // safety net if navigation stalls
    router.push(`/checkout?${new URLSearchParams({ listing: String(listing.id), check_in: start, check_out: end, guests: String(guests) })}`);
  };

  const scrollTo = (section: string) => {
    const el = document.getElementById(section);
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: "smooth" });
  };

  const place = `${placeLabel(listing.property_type, listing.room_type)} in ${listing.city}, ${listing.country}`;
  const nights = start && end ? nightsBetween(start, end) : 0;
  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${listing.lng - 0.03},${listing.lat - 0.015},${listing.lng + 0.03},${listing.lat + 0.015}&layer=mapnik${listing.precise_location ? `&marker=${listing.lat},${listing.lng}` : ""}`;
  const card = (
    <BookingCard listing={listing} start={start} end={end} guests={guests} booked={booked}
      onDates={(s, e) => { setStart(s); setEnd(e); }} onGuests={setGuests} onReserve={reserve} />
  );
  const section = "border-b border-hairline py-8";
  const h2 = "text-[22px] font-semibold leading-[26px]";
  const greyBtn = "rounded-lg bg-soft px-6 py-3 text-base font-semibold transition duration-150 hover:bg-ink/10 active:scale-[0.97]";
  const ratingText = listing.rating ? fmtRating(listing.rating) : "New";

  return (
    <div className="mx-auto max-w-[1120px] px-0 pb-28 md:px-10 md:pb-16 xl:px-0">
      {reserving && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-surface/80 backdrop-blur-sm animate-[rise_0.2s_ease-out]" role="status" aria-label="Loading">
          <Logo className="h-14 w-14 animate-[logo-pulse_1s_ease-in-out_infinite] text-rausch" />
        </div>
      )}
      {/* Laptop section nav */}
      <div className={`fixed inset-x-0 top-0 z-40 hidden border-b border-hairline bg-surface transition-opacity duration-200 md:block ${showNav ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div className="mx-auto flex h-20 max-w-[1120px] items-center justify-between px-10 xl:px-0">
          <nav className="flex h-full gap-6 text-sm font-medium">
            {[["photos", "Photos"], ["amenities", "Amenities"], ["reviews", "Reviews"], ["location", "Location"]].map(([key, label]) => (
              <button key={key} onClick={() => key === "photos" ? window.scrollTo({ top: 0, behavior: "smooth" }) : scrollTo(key)}
                className="h-full border-b-4 border-transparent pt-1 hover:border-ink">{label}</button>
            ))}
          </nav>
          {navReserve && listing.is_active && (
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-base">{listing.discount_pct > 0 && <s className="mr-1 text-muted">{money(listing.price_per_night)}</s>}<span className="font-semibold">{money(offerPrice(listing))}</span> night</p>
                {listing.rating && <p className="flex items-center justify-end gap-1 text-xs"><StarIcon className="h-2.5 w-2.5" /> {ratingText} · <span className="text-muted">{plural(listing.review_count, "review")}</span></p>}
              </div>
              <button onClick={start && end ? reserve : () => scrollTo("booking")}
                className="rounded-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 py-3 font-semibold text-white">
                {start && end ? "Reserve" : "Check availability"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title row (laptop) */}
      <div className="hidden items-end justify-between gap-6 pb-6 pt-2 md:flex">
        <h1 className="text-[26px] font-semibold leading-[30px]">{listing.title}</h1>
        <div className="flex shrink-0 items-center gap-2 text-sm font-semibold">
          <button onClick={share} className="flex items-center gap-2 rounded-lg px-2 py-1.5 underline hover:bg-soft"><ShareIcon className="h-4 w-4" /> Share</button>
          <button onClick={toggleWish} className="flex items-center gap-2 rounded-lg px-2 py-1.5 underline hover:bg-soft">
            <HeartIcon className="h-4 w-4" fill={wished ? "#FF385C" : "none"} /> {wished ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {!listing.is_active && (
        <div className="mx-5 mb-4 rounded-xl border border-hairline bg-soft p-4 text-sm md:mx-0">
          <p className="font-semibold">This place is no longer available</p>
          <p className="text-muted">The host has removed this listing. You can still see its details and reviews.</p>
        </div>
      )}
      <div ref={photosRef} id="photos"><Gallery photos={listing.photos} title={listing.title} /></div>

      <div className="px-5 md:grid md:grid-cols-[58.33%_33.33%] md:justify-between md:px-0">
        <div>
          {/* Summary */}
          <div className="border-b border-hairline pb-8 pt-6 md:pt-8">
            <h1 className="mb-4 text-[26px] font-semibold leading-[30px] md:hidden">{listing.title}</h1>
            <h2 className={h2}>{place}</h2>
            <p className="mt-1 text-base">
              {plural(listing.max_guests, "guest")} · {plural(listing.bedrooms, "bedroom")} · {plural(listing.beds, "bed")} · {plural(listing.bathrooms, "bathroom")}
            </p>
            {isGuestFavourite(listing) ? (
              <div className="mt-6 flex items-center rounded-2xl border border-hairline px-4 py-5 sm:px-8">
                <div className="flex items-center gap-1 text-center text-base font-semibold leading-5 sm:text-[22px] sm:leading-6">
                  <Laurel className="h-9 w-[18px] sm:h-12 sm:w-6" /><span>Guest<br />favourite</span><Laurel flip className="h-9 w-[18px] sm:h-12 sm:w-6" />
                </div>
                <p className="mx-4 flex-1 text-sm font-medium leading-5 sm:mx-8 sm:text-base">One of the most loved homes on Airbnb, according to guests</p>
                <button onClick={() => scrollTo("reviews")} className="px-3 text-center">
                  <span className="block text-lg font-semibold leading-5">{ratingText}</span>
                  <span className="mt-1 flex justify-center gap-px">{Array.from({ length: 5 }, (_, i) => <StarIcon key={i} className="h-2 w-2" />)}</span>
                </button>
                <button onClick={() => scrollTo("reviews")} className="hidden border-l border-hairline pl-4 text-center sm:block">
                  <span className="block text-lg font-semibold leading-5">{listing.review_count}</span>
                  <span className="text-xs">Reviews</span>
                </button>
              </div>
            ) : (
              <p className="mt-1 flex items-center gap-1 text-base font-semibold">
                {listing.rating
                  ? <><StarIcon className="h-3 w-3" /> {ratingText} · <button onClick={() => scrollTo("reviews")} className="underline">{plural(listing.review_count, "review")}</button></>
                  : "New"}
              </p>
            )}
          </div>

          {/* Host */}
          <div className="flex items-center gap-5 border-b border-hairline py-6">
            <Link href={`/users/show/${listing.host.id}`} aria-label={`${listing.host.name.split(" ")[0]}’s profile`} className="relative shrink-0 transition hover:opacity-90">
              <Avatar user={listing.host} className="h-10 w-10 text-base" />
              {listing.host.is_superhost && (
                <span className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-surface bg-rausch">
                  <MedalIcon className="h-2.5 w-2.5 text-white" />
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold">Hosted by <Link href={`/users/show/${listing.host.id}`} className="hover:underline">{listing.host.name.split(" ")[0]}</Link></p>
              <p className="text-sm text-muted">{listing.host.is_superhost ? "Superhost · " : ""}{hostingFor(listing.host.created_at)}</p>
            </div>
            {listing.is_active && user?.id !== listing.host.id && (
              <button onClick={() => (user ? setContact(true) : openLogin())}
                className="shrink-0 rounded-lg bg-soft px-4 py-2.5 text-sm font-semibold hover:bg-ink/10">Message host</button>
            )}
          </div>

          {/* Highlights */}
          {highlights(listing).length > 0 && (
            <Reveal className={`space-y-6 ${section}`}>
              {highlights(listing).map(({ Icon, title, text }) => (
                <div key={title} className="flex gap-6">
                  <Icon className="mt-0.5 h-6 w-6 shrink-0" />
                  <div><p className="text-base font-semibold">{title}</p><p className="text-sm text-muted">{text}</p></div>
                </div>
              ))}
            </Reveal>
          )}

          {/* Description */}
          <Reveal className={section}>
            <p className="line-clamp-6 whitespace-pre-line text-base leading-[22px]">{listing.description}</p>
            <button onClick={() => setAbout(true)} className={`mt-8 ${greyBtn}`}>Show more</button>
          </Reveal>

          {/* Amenities */}
          <Reveal className={section}><div id="amenities">
            <h2 className={`mb-3 ${h2}`}>What this place offers</h2>
            <ul className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {listing.amenities.slice(0, 10).map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3 text-base"><AmenityIcon name={a.name} />{AMENITY_LABEL[a.name] ?? a.name}</li>
              ))}
            </ul>
            <button onClick={() => setAllAmenities(true)} className={`mt-8 ${greyBtn}`}>Show all {listing.amenities.length} amenities</button>
          </div></Reveal>

          {/* Calendar */}
          <Reveal className="py-8">
            <h2 className={h2}>{nights ? `${plural(nights, "night")} in ${listing.city}` : "Select check-in date"}</h2>
            <p className="mb-6 mt-2 text-sm text-muted">
              {start && end ? `${longDate(start)} - ${longDate(end)}` : "Add your travel dates for exact pricing"}
            </p>
            <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} booked={booked} months={desktop ? 2 : 1} />
            {(start || end) && (
              <div className="mt-4 text-right">
                <button onClick={() => { setStart(null); setEnd(null); }} className="text-sm font-semibold underline">Clear dates</button>
              </div>
            )}
          </Reveal>
        </div>

        {/* Laptop: price note + booking card, sticky beside the left column */}
        <aside className="hidden pt-8 md:block">
          {listing.is_active && (
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center justify-center gap-3 rounded-2xl border border-hairline/70 bg-surface px-6 py-5 text-base font-medium shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
                <PriceTagIcon className="h-7 w-7" /> Prices include all fees
              </div>
              <div id="booking" ref={cardRef}>{card}</div>
              <button onClick={() => toast("Reporting listings is coming soon")}
                className="mx-auto flex items-center gap-3 text-sm font-semibold text-muted">
                <FlagIcon className="h-4 w-4" /><span className="underline">Report this listing</span>
              </button>
            </div>
          )}
        </aside>
      </div>

      <ListingReviews listing={listing} />

      {/* Location */}
      <div id="location" className="mx-5 border-t border-hairline py-12 md:mx-0">
        <h2 className={`mb-6 ${h2}`}>Where you’ll be</h2>
        <p className="mb-6 text-base">{listing.city}, {listing.country}</p>
        {!listing.precise_location && <p className="-mt-4 mb-6 text-sm text-muted">Exact location provided after booking.</p>}
        <iframe title="Map" src={mapSrc} className="h-[480px] w-full rounded-xl border-0" loading="lazy" />
      </div>

      {/* Phone: sticky reserve bar -> opens the booking card in a sheet */}
      {listing.is_active && <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-hairline bg-surface px-5 py-3 md:hidden">
        <div>
          <p className="font-semibold">{listing.discount_pct > 0 && <s className="mr-1 font-normal text-muted">{money(listing.price_per_night)}</s>}{money(offerPrice(listing))} <span className="font-normal">night</span></p>
          <button onClick={() => setSheet(true)} className="text-sm underline">{start && end ? "Change dates" : "Add dates"}</button>
        </div>
        <button onClick={() => (start && end ? reserve() : setSheet(true))}
          className="rounded-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-8 py-3 font-semibold text-white">
          {start && end ? "Reserve" : "Check availability"}
        </button>
      </div>}
      <Modal open={sheet} onClose={() => setSheet(false)} title="Reserve">{card}</Modal>

      <ContactHostModal listing={listing} open={contact} onClose={() => setContact(false)} />
      <Modal open={about} onClose={() => setAbout(false)} title="About this space" wide>
        <p className="whitespace-pre-line text-base leading-7">{listing.description}</p>
      </Modal>
      <Modal open={allAmenities} onClose={() => setAllAmenities(false)} title="What this place offers">
        <ul className="divide-y divide-hairline">
          {listing.amenities.map((a) => (
            <li key={a.id} className="flex items-center gap-4 py-5 text-base"><AmenityIcon name={a.name} className="h-7 w-7" />{AMENITY_LABEL[a.name] ?? a.name}</li>
          ))}
        </ul>
      </Modal>
    </div>
  );
}

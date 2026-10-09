"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { BookedRange } from "@/lib/dates";
import { money } from "@/lib/format";
import type { ListingDetail } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import BookingCard from "./BookingCard";
import DateRangePicker from "./DateRangePicker";
import Gallery from "./Gallery";
import Modal from "./Modal";
import { HeartIcon, StarIcon } from "./icons";

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

  useEffect(() => {
    if (!ready) return;
    Promise.all([api<ListingDetail>(`/listings/${id}`), api<BookedRange[]>(`/listings/${id}/availability`)])
      .then(([l, b]) => { setListing(l); setBooked(b); setWished(l.wishlisted); setGuests((g) => Math.min(g, l.max_guests)); })
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
  if (!listing) return <div className="mx-auto max-w-[1120px] px-5 md:px-10"><div className="h-[420px] animate-pulse rounded-2xl bg-soft" /></div>;

  const toggleWish = async () => {
    if (!user) { toast("Log in to save places"); router.push("/login"); return; }
    const next = !wished;
    setWished(next);
    try { await api(`/wishlist/${listing.id}`, { method: next ? "POST" : "DELETE" }); toast(next ? "Saved to wishlist" : "Removed from wishlist"); }
    catch { setWished(!next); }
  };

  const reserve = () => {
    if (!user) { toast("Log in to book this place"); router.push("/login"); return; }
    if (user.id === listing.host.id) { toast("You can’t book your own listing"); return; }
    if (!start || !end) { toast("Select your dates first"); return; }
    router.push(`/checkout?${new URLSearchParams({ listing: String(listing.id), check_in: start, check_out: end, guests: String(guests) })}`);
  };

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${listing.lng - 0.03},${listing.lat - 0.015},${listing.lng + 0.03},${listing.lat + 0.015}&layer=mapnik&marker=${listing.lat},${listing.lng}`;
  const card = (
    <BookingCard listing={listing} start={start} end={end} guests={guests} booked={booked}
      onDates={(s, e) => { setStart(s); setEnd(e); }} onGuests={setGuests} onReserve={reserve} />
  );

  return (
    <div className="mx-auto max-w-[1120px] px-0 pb-28 md:px-10 md:pb-10">
      <div className="px-5 md:px-0">
        <h1 className="mb-4 hidden text-[26px] font-semibold md:block">{listing.title}</h1>
      </div>
      <Gallery photos={listing.photos} title={listing.title} />

      <div className="grid gap-16 px-5 pt-6 md:grid-cols-[1fr_370px] md:px-0">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[22px] font-semibold md:hidden">{listing.title}</h1>
              <h2 className="text-[22px] font-semibold">{listing.property_type} in {listing.city}, {listing.country}</h2>
              <p className="mt-1 text-[15px]">
                {listing.max_guests} guests · {listing.bedrooms} bedroom{listing.bedrooms !== 1 ? "s" : ""} · {listing.beds} bed{listing.beds !== 1 ? "s" : ""} · {listing.bathrooms} bath{listing.bathrooms !== 1 ? "s" : ""}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[15px] font-medium">
                {listing.rating ? <><StarIcon className="h-3.5 w-3.5" /> {listing.rating.toFixed(2).replace(/0$/, "")} · <span className="underline">{listing.review_count} reviews</span></> : "New"}
              </p>
            </div>
            <button onClick={toggleWish} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold underline hover:bg-soft">
              <HeartIcon className="h-5 w-5" fill={wished ? "#FF385C" : "none"} /> Save
            </button>
          </div>

          <hr className="my-6 border-hairline" />
          <div className="flex items-center gap-4">
            <img src={listing.host.avatar_url} alt="" className="h-12 w-12 rounded-full bg-soft" />
            <div>
              <p className="font-semibold">Hosted by {listing.host.name}</p>
              <p className="text-sm text-muted">{listing.host.is_superhost ? "Superhost" : "Host"}</p>
            </div>
          </div>

          <hr className="my-6 border-hairline" />
          <p className="whitespace-pre-line leading-7">{listing.description}</p>

          <hr className="my-6 border-hairline" />
          <h2 className="mb-5 text-[22px] font-semibold">What this place offers</h2>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {listing.amenities.map((a) => <li key={a.id} className="flex items-center gap-3"><span className="text-lg">✓</span>{a.name}</li>)}
          </ul>

          <hr className="my-6 border-hairline" />
          <h2 className="mb-1 text-[22px] font-semibold">{start && end ? "Your dates" : "Select check-in date"}</h2>
          <p className="mb-5 text-sm text-muted">Crossed-out dates are already booked.</p>
          <DateRangePicker start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} booked={booked} months={desktop ? 2 : 1} />

          <hr className="my-6 border-hairline" />
          <h2 className="mb-6 flex items-center gap-2 text-[22px] font-semibold">
            <StarIcon className="h-5 w-5" /> {listing.rating ? listing.rating.toFixed(2).replace(/0$/, "") : "New"} · {listing.review_count} reviews
          </h2>
          <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
            {listing.reviews.map((r) => (
              <div key={r.id}>
                <div className="mb-2 flex items-center gap-3">
                  <img src={r.guest.avatar_url} alt="" className="h-10 w-10 rounded-full bg-soft" />
                  <div><p className="font-semibold">{r.guest.name}</p><p className="text-sm text-muted">{new Date(r.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p></div>
                </div>
                <p className="text-sm text-muted">{"★".repeat(r.rating)}</p>
                <p className="mt-1">{r.comment}</p>
              </div>
            ))}
            {listing.reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
          </div>

          <hr className="my-6 border-hairline" />
          <h2 className="mb-4 text-[22px] font-semibold">Where you’ll be</h2>
          <p className="mb-4 text-sm">{listing.city}, {listing.country}</p>
          <iframe title="Map" src={mapSrc} className="h-72 w-full rounded-2xl border-0" loading="lazy" />
        </div>

        <aside className="hidden md:block"><div className="sticky top-24">{card}</div></aside>
      </div>

      {/* Phone: sticky reserve bar -> opens the booking card in a sheet */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-hairline bg-white px-5 py-3 md:hidden">
        <div>
          <p className="font-semibold">{money(listing.price_per_night)} <span className="font-normal">night</span></p>
          <button onClick={() => setSheet(true)} className="text-sm underline">{start && end ? "Change dates" : "Add dates"}</button>
        </div>
        <button onClick={() => (start && end ? reserve() : setSheet(true))}
          className="rounded-lg bg-gradient-to-r from-[#E61E4D] to-[#D70466] px-8 py-3 font-semibold text-white">
          {start && end ? "Reserve" : "Check availability"}
        </button>
      </div>
      <Modal open={sheet} onClose={() => setSheet(false)} title="Reserve">{card}</Modal>
    </div>
  );
}

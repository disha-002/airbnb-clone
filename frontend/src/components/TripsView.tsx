"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { fmtShort, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import Modal from "./Modal";

/* eslint-disable @next/next/no-img-element */
function TripCard({ t, onCancel, onReview }: { t: Trip; onCancel: () => void; onReview: () => void }) {
  const past = t.check_out < todayISO();
  return (
    <div className="flex gap-4 rounded-2xl border border-hairline p-4">
      <Link href={`/listings/${t.listing_id}`}>
        <img src={t.listing.cover_url} alt="" className="h-28 w-28 rounded-xl object-cover md:h-32 md:w-40" />
      </Link>
      <div className="flex-1">
        <Link href={`/listings/${t.listing_id}`} className="font-semibold hover:underline">{t.listing.property_type} in {t.listing.city}</Link>
        <p className="text-sm text-muted">{fmtShort(t.check_in)} – {fmtShort(t.check_out)} · {t.guests} guest{t.guests > 1 ? "s" : ""}</p>
        <p className="mt-1 text-sm">Total {money(t.total)}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {t.status === "cancelled" && <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">Cancelled</span>}
          {t.status === "confirmed" && !past && <button onClick={onCancel} className="rounded-lg border border-ink px-3 py-1.5 text-sm font-semibold">Cancel booking</button>}
          {t.status === "confirmed" && past && !t.reviewed && <button onClick={onReview} className="rounded-lg border border-ink px-3 py-1.5 text-sm font-semibold">Leave a review</button>}
          {t.status === "confirmed" && past && t.reviewed && <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">★ Reviewed</span>}
          {!t.listing.is_active && <span className="rounded-full bg-soft px-3 py-1 text-xs font-semibold text-muted">No longer listed</span>}
        </div>
      </div>
    </div>
  );
}

export default function TripsView() {
  const sp = useSearchParams();
  const toast = useToast();
  const { user, ready } = useUser();
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [reviewing, setReviewing] = useState<Trip | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const load = useCallback(() => api<Trip[]>("/trips").then(setTrips).catch(() => setTrips([])), []);
  useEffect(() => { if (ready && user) load(); }, [ready, user, load]);

  if (ready && !user)
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Log in to see your trips</h1>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );

  const cancel = async (t: Trip) => {
    if (!window.confirm("Cancel this booking? The dates will be released.")) return;
    try { await api(`/bookings/${t.id}`, { method: "DELETE" }); toast("Booking cancelled"); load(); }
    catch (e) { toast((e as Error).message); }
  };

  const submitReview = async () => {
    if (!reviewing) return;
    try {
      await api(`/listings/${reviewing.listing_id}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment }) });
      toast("Thanks for your review!");
      setReviewing(null); setComment(""); setRating(5);
      load();
    } catch (e) { toast((e as Error).message); }
  };

  const today = todayISO();
  const upcoming = trips?.filter((t) => t.status === "confirmed" && t.check_out >= today) ?? [];
  const past = trips?.filter((t) => t.status === "confirmed" && t.check_out < today) ?? [];
  const cancelled = trips?.filter((t) => t.status === "cancelled") ?? [];

  const section = (title: string, list: Trip[]) =>
    list.length > 0 && (
      <section className="mb-10">
        <h2 className="mb-4 text-[22px] font-semibold">{title}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((t) => <TripCard key={t.id} t={t} onCancel={() => cancel(t)} onReview={() => setReviewing(t)} />)}
        </div>
      </section>
    );

  return (
    <div className="mx-auto max-w-[1100px] px-5 md:px-10">
      <h1 className="mb-6 text-[28px] font-semibold">Trips</h1>
      {sp.get("confirmed") && (
        <div className="mb-8 rounded-2xl bg-[#1E7F4F]/10 p-5 font-medium text-[#1E7F4F]">🎉 Your trip is booked! Those dates are now blocked on the listing.</div>
      )}
      {trips === null && <div className="h-40 animate-pulse rounded-2xl bg-soft" />}
      {trips?.length === 0 && (
        <div className="py-10">
          <h2 className="text-xl font-semibold">No trips booked… yet!</h2>
          <p className="mt-1 text-muted">Time to dust off your bags and start planning your next adventure.</p>
          <Link href="/" className="mt-5 inline-block rounded-lg border border-ink px-5 py-2.5 font-semibold">Start searching</Link>
        </div>
      )}
      {section("Upcoming", upcoming)}
      {section("Where you’ve been", past)}
      {section("Cancelled", cancelled)}

      <Modal open={!!reviewing} onClose={() => setReviewing(null)} title="Leave a review"
        footer={<><span /><button onClick={submitReview} className="rounded-lg bg-ink px-6 py-3 font-semibold text-surface">Submit</button></>}>
        <p className="mb-3 font-semibold">How was your stay?</p>
        <div className="mb-5 flex gap-1 text-3xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={n <= rating ? "text-ink" : "text-ink/20"}>★</button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={5} placeholder="Share your experience"
          className="w-full rounded-xl border border-hairline p-4 outline-none focus:border-ink" />
      </Modal>
    </div>
  );
}

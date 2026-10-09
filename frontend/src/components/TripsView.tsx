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
function TripCard({ t, i, onCancel, onReview }: { t: Trip; i: number; onCancel: () => void; onReview: () => void }) {
  const past = t.check_out < todayISO();
  const cancelled = t.status === "cancelled";
  const chip = cancelled ? "Cancelled" : !t.listing.is_active ? "No longer listed" : null;
  const btn = "rounded-lg border border-ink px-4 py-2 text-sm font-semibold transition hover:bg-soft active:scale-[0.97]";
  return (
    <div className="group animate-[rise_0.5s_cubic-bezier(0.2,0,0,1)_both] transition-transform duration-300 hover:-translate-y-1" style={{ animationDelay: `${i * 70}ms` }}>
      <Link href={`/trips/${t.id}`} className="relative block overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-shadow duration-300 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
        <img src={t.listing.cover_url} alt="" className={`aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105 ${cancelled ? "grayscale" : ""}`} />
        {chip && <span className="absolute left-3 top-3 rounded-full bg-surface px-3 py-1 text-xs font-semibold shadow">{chip}</span>}
      </Link>
      <Link href={`/trips/${t.id}`} className="mt-3 block text-base font-semibold hover:underline">{t.listing.property_type} in {t.listing.city}</Link>
      <p className="text-sm text-muted">{fmtShort(t.check_in)} – {fmtShort(t.check_out)} · {t.guests} guest{t.guests > 1 ? "s" : ""}</p>
      <p className="text-sm text-muted">Total {money(t.total)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {!cancelled && !past && <button onClick={onCancel} className={btn}>Cancel booking</button>}
        {!cancelled && past && !t.reviewed && <button onClick={onReview} className={btn}>Leave a review</button>}
        {!cancelled && past && t.reviewed && <span className="rounded-full bg-soft px-3 py-1.5 text-xs font-semibold text-muted">★ Reviewed</span>}
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
  const [cancelling, setCancelling] = useState<Trip | null>(null);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const closeReview = () => { setReviewing(null); setComment(""); setRating(5); };

  const load = useCallback(() => api<Trip[]>("/trips").then(setTrips).catch(() => setTrips([])), []);
  useEffect(() => { if (ready && user) load(); }, [ready, user, load]);

  if (ready && !user)
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Log in to see your trips</h1>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );

  const confirmCancel = async () => {
    if (!cancelling) return;
    setBusy(true);
    try { await api(`/bookings/${cancelling.id}`, { method: "DELETE" }); toast("Booking cancelled"); setCancelling(null); load(); }
    catch (e) { toast((e as Error).message); }
    finally { setBusy(false); }
  };

  const submitReview = async () => {
    if (!reviewing) return;
    setBusy(true);
    try {
      await api(`/listings/${reviewing.listing_id}/reviews`, { method: "POST", body: JSON.stringify({ rating, comment: comment.trim() }) });
      toast("Thanks for your review!");
      closeReview();
      load();
    } catch (e) { toast((e as Error).message); }
    finally { setBusy(false); }
  };

  const today = todayISO();
  const upcoming = trips?.filter((t) => t.status === "confirmed" && t.check_out >= today) ?? [];
  const past = trips?.filter((t) => t.status === "confirmed" && t.check_out < today) ?? [];
  const cancelled = trips?.filter((t) => t.status === "cancelled") ?? [];

  const section = (title: string, list: Trip[]) =>
    list.length > 0 && (
      <section className="mb-14">
        <h2 className="mb-6 text-[22px] font-semibold">{title}</h2>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t, i) => <TripCard key={t.id} i={i} t={t} onCancel={() => setCancelling(t)} onReview={() => setReviewing(t)} />)}
        </div>
      </section>
    );

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-16 md:px-10">
      <h1 className="mb-8 mt-4 text-[32px] font-semibold tracking-tight">Trips</h1>
      {sp.get("confirmed") && (
        <div className="mb-8 rounded-2xl bg-[#1E7F4F]/10 p-5 font-medium text-[#1E7F4F]">🎉 Your trip is booked! Those dates are now blocked on the listing.</div>
      )}
      {trips === null && (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => <div key={i}><div className="aspect-[4/3] animate-pulse rounded-2xl bg-soft" /><div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-soft" /><div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-soft" /></div>)}
        </div>
      )}
      {trips?.length === 0 && (
        <div className="border-b border-hairline pb-12 pt-4">
          <h2 className="text-[22px] font-semibold">No trips booked… yet!</h2>
          <p className="mt-2 text-base text-muted">Time to dust off your bags and start planning your next adventure.</p>
          <Link href="/" className="mt-6 inline-block rounded-lg border border-ink px-6 py-3 text-base font-semibold transition hover:bg-soft">Start searching</Link>
        </div>
      )}
      {section("Upcoming reservations", upcoming)}
      {section("Where you’ve been", past)}
      {section("Cancelled", cancelled)}

      {cancelling && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Cancel booking">
          <div className="absolute inset-0 animate-[rise_0.15s_ease-out] bg-black/50" onClick={() => !busy && setCancelling(null)} />
          <div className="relative w-full animate-[rise_0.25s_ease-out] rounded-t-3xl bg-surface p-6 shadow-2xl md:max-w-[480px] md:rounded-3xl md:p-8">
            <button onClick={() => !busy && setCancelling(null)} aria-label="Close" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-soft">×</button>
            <h2 className="pr-8 text-[22px] font-semibold leading-7">Cancel your stay in {cancelling.listing.city}?</h2>
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-hairline p-3">
              <img src={cancelling.listing.cover_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <p className="font-semibold">{cancelling.listing.property_type} in {cancelling.listing.city}</p>
                <p className="text-sm text-muted">{fmtShort(cancelling.check_in)} – {fmtShort(cancelling.check_out)} · {cancelling.guests} guest{cancelling.guests > 1 ? "s" : ""}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-sm text-muted">
              <li>• These dates will open up for other guests.</li>
              <li>• You’ll lose this reservation of {money(cancelling.total)}. It can’t be undone.</li>
            </ul>
            <div className="mt-7 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
              <button onClick={() => setCancelling(null)} disabled={busy} className="rounded-lg px-4 py-3 text-base font-semibold underline">Keep booking</button>
              <button onClick={confirmCancel} disabled={busy}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 py-3 text-base font-semibold text-white transition active:scale-[0.97] disabled:opacity-60">
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {busy ? "Cancelling…" : "Yes, cancel booking"}
              </button>
            </div>
          </div>
        </div>
      )}

      {trips !== null && (
        <p className="border-t border-hairline pt-8 text-base">
          Can’t find your reservation here? <Link href="/" className="font-semibold underline">Visit the Help Centre</Link>
        </p>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Leave a review">
          <div className="absolute inset-0 animate-[fade-in_0.15s_ease-out] bg-black/50" onClick={() => !busy && closeReview()} />
          <div className="relative max-h-[92vh] w-full animate-[rise_0.25s_ease-out] overflow-y-auto rounded-t-3xl bg-surface p-6 shadow-2xl md:max-w-[560px] md:rounded-3xl md:p-8">
            <button onClick={closeReview} aria-label="Close" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-xl hover:bg-soft">×</button>
            <h2 className="pr-8 text-[22px] font-semibold leading-7">How was your stay in {reviewing.listing.city}?</h2>
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-hairline p-3">
              <img src={reviewing.listing.cover_url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <p className="font-semibold">{reviewing.listing.property_type} in {reviewing.listing.city}</p>
                <p className="text-sm text-muted">{fmtShort(reviewing.check_in)} – {fmtShort(reviewing.check_out)}</p>
              </div>
            </div>

            <p className="mb-3 mt-7 font-semibold">How was your stay?</p>
            <div className="mb-5 flex gap-1 text-3xl">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className={n <= rating ? "text-ink" : "text-ink/20"}>★</button>
              ))}
            </div>

            <label className="block text-base font-semibold" htmlFor="review-text">Tell future guests about it</label>
            <textarea id="review-text" value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} rows={5}
              placeholder="What did you like? Was the place as described? How was the host?"
              className="mt-2 w-full resize-none rounded-xl border border-hairline p-4 text-base outline-none transition focus:border-ink focus:ring-1 focus:ring-ink" />
            <p className="mt-1 text-right text-xs text-muted">{comment.length}/500</p>

            <div className="mt-5 flex flex-col-reverse gap-3 md:flex-row md:items-center md:justify-between">
              <button onClick={closeReview} disabled={busy} className="rounded-lg px-4 py-3 text-base font-semibold underline">Not now</button>
              <button onClick={submitReview} disabled={busy || !comment.trim()}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-8 py-3 text-base font-semibold text-white transition active:scale-[0.97] disabled:opacity-50">
                {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                {busy ? "Submitting…" : "Submit review"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

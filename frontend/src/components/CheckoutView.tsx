"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { BookedRange, nightsBetween, parseISO } from "@/lib/dates";
import { money } from "@/lib/format";
import type { Booking, ListingDetail, Quote } from "@/lib/types";
import { useAuthModal } from "@/context/AuthModalContext";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import DateRangePicker from "./DateRangePicker";
import Modal from "./Modal";
import { ArrowRight, StarIcon } from "./icons";
import Avatar from "./Avatar";

/** ₹3,505.00 - checkout shows paise, like Airbnb's. */
const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** "9–10 Oct 2026", or "30 Oct – 2 Nov 2026" across months. */
function stayDates(a: string, b: string) {
  const s = parseISO(a), e = parseISO(b);
  const month = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  return s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()
    ? `${s.getDate()}–${e.getDate()} ${month(e)} ${e.getFullYear()}`
    : `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)} ${e.getFullYear()}`;
}

const Laurel = () => (
  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden>
    <path d="M5 14C2.5 12 1.5 9 2 5M2.5 8.5 4 9.5M2 5.5l1.5 1M11 14c2.5-2 3.5-5 3-9M13.5 8.5 12 9.5M14 5.5l-1.5 1" />
  </svg>
);

const LOGGED_OUT_STEPS = ["Log in or sign up", "Add a payment method", "Review your reservation"];

/** The host's welcome note shown above the message box (messaging itself is a placeholder). */
const welcomeNote = (l: ListingDetail) =>
  `Hi! Welcome to my place in ${l.city}, and thank you for choosing to stay with us. Check-in is flexible and I’m happy to ` +
  "share local tips. The home is exactly as shown in the photos, and we’ve prepared everything to make your stay relaxing. Enjoy your stay!";

/* eslint-disable @next/next/no-img-element */
export default function CheckoutView() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const desktop = useIsDesktop();
  const { user, ready } = useUser();
  const { openLogin } = useAuthModal();

  const listingId = sp.get("listing");
  const checkIn = sp.get("check_in");
  const checkOut = sp.get("check_out");
  const guests = Number(sp.get("guests") ?? 1) || 1;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [booked, setBooked] = useState<BookedRange[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [confirmed, setConfirmed] = useState<Booking | null>(null); // set once payment is approved
  const [message, setMessage] = useState("");
  const [needMessage, setNeedMessage] = useState(false);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const [editing, setEditing] = useState<null | "dates" | "guests" | "breakdown" | "policy" | "payment">(null);
  const [draft, setDraft] = useState<{ start: string | null; end: string | null; guests: number }>({ start: checkIn, end: checkOut, guests });

  useEffect(() => { window.scrollTo(0, 0); }, []); // arriving from a scrolled listing page

  useEffect(() => {
    if (!listingId) return;
    Promise.all([api<ListingDetail>(`/listings/${listingId}`), api<BookedRange[]>(`/listings/${listingId}/availability`)])
      .then(([l, b]) => { setListing(l); setBooked(b); })
      .catch((e) => setError(e.message));
  }, [listingId]);

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut) return;
    setQuote(null);
    api<Quote>(`/listings/${listingId}/quote?check_in=${checkIn}&check_out=${checkOut}`).then(setQuote).catch((e) => setError(e.message));
  }, [listingId, checkIn, checkOut]);

  if (!listingId || !checkIn || !checkOut)
    return <p className="px-5 py-20 text-center text-muted">Missing booking details. <Link href="/" className="underline">Back to explore</Link></p>;


  const update = (next: { check_in?: string; check_out?: string; guests?: number }) => {
    const q = new URLSearchParams({ listing: listingId, check_in: checkIn, check_out: checkOut, guests: String(guests) });
    Object.entries(next).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    router.replace(`/checkout?${q}`);
  };

  const pay = async () => {
    setPaying(true); setError(null);
    try {
      // Mocked payment: nothing about the card is sent anywhere.
      const b = await api<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify({ listing_id: Number(listingId), check_in: checkIn, check_out: checkOut, guests, message: message.trim() }),
      });
      // Payment approved: swap the payment dialog for the acknowledgement dialog (see `goHome`).
      setEditing(null);
      setPaying(false);
      setConfirmed(b);
    } catch (e) {
      setError((e as Error).message);
      setPaying(false);
    }
  };

  // `replace`, not `push`: the Back button shouldn't return to a checkout that has already been paid.
  const goHome = () => router.replace("/");

  // Like Airbnb: no payment until the guest has written to the host.
  const continueToPayment = () => {
    if (!message.trim()) {
      setNeedMessage(true);
      messageRef.current?.focus();
      messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError(null);
    setEditing("payment");
  };

  const nights = nightsBetween(checkIn, checkOut);
  const greyBtn = "rounded-lg bg-soft px-3 py-1.5 text-[13px] font-semibold hover:bg-ink/10";
  const pinkBtn = "rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 py-3 text-base font-semibold text-white disabled:opacity-50";

  const favourite = !!listing && (listing.is_superhost || (listing.rating ?? 0) >= 4.85);

  return (
    <div className="mx-auto max-w-[1056px] px-5 pb-20 pt-2 md:px-10 md:pt-8">
      <div className="relative mb-6 flex items-center gap-4">
        <button onClick={() => router.back()} aria-label="Back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-soft hover:bg-ink/10 xl:absolute xl:-left-[68px]">
          <ArrowRight className="h-4 w-4 rotate-180" />
        </button>
        <h1 className="text-[26px] font-semibold tracking-tight md:text-[30px]">Confirm and pay</h1>
      </div>

      <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_370px] md:gap-16 lg:gap-20">
        <div className="order-2 md:order-1">
          {!user ? (
            // Logged out: log in first (in a dialog over this page), then pay.
            <div className="space-y-5">
              <section className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-6 shadow-[0_6px_20px_rgba(0,0,0,0.18)] ring-1 ring-black/5">
                <h2 className="text-lg font-semibold">1. {LOGGED_OUT_STEPS[0]}</h2>
                <button onClick={openLogin} disabled={!ready} className={pinkBtn}>Continue</button>
              </section>
              {LOGGED_OUT_STEPS.slice(1).map((t, i) => (
                <section key={t} className="rounded-2xl border border-hairline px-6 py-6"><h2 className="text-lg font-semibold">{i + 2}. {t}</h2></section>
              ))}
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-hairline p-6">
                <h2 className="text-lg font-semibold">Message the host</h2>
                <p className="mt-1 text-sm text-muted">Share why you’re travelling, who’s coming with you and what you love about the space.</p>
                {listing && (
                  <>
                    <div className="mt-5 flex items-center gap-4">
                      <div className="relative shrink-0">
                        <Avatar user={listing.host} className="h-11 w-11 text-lg" />
                        {listing.host.is_superhost && <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-rausch" />}
                      </div>
                      <div>
                        <p className="text-base">{listing.host.name.split(" ")[0]}</p>
                        <p className="text-sm text-muted">Hosting since {new Date(listing.host.created_at).getFullYear()}</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-[18px]">{welcomeNote(listing)}</p>
                  </>
                )}
                <textarea ref={messageRef} value={message} rows={3} maxLength={1000}
                  onChange={(e) => { setMessage(e.target.value); if (e.target.value.trim()) setNeedMessage(false); }}
                  placeholder={listing ? `Hi ${listing.host.name.split(" ")[0]}! I’ll be visiting...` : "Write a message..."}
                  aria-label="Message to the host" aria-invalid={needMessage}
                  className={`mt-5 w-full resize-y rounded-lg border-2 bg-transparent px-4 py-3 text-base outline-none placeholder:text-ink/40 ${needMessage ? "border-rausch" : "border-ink"}`} />
                {needMessage && <p className="mt-2 text-sm text-rausch">Write a message to your host to continue.</p>}
              </section>

              <div className="border-b border-hairline pb-6 pt-8">
                <h2 className="text-lg font-semibold">Proceed to payment</h2>
                <p className="mt-1 text-sm">You’ll be directed to Razorpay to complete payment.</p>
              </div>
              <p className="mt-6 text-xs">By selecting the button, I agree to the <button onClick={() => setEditing("policy")} className="font-semibold underline">booking terms</button>.</p>
              {error && <p className="mt-4 rounded-lg bg-rausch/10 p-3 text-sm font-medium text-rausch">{error}</p>}
              <button onClick={continueToPayment} disabled={!quote}
                className="mt-4 h-12 w-full rounded-lg bg-black text-base font-semibold text-white disabled:opacity-50">
                Continue to <span className="font-bold italic">Razorpay</span>
              </button>
            </>
          )}
        </div>

        {/* Reservation summary */}
        <aside className="order-1 md:order-2">
          {listing && quote ? (
            <div className="rounded-[20px] border border-hairline p-6 text-sm md:sticky md:top-8">
              <div className="flex gap-4">
                <img src={listing.cover_url} alt="" className="h-24 w-24 shrink-0 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="line-clamp-3 text-base font-semibold leading-5">{listing.title}</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    {listing.rating && <span className="flex items-center gap-1"><StarIcon className="h-3 w-3" /> {listing.rating.toFixed(1)} ({listing.review_count})</span>}
                    {favourite && <span className="flex items-center gap-1"><Laurel /> Guest favourite</span>}
                  </p>
                </div>
              </div>

              <p className="mt-5 border-b border-hairline pb-5">
                Free cancellation before check-in. <button onClick={() => setEditing("policy")} className="font-semibold underline">Full policy</button>
              </p>

              <div className="flex items-start justify-between gap-4 border-b border-hairline py-5">
                <div><p className="font-semibold">Dates</p><p className="mt-1">{stayDates(checkIn, checkOut)}</p></div>
                <button onClick={() => { setDraft({ start: checkIn, end: checkOut, guests }); setEditing("dates"); }} className={greyBtn}>Change</button>
              </div>
              <div className="flex items-start justify-between gap-4 border-b border-hairline py-5">
                <div><p className="font-semibold">Guests</p><p className="mt-1">{guests} guest{guests > 1 ? "s" : ""}</p></div>
                <button onClick={() => { setDraft({ start: checkIn, end: checkOut, guests }); setEditing("guests"); }} className={greyBtn}>Change</button>
              </div>

              <div className="space-y-2.5 border-b border-hairline py-5">
                <p className="font-semibold">Price details</p>
                <div className="flex justify-between"><span>{nights} night{nights > 1 ? "s" : ""} x {inr(quote.nightly_rate)}</span><span>{inr(quote.subtotal)}</span></div>
                {quote.discount > 0 && <div className="flex justify-between"><span>Special offer</span><span className="text-[#008A05]">-{inr(quote.discount)}</span></div>}
                {quote.cleaning_fee > 0 && <div className="flex justify-between"><span>Cleaning fee</span><span>{inr(quote.cleaning_fee)}</span></div>}
                <div className="flex justify-between"><span>Airbnb service fee</span><span>{inr(quote.service_fee)}</span></div>
              </div>
              <div className="flex justify-between pt-5 font-semibold">
                <span>Total <span className="underline">INR</span></span><span>{inr(quote.total)}</span>
              </div>
              <button onClick={() => setEditing("breakdown")} className="mt-3 font-semibold underline">Price breakdown</button>
            </div>
          ) : (
            <div className="h-96 animate-pulse rounded-[20px] bg-soft" />
          )}
        </aside>
      </div>

      <Modal open={editing === "dates"} onClose={() => setEditing(null)} title="Change dates" wide={desktop}
        footer={<>
          <button className="font-semibold underline" onClick={() => setDraft((d) => ({ ...d, start: null, end: null }))}>Clear dates</button>
          <button disabled={!draft.start || !draft.end} onClick={() => { update({ check_in: draft.start!, check_out: draft.end! }); setEditing(null); }}
            className="rounded-lg bg-ink px-6 py-3 font-semibold text-surface disabled:opacity-40">Save</button>
        </>}>
        <DateRangePicker start={draft.start} end={draft.end} onChange={(s, e) => setDraft((d) => ({ ...d, start: s, end: e }))} booked={booked} months={desktop ? 2 : 1} />
      </Modal>

      <Modal open={editing === "guests"} onClose={() => setEditing(null)} title="Change guests"
        footer={<>
          <button className="font-semibold underline" onClick={() => setEditing(null)}>Cancel</button>
          <button onClick={() => { update({ guests: draft.guests }); setEditing(null); }} className="rounded-lg bg-ink px-6 py-3 font-semibold text-surface">Save</button>
        </>}>
        <div className="flex items-center justify-between">
          <div><p className="font-semibold">Guests</p><p className="text-sm text-muted">This place has a maximum of {listing?.max_guests ?? 1} guests.</p></div>
          <div className="flex items-center gap-3">
            <button disabled={draft.guests <= 1} onClick={() => setDraft((d) => ({ ...d, guests: d.guests - 1 }))} className="h-8 w-8 rounded-full border border-[#b0b0b0] disabled:opacity-30" aria-label="Fewer guests">−</button>
            <span className="w-4 text-center">{draft.guests}</span>
            <button disabled={draft.guests >= (listing?.max_guests ?? 1)} onClick={() => setDraft((d) => ({ ...d, guests: d.guests + 1 }))} className="h-8 w-8 rounded-full border border-[#b0b0b0] disabled:opacity-30" aria-label="More guests">+</button>
          </div>
        </div>
      </Modal>

      <Modal open={editing === "breakdown"} onClose={() => setEditing(null)} title="Price breakdown">
        {quote && (
          <div className="space-y-3 text-base">
            {Array.from({ length: quote.nights }, (_, i) => {
              const d = new Date(parseISO(checkIn)); d.setDate(d.getDate() + i);
              return <div key={i} className="flex justify-between"><span>{d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span><span>{inr(quote.nightly_rate)}</span></div>;
            })}
            {quote.discount > 0 && <div className="flex justify-between"><span>Special offer</span><span className="text-[#008A05]">-{inr(quote.discount)}</span></div>}
            {quote.cleaning_fee > 0 && <div className="flex justify-between"><span>Cleaning fee</span><span>{inr(quote.cleaning_fee)}</span></div>}
            <div className="flex justify-between"><span>Airbnb service fee</span><span>{inr(quote.service_fee)}</span></div>
            <div className="flex justify-between border-t border-hairline pt-4 font-semibold"><span>Total (INR)</span><span>{inr(quote.total)}</span></div>
            <p className="pt-2 text-sm text-muted">Nightly price {money(quote.nightly_rate)}{quote.discount > 0 ? `, ${listing?.discount_pct}% special offer applied` : ""}.</p>
          </div>
        )}
      </Modal>

      {/* Mocked payment step: stands in for the Razorpay page, nothing is charged. */}
      <Modal open={editing === "payment"} onClose={() => !paying && setEditing(null)} title="Razorpay (demo)">
        {quote && listing && (
          <div className="text-center">
            <p className="text-sm text-muted">{listing.title}</p>
            <p className="mt-2 text-3xl font-semibold">{inr(quote.total)}</p>
            <p className="mx-auto mt-4 max-w-sm text-sm text-muted">This clone doesn’t take real payments: no card details are needed and nothing is charged.</p>
            {error && <p className="mt-4 rounded-lg bg-rausch/10 p-3 text-sm font-medium text-rausch">{error}</p>}
            <button onClick={pay} disabled={paying} className="mt-6 h-12 w-full rounded-lg bg-black text-base font-semibold text-white disabled:opacity-50">
              {paying ? "Confirming…" : `Pay ${inr(quote.total)}`}
            </button>
          </div>
        )}
      </Modal>

      {/* Acknowledgement after an approved payment. OK, Esc, the × and the backdrop all go home. */}
      <Modal open={!!confirmed} onClose={goHome} title="Booking confirmed">
        {confirmed && listing && (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#008A05]/10 text-[#008A05]">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
            </span>
            <h3 className="mt-4 text-[22px] font-semibold leading-[26px]">Payment approved</h3>
            <p className="mt-2 text-base text-muted">Your stay is booked and {listing.host.name.split(" ")[0]} has been sent your message.</p>

            <dl className="mt-6 divide-y divide-hairline rounded-2xl border border-hairline text-left text-sm">
              {[
                ["Place", listing.title],
                ["Dates", stayDates(confirmed.check_in, confirmed.check_out)],
                ["Guests", `${confirmed.guests} guest${confirmed.guests > 1 ? "s" : ""}`],
                ["Total paid", inr(confirmed.total)],
                ["Booking reference", `AB${String(confirmed.id).padStart(6, "0")}`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-6 px-4 py-3">
                  <dt className="shrink-0 text-muted">{k}</dt>
                  <dd className="min-w-0 truncate text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">You can see this reservation, or cancel it for free before check-in, under Trips.</p>

            <button onClick={goHome} autoFocus className="mt-6 h-12 w-full rounded-lg bg-ink text-base font-semibold text-surface">OK</button>
          </div>
        )}
      </Modal>

      <Modal open={editing === "policy"} onClose={() => setEditing(null)} title="Booking terms">
        <p className="text-base leading-7">This demo lets you cancel any upcoming trip for free from <Link href="/trips" className="font-semibold underline">Trips</Link> before check-in. The dates are released for other guests straight away.</p>
      </Modal>
    </div>
  );
}

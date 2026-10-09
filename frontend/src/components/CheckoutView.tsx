"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { fmtShort } from "@/lib/dates";
import type { Booking, ListingDetail, Quote } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import PriceBreakdown from "./PriceBreakdown";

/* eslint-disable @next/next/no-img-element */
export default function CheckoutView() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { user, ready } = useUser();

  const listingId = sp.get("listing");
  const checkIn = sp.get("check_in");
  const checkOut = sp.get("check_out");
  const guests = Number(sp.get("guests") ?? 1) || 1;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut) return;
    Promise.all([
      api<ListingDetail>(`/listings/${listingId}`),
      api<Quote>(`/listings/${listingId}/quote?check_in=${checkIn}&check_out=${checkOut}`),
    ]).then(([l, q]) => { setListing(l); setQuote(q); }).catch((e) => setError(e.message));
  }, [listingId, checkIn, checkOut]);

  if (!listingId || !checkIn || !checkOut)
    return <p className="px-5 py-20 text-center text-muted">Missing booking details. <Link href="/" className="underline">Back to explore</Link></p>;

  if (ready && !user)
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Log in to finish booking</h1>
        <Link href="/login" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );

  const pay = async () => {
    setPaying(true); setError(null);
    try {
      // Mocked payment: nothing about the card is sent anywhere.
      const b = await api<Booking>("/bookings", {
        method: "POST",
        body: JSON.stringify({ listing_id: Number(listingId), check_in: checkIn, check_out: checkOut, guests }),
      });
      toast("Your trip is booked!");
      router.push(`/trips?confirmed=${b.id}`);
    } catch (e) {
      setError((e as Error).message);
      setPaying(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1050px] px-5 pb-16 md:px-10">
      <button onClick={() => router.back()} className="mb-4 text-xl" aria-label="Back">‹</button>
      <h1 className="mb-8 text-[28px] font-semibold">Confirm and pay</h1>

      <div className="grid gap-16 md:grid-cols-[1fr_400px]">
        <div className="order-2 md:order-1">
          <h2 className="mb-4 text-[22px] font-semibold">Your trip</h2>
          <div className="flex justify-between"><div><p className="font-semibold">Dates</p><p className="text-muted">{fmtShort(checkIn)} – {fmtShort(checkOut)}</p></div></div>
          <div className="mt-4"><p className="font-semibold">Guests</p><p className="text-muted">{guests} guest{guests > 1 ? "s" : ""}</p></div>

          <hr className="my-8 border-hairline" />
          <h2 className="mb-1 text-[22px] font-semibold">Pay with</h2>
          <p className="mb-4 text-sm text-muted">Demo checkout. No real payment is made and card details are never sent or stored.</p>
          <div className="overflow-hidden rounded-xl border border-ink/50">
            <input defaultValue="4242 4242 4242 4242" aria-label="Card number" className="w-full border-b border-ink/50 p-4 outline-none" />
            <div className="grid grid-cols-2">
              <input defaultValue="12 / 30" aria-label="Expiry" className="border-r border-ink/50 p-4 outline-none" />
              <input defaultValue="123" aria-label="CVV" className="p-4 outline-none" />
            </div>
          </div>

          <hr className="my-8 border-hairline" />
          <p className="text-sm text-muted">By selecting the button below, I agree to the house rules and cancellation policy. You can cancel anytime from My Trips.</p>

          {error && <p className="mt-5 rounded-lg bg-rausch/10 p-3 text-sm font-medium text-rausch">{error}</p>}
          <button onClick={pay} disabled={paying || !listing || !quote}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#E61E4D] to-[#D70466] py-4 text-base font-semibold text-white disabled:opacity-50 md:w-auto md:px-12">
            {paying ? "Confirming…" : "Confirm and pay"}
          </button>
        </div>

        <aside className="order-1 md:order-2">
          {listing && quote ? (
            <div className="rounded-2xl border border-hairline p-6 md:sticky md:top-24">
              <div className="mb-6 flex gap-4 border-b border-hairline pb-6">
                <img src={listing.cover_url} alt="" className="h-24 w-28 rounded-xl object-cover" />
                <div><p className="text-sm text-muted">{listing.property_type}</p><p className="font-medium">{listing.title}</p></div>
              </div>
              <h3 className="mb-4 text-[22px] font-semibold">Price details</h3>
              <PriceBreakdown q={quote} />
            </div>
          ) : (
            <div className="h-64 animate-pulse rounded-2xl bg-soft" />
          )}
        </aside>
      </div>
    </div>
  );
}

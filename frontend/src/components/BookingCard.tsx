"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BookedRange, fmtShort } from "@/lib/dates";
import { money } from "@/lib/format";
import type { ListingDetail, Quote } from "@/lib/types";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import DateRangePicker from "./DateRangePicker";
import Modal from "./Modal";
import PriceBreakdown from "./PriceBreakdown";

export default function BookingCard({
  listing, start, end, guests, booked, onDates, onGuests, onReserve,
}: {
  listing: ListingDetail; start: string | null; end: string | null; guests: number;
  booked: BookedRange[];
  onDates: (s: string | null, e: string | null) => void;
  onGuests: (n: number) => void;
  onReserve: () => void;
}) {
  const desktop = useIsDesktop();
  const [datesOpen, setDatesOpen] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteErr, setQuoteErr] = useState<string | null>(null);

  useEffect(() => {
    setQuote(null); setQuoteErr(null);
    if (!start || !end) return;
    let cancelled = false;
    api<Quote>(`/listings/${listing.id}/quote?check_in=${start}&check_out=${end}`)
      .then((q) => !cancelled && setQuote(q))
      .catch((e) => !cancelled && setQuoteErr(e.message));
    return () => { cancelled = true; };
  }, [listing.id, start, end]);

  return (
    <div className="rounded-2xl border border-hairline bg-surface p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
      <p className="mb-5 text-[22px] font-semibold">
        {quote ? money(quote.nightly_rate) : money(listing.price_per_night)} <span className="text-base font-normal">night</span>
      </p>

      <div className="overflow-hidden rounded-xl border border-ink/60">
        <button onClick={() => setDatesOpen(true)} className="grid w-full grid-cols-2 border-b border-ink/60 text-left">
          <div className="border-r border-ink/60 p-3"><p className="text-[10px] font-bold uppercase">Check-in</p><p className="text-sm">{start ? fmtShort(start) : "Add date"}</p></div>
          <div className="p-3"><p className="text-[10px] font-bold uppercase">Checkout</p><p className="text-sm">{end ? fmtShort(end) : "Add date"}</p></div>
        </button>
        <div className="flex items-center justify-between p-3">
          <div><p className="text-[10px] font-bold uppercase">Guests</p><p className="text-sm">{guests} guest{guests > 1 ? "s" : ""}</p></div>
          <div className="flex items-center gap-3">
            <button disabled={guests <= 1} onClick={() => onGuests(guests - 1)} className="h-8 w-8 rounded-full border border-muted disabled:opacity-30" aria-label="Fewer guests">−</button>
            <button disabled={guests >= listing.max_guests} onClick={() => onGuests(guests + 1)} className="h-8 w-8 rounded-full border border-muted disabled:opacity-30" aria-label="More guests">+</button>
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-muted">This place has a maximum of {listing.max_guests} guests.</p>

      <button onClick={start && end ? onReserve : () => setDatesOpen(true)}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#E61E4D] to-[#D70466] py-3.5 text-base font-semibold text-white active:scale-[0.98]">
        {start && end ? "Reserve" : "Check availability"}
      </button>

      {quoteErr && <p className="mt-3 text-sm text-rausch">{quoteErr}</p>}
      {quote && (
        <>
          <p className="mt-3 text-center text-sm text-muted">You won’t be charged yet</p>
          <div className="mt-5"><PriceBreakdown q={quote} /></div>
        </>
      )}

      <Modal
        open={datesOpen} onClose={() => setDatesOpen(false)} title="Select dates" wide={desktop}
        footer={
          <>
            <button className="font-semibold underline" onClick={() => onDates(null, null)}>Clear dates</button>
            <button onClick={() => setDatesOpen(false)} className="rounded-lg bg-ink px-6 py-3 font-semibold text-surface">Save</button>
          </>
        }
      >
        <DateRangePicker start={start} end={end} onChange={onDates} booked={booked} months={desktop ? 2 : 1} />
      </Modal>
    </div>
  );
}

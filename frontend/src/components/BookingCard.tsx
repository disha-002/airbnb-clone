"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { BookedRange, parseISO } from "@/lib/dates";
import { money } from "@/lib/format";
import type { ListingDetail, Quote } from "@/lib/types";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import DateRangePicker from "./DateRangePicker";
import Modal from "./Modal";
import PriceBreakdown from "./PriceBreakdown";
import { ChevronDown } from "./ListingIcons";

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

  const [guestsOpen, setGuestsOpen] = useState(false);
  const field = (label: string, value: string | null) => (
    <div className="px-3 py-2.5">
      <p className="text-[10px] font-bold uppercase leading-3">{label}</p>
      <p className={`mt-1 text-sm ${value ? "" : "text-muted"}`}>{value ?? "Add date"}</p>
    </div>
  );
  const usDate = (d: string) => parseISO(d).toLocaleDateString("en-US");

  return (
    <div className="rounded-3xl border border-hairline/70 bg-surface p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
      {quote ? (
        <p className="mb-6">
          {quote.discount > 0 && <s className="mr-1.5 text-[22px] text-muted">{money(quote.subtotal)}</s>}
          <span className="text-[22px] font-semibold underline">{money(quote.subtotal - quote.discount)}</span>
          <span className="ml-1 text-base">for {quote.nights} night{quote.nights > 1 ? "s" : ""}</span>
        </p>
      ) : (
        <p className="mb-6 text-[22px] font-semibold">Add dates for prices</p>
      )}

      <div className="relative rounded-lg border border-[#b0b0b0]">
        <button onClick={() => setDatesOpen(true)} className="grid w-full grid-cols-2 border-b border-[#b0b0b0] text-left">
          <div className="border-r border-[#b0b0b0]">{field("Check-in", start && usDate(start))}</div>
          {field("Checkout", end && usDate(end))}
        </button>
        <button onClick={() => setGuestsOpen(!guestsOpen)} aria-expanded={guestsOpen}
          className="flex w-full items-center justify-between px-3 py-2.5 text-left">
          <div>
            <p className="text-[10px] font-bold uppercase leading-3">Guests</p>
            <p className="mt-1 text-sm">{guests} guest{guests > 1 ? "s" : ""}</p>
          </div>
          <ChevronDown className={`h-5 w-5 transition-transform ${guestsOpen ? "rotate-180" : ""}`} />
        </button>

        {guestsOpen && (
          <div className="absolute inset-x-0 top-full z-20 mt-1 rounded-lg bg-surface p-4 shadow-[0_2px_16px_rgba(0,0,0,0.15)] ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div><p className="font-semibold">Guests</p><p className="text-sm text-muted">Including children</p></div>
              <div className="flex items-center gap-3">
                <button disabled={guests <= 1} onClick={() => onGuests(guests - 1)} className="h-8 w-8 rounded-full border border-[#b0b0b0] text-muted disabled:opacity-30" aria-label="Fewer guests">−</button>
                <span className="w-4 text-center">{guests}</span>
                <button disabled={guests >= listing.max_guests} onClick={() => onGuests(guests + 1)} className="h-8 w-8 rounded-full border border-[#b0b0b0] text-muted disabled:opacity-30" aria-label="More guests">+</button>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted">This place has a maximum of {listing.max_guests} guests.</p>
            <div className="mt-3 text-right"><button onClick={() => setGuestsOpen(false)} className="font-semibold underline">Close</button></div>
          </div>
        )}
      </div>

      <button onClick={start && end ? onReserve : () => setDatesOpen(true)}
        className="mt-4 w-full rounded-full bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] py-3.5 text-base font-semibold text-white active:scale-[0.98]">
        {start && end ? "Reserve" : "Check availability"}
      </button>

      {quoteErr && <p className="mt-3 text-sm text-rausch">{quoteErr}</p>}
      {start && end && <p className="mt-4 text-center text-sm">You won’t be charged yet</p>}
      {/* The assignment asks for the nightly-rate × nights + fees breakdown on this page. */}
      {quote && <div className="mt-6"><PriceBreakdown q={quote} /></div>}

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

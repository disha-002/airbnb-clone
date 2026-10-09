"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { iso, nightsBetween, parseISO, todayISO } from "@/lib/dates";
import { money, offerPrice } from "@/lib/format";
import { payout, useHostData } from "@/lib/hosting";
import type { HostBooking } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "./ListingIcons";
import Avatar from "./Avatar";

const WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Read-only month view of one listing: nightly price on free days, the guest on booked ones. */
export default function HostCalendar() {
  const { listings, bookings } = useHostData();
  const [listingId, setListingId] = useState<number | null>(null);
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [open, setOpen] = useState<HostBooking | null>(null);
  const [jumped, setJumped] = useState(false);

  // Open on the listing with the next reservation (so the calendar isn't empty), else the first one.
  const nextBooking = (bookings ?? [])
    .filter((b) => b.status === "confirmed" && b.check_out >= todayISO())
    .sort((x, y) => x.check_in.localeCompare(y.check_in))[0];
  const defaultId = nextBooking?.listing_id ?? listings?.[0]?.id;
  const listing = listings?.find((l) => l.id === (listingId ?? defaultId)) ?? null;
  const mine = useMemo(
    () => (bookings ?? []).filter((b) => b.status === "confirmed" && b.listing_id === listing?.id),
    [bookings, listing?.id],
  );
  const today = todayISO();
  if (!jumped && nextBooking && listingId === null) {
    // Show the month of that first reservation (it can be after the current month).
    setJumped(true);
    const d = parseISO(nextBooking.check_in);
    if (d > new Date()) setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }

  const cells = useMemo(() => {
    const count = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(cursor.getDay()).fill(null);
    for (let d = 1; d <= count; d++) out.push(iso(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    return out;
  }, [cursor]);

  const bookingOn = (d: string) => mine.find((b) => d >= b.check_in && d < b.check_out);
  const shift = (n: number) => { setOpen(null); setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1)); };
  const nav = "flex h-10 w-10 items-center justify-center rounded-full border border-hairline hover:border-ink";

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-8 md:px-10 md:pt-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[32px] font-semibold tracking-tight">Calendar</h1>
        {listings && listings.length > 0 && (
          <select value={listing?.id} onChange={(e) => { setListingId(Number(e.target.value)); setOpen(null); }} aria-label="Listing"
            className="max-w-full rounded-full border border-hairline bg-surface px-4 py-2.5 text-sm font-medium outline-none focus:border-ink">
            {listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        )}
      </div>

      {listings?.length === 0 && (
        <div className="rounded-2xl bg-soft px-6 py-16 text-center">
          <p className="text-lg font-semibold">Nothing to show yet</p>
          <p className="mt-1 text-muted">Create a listing and its bookings will appear here.</p>
          <Link href="/host/new" className="mt-6 inline-block rounded-lg bg-ink px-6 py-3 font-semibold text-surface">Create listing</Link>
        </div>
      )}

      {listing && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[22px] font-semibold">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-2">
              <button onClick={() => shift(-1)} aria-label="Previous month" className={nav}><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => shift(1)} aria-label="Next month" className={nav}><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-hairline">
            <div className="grid grid-cols-7 border-b border-hairline bg-soft text-center text-xs font-semibold text-muted">
              {WEEK.map((w) => <span key={w} className="py-2.5">{w}</span>)}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, i) => {
                if (!d) return <div key={`b${i}`} className="min-h-[84px] border-b border-r border-hairline bg-soft/40" />;
                const b = bookingOn(d);
                const past = d < today;
                return (
                  <button key={d} disabled={!b} onClick={() => b && setOpen(b)}
                    className={`min-h-[84px] border-b border-r border-hairline p-2 text-left align-top ${b ? "bg-ink/[0.04] hover:bg-ink/[0.08]" : ""} ${past ? "opacity-50" : ""}`}>
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${d === today ? "bg-ink text-surface" : ""}`}>{Number(d.slice(8))}</span>
                    {b ? (
                      <span className="mt-1 block truncate rounded-md bg-ink px-1.5 py-0.5 text-[11px] font-semibold text-surface">{b.guest.name.split(" ")[0]}</span>
                    ) : (
                      <span className="mt-1 block text-xs text-muted">{money(offerPrice(listing))}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-3 text-xs text-muted">
            Prices include your {listing.discount_pct > 0 ? `${listing.discount_pct}% special offer` : "nightly rate"}. Select a booked night to see the reservation.
          </p>

          {open && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-hairline p-5 sm:flex-row sm:items-center">
              <Avatar user={open.guest} className="h-14 w-14 text-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{open.guest.name}</p>
                <p className="text-sm text-muted">
                  {parseISO(open.check_in).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – {parseISO(open.check_out).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  {" · "}{nightsBetween(open.check_in, open.check_out)} night{nightsBetween(open.check_in, open.check_out) > 1 ? "s" : ""} · {open.guests} guest{open.guests > 1 ? "s" : ""}
                </p>
                {open.message && <p className="mt-2 line-clamp-2 text-sm italic text-muted">“{open.message}”</p>}
              </div>
              <div className="sm:text-right"><p className="font-semibold">{money(payout(open))}</p><p className="text-xs text-muted">your payout</p></div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

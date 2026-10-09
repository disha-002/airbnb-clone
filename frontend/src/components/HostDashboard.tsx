"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { fmtShort } from "@/lib/dates";
import { money } from "@/lib/format";
import type { HostBooking, HostListing } from "@/lib/types";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/context/UserContext";
import { StarIcon } from "./icons";

/* eslint-disable @next/next/no-img-element */
export default function HostDashboard() {
  const toast = useToast();
  const { user } = useUser();
  const [tab, setTab] = useState<"listings" | "bookings">("listings");
  const [listings, setListings] = useState<HostListing[] | null>(null);
  const [bookings, setBookings] = useState<HostBooking[] | null>(null);

  const load = () => {
    api<HostListing[]>("/host/listings").then(setListings).catch(() => setListings([]));
    api<HostBooking[]>("/host/bookings").then(setBookings).catch(() => setBookings([]));
  };
  useEffect(load, [user?.id]);

  const remove = async (l: HostListing) => {
    if (l.upcoming_bookings > 0) {
      // Same rule as Airbnb (and the API): reservations must be cancelled or completed first.
      toast(`This listing has ${l.upcoming_bookings} upcoming reservation${l.upcoming_bookings > 1 ? "s" : ""}, so it can’t be removed yet`);
      return;
    }
    if (!window.confirm(`Remove “${l.title}”? It will disappear from search. Past trips and reviews are kept.`)) return;
    try {
      await api(`/host/listings/${l.id}`, { method: "DELETE" });
      toast("Listing removed");
      load();
    } catch (e) { toast((e as Error).message); }
  };

  const active = bookings?.filter((b) => b.status === "confirmed") ?? [];
  const earnings = active.reduce((sum, b) => sum + b.total - b.service_fee, 0); // host keeps everything but the guest service fee
  const stat = (label: string, value: string | number) => (
    <div className="rounded-2xl border border-hairline p-5"><p className="text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>
  );

  return (
    <div className="mx-auto max-w-[1100px] px-5 pb-16 md:px-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[28px] font-semibold">Your hosting dashboard</h1>
        <Link href="/host/new" className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-surface">+ Create listing</Link>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-3">
        {stat("Listings", listings?.length ?? "–")}
        {stat("Bookings", active.length)}
        {stat("Earnings", money(earnings))}
      </div>

      <div className="mb-6 flex gap-8 border-b border-hairline">
        {(["listings", "bookings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 font-medium capitalize ${tab === t ? "border-b-[3px] border-ink" : "text-muted"}`}>{t}</button>
        ))}
      </div>

      {tab === "listings" && (
        <div className="space-y-4">
          {listings === null && <div className="h-32 animate-pulse rounded-2xl bg-soft" />}
          {listings?.length === 0 && <p className="py-10 text-center text-muted">You haven’t listed anything yet. Create your first listing!</p>}
          {listings?.map((l) => (
            <div key={l.id} className="flex flex-col gap-4 rounded-2xl border border-hairline p-4 sm:flex-row sm:items-center">
              <img src={l.cover_url} alt="" className="h-40 w-full rounded-xl object-cover sm:h-24 sm:w-36" />
              <div className="flex-1">
                <p className="font-semibold">{l.title}</p>
                <p className="text-sm text-muted">{l.property_type} · {l.city}, {l.country}</p>
                {l.upcoming_bookings > 0 && (
                  <p className="mt-1 text-xs font-semibold text-[#1E7F4F]">{l.upcoming_bookings} upcoming reservation{l.upcoming_bookings > 1 ? "s" : ""}</p>
                )}
                <p className="mt-1 flex items-center gap-1 text-sm">{money(l.price_per_night)} night ·
                  {l.rating ? <><StarIcon /> {l.rating.toFixed(2).replace(/0$/, "")} ({l.review_count})</> : " No reviews yet"}</p>
              </div>
              <div className="flex gap-2">
                <Link href={`/listings/${l.id}`} className="rounded-lg border border-hairline px-3 py-2 text-sm font-semibold hover:border-ink">View</Link>
                <Link href={`/host/${l.id}/edit`} className="rounded-lg border border-hairline px-3 py-2 text-sm font-semibold hover:border-ink">Edit</Link>
                <button onClick={() => remove(l)} title={l.upcoming_bookings ? "Reservations must be cancelled or completed first" : undefined}
                  className={`rounded-lg border border-hairline px-3 py-2 text-sm font-semibold ${l.upcoming_bookings ? "cursor-not-allowed text-muted" : "text-rausch hover:border-rausch"}`}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "bookings" && (
        <div className="space-y-3">
          {bookings === null && <div className="h-32 animate-pulse rounded-2xl bg-soft" />}
          {bookings?.length === 0 && <p className="py-10 text-center text-muted">No bookings on your listings yet.</p>}
          {bookings?.map((b) => (
            <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-hairline p-4">
              <img src={b.guest.avatar_url} alt="" className="h-12 w-12 rounded-full bg-soft" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{b.guest.name}</p>
                <p className="truncate text-sm text-muted">{b.listing_title}</p>
                <p className="text-sm">{fmtShort(b.check_in)} – {fmtShort(b.check_out)} · {b.guests} guest{b.guests > 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{money(b.total - b.service_fee)}</p>
                <span className={`text-xs font-semibold ${b.status === "confirmed" ? "text-[#1E7F4F]" : "text-muted"}`}>{b.status === "confirmed" ? "Confirmed" : "Cancelled"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

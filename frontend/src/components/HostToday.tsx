"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { fmtShort, nightsBetween, todayISO } from "@/lib/dates";
import { money } from "@/lib/format";
import { GROUP_EMPTY, GROUP_LABEL, groupReservations, payout, useHostData, type ReservationGroup } from "@/lib/hosting";
import type { HostBooking } from "@/lib/types";
import { useUser } from "@/context/UserContext";
import Avatar from "./Avatar";

/* eslint-disable @next/next/no-img-element */
const ORDER: ReservationGroup[] = ["checkingOut", "hosting", "arriving", "upcoming"];

function ReservationCard({ b }: { b: HostBooking }) {
  const nights = nightsBetween(b.check_in, b.check_out);
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-hairline p-5 sm:flex-row sm:items-start">
      <Avatar user={b.guest} className="h-14 w-14 text-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">{b.guest.name}</p>
        <p className="text-sm text-muted">
          {fmtShort(b.check_in)} – {fmtShort(b.check_out)} · {nights} night{nights > 1 ? "s" : ""} · {b.guests} guest{b.guests > 1 ? "s" : ""}
        </p>
        <Link href={`/listings/${b.listing_id}`} className="mt-0.5 block truncate text-sm underline">{b.listing_title}</Link>
        {b.message && (
          <p className="mt-3 line-clamp-3 rounded-xl bg-soft px-4 py-3 text-sm leading-5">
            <span className="mb-0.5 block text-xs font-semibold text-muted">Message from {b.guest.name.split(" ")[0]}</span>
            {b.message}
          </p>
        )}
      </div>
      <div className="shrink-0 sm:text-right">
        <p className="text-base font-semibold">{money(payout(b))}</p>
        <p className="text-xs text-muted">your payout</p>
      </div>
    </div>
  );
}

export default function HostToday() {
  const { user } = useUser();
  const { listings, bookings } = useHostData();
  const groups = useMemo(() => groupReservations(bookings ?? []), [bookings]);
  const [picked, setPicked] = useState<ReservationGroup | null>(null);

  // Open on the first group that has guests, like Airbnb's Today page; otherwise "Upcoming".
  const firstBusy = ORDER.find((g) => groups[g].length > 0) ?? "upcoming";
  const selected = picked ?? firstBusy;

  const confirmed = (bookings ?? []).filter((b) => b.status === "confirmed");
  const today = todayISO();
  const monthKey = today.slice(0, 7);
  const thisMonth = confirmed.filter((b) => b.check_in.slice(0, 7) === monthKey).reduce((s, b) => s + payout(b), 0);
  const total = confirmed.reduce((s, b) => s + payout(b), 0);
  const upcomingTotal = confirmed.filter((b) => b.check_in > today).reduce((s, b) => s + payout(b), 0);
  const loading = bookings === null || listings === null;

  const tile = (label: string, value: string) => (
    <div className="rounded-2xl border border-hairline p-5"><p className="text-sm text-muted">{label}</p><p className="mt-1 text-2xl font-semibold">{loading ? "–" : value}</p></div>
  );

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-20 pt-8 md:px-10 md:pt-12">
      <h1 className="text-[32px] font-semibold tracking-tight">Welcome, {user?.name.split(" ")[0]}!</h1>

      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-semibold">Your reservations</h2>
          <Link href="/host/calendar" className="text-sm font-semibold underline">View calendar</Link>
        </div>
        <div className="no-scrollbar mb-6 flex gap-2 overflow-x-auto">
          {ORDER.map((g) => (
            <button key={g} onClick={() => setPicked(g)} aria-pressed={selected === g}
              className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${selected === g ? "border-ink bg-ink text-surface" : "border-hairline hover:border-ink"}`}>
              {GROUP_LABEL[g]} ({groups[g].length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-32 animate-pulse rounded-2xl bg-soft" />
        ) : groups[selected].length === 0 ? (
          <div className="rounded-2xl bg-soft px-6 py-10 text-center">
            <p className="font-medium">{GROUP_EMPTY[selected]}</p>
            {listings?.length === 0 && <Link href="/host/new" className="mt-4 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-surface">Create your first listing</Link>}
          </div>
        ) : (
          <div className="space-y-4">{groups[selected].map((b) => <ReservationCard key={b.id} b={b} />)}</div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="mb-5 text-[22px] font-semibold">Earnings</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {tile("This month", money(thisMonth))}
          {tile("Upcoming payouts", money(upcomingTotal))}
          {tile("All time", money(total))}
        </div>
        <p className="mt-3 text-xs text-muted">Payouts are what you keep after Airbnb’s guest service fee, before any taxes.</p>
      </section>

      <section className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[22px] font-semibold">Your listings</h2>
          <Link href="/host/listings" className="text-sm font-semibold underline">Show all ({listings?.length ?? 0})</Link>
        </div>
        <div className="no-scrollbar flex gap-4 overflow-x-auto">
          {(listings ?? []).slice(0, 6).map((l) => (
            <Link key={l.id} href={`/host/${l.id}/edit`} className="block w-[200px] shrink-0">
              <img src={l.cover_url} alt="" className="aspect-[1.05/1] w-full rounded-2xl object-cover" />
              <p className="mt-2 truncate text-sm font-medium">{l.title}</p>
              <p className="text-xs text-muted">{l.city} · {money(l.price_per_night)} night</p>
            </Link>
          ))}
          <Link href="/host/new" className="flex aspect-[1.05/1] w-[200px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-ink/40 text-sm font-semibold hover:bg-soft">
            <span className="mb-1 text-3xl leading-none">+</span>Create listing
          </Link>
        </div>
      </section>
    </div>
  );
}

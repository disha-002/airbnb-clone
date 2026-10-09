"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import { addDays, iso, parseISO, todayISO } from "./dates";
import type { HostBooking, HostListing } from "./types";
import { useUser } from "@/context/UserContext";

/** The host's listings and the bookings made on them. `reload` refreshes both. */
export function useHostData() {
  const { user } = useUser();
  const [listings, setListings] = useState<HostListing[] | null>(null);
  const [bookings, setBookings] = useState<HostBooking[] | null>(null);

  const reload = useCallback(() => {
    api<HostListing[]>("/host/listings").then(setListings).catch(() => setListings([]));
    api<HostBooking[]>("/host/bookings").then(setBookings).catch(() => setBookings([]));
  }, []);
  useEffect(reload, [reload, user?.id]);

  return { listings, bookings, reload };
}

/** What the host keeps from a booking: everything except the guest-paid service fee. */
export const payout = (b: HostBooking) => b.total - b.service_fee;

export type ReservationGroup = "checkingOut" | "hosting" | "arriving" | "upcoming";

export const GROUP_LABEL: Record<ReservationGroup, string> = {
  checkingOut: "Checking out",
  hosting: "Currently hosting",
  arriving: "Arriving soon",
  upcoming: "Upcoming",
};

export const GROUP_EMPTY: Record<ReservationGroup, string> = {
  checkingOut: "You don’t have any guests checking out today.",
  hosting: "You don’t have any guests staying with you right now.",
  arriving: "No guests are arriving in the next 7 days.",
  upcoming: "You don’t have any upcoming reservations.",
};

/**
 * Sorts confirmed reservations into Airbnb's Today-page groups:
 * checking out today, staying now, arriving within a week, and later.
 */
export function groupReservations(bookings: HostBooking[]): Record<ReservationGroup, HostBooking[]> {
  const today = todayISO();
  const soon = iso(addDays(parseISO(today), 7));
  const groups: Record<ReservationGroup, HostBooking[]> = { checkingOut: [], hosting: [], arriving: [], upcoming: [] };
  for (const b of bookings) {
    if (b.status !== "confirmed") continue;
    if (b.check_out === today) groups.checkingOut.push(b);
    else if (b.check_in <= today && today < b.check_out) groups.hosting.push(b);
    else if (b.check_in > today && b.check_in <= soon) groups.arriving.push(b);
    else if (b.check_in > soon) groups.upcoming.push(b);
  }
  for (const g of Object.values(groups)) g.sort((a, b) => a.check_in.localeCompare(b.check_in));
  return groups;
}

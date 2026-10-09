"use client";
import { useEffect, useState } from "react";
import { api } from "./api";
import { useUser } from "@/context/UserContext";

/** The API sends naive UTC timestamps ("2026-10-09T07:53:24"); without a "Z" the browser would read them as local time. */
export const parseUtc = (s: string) => new Date(/[zZ]$|[+-]\d\d:?\d\d$/.test(s) ? s : `${s}Z`);

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Inbox timestamp: a time today, "Yesterday", a weekday this week, otherwise a date. */
export function shortTime(s: string) {
  const d = parseUtc(s), now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, "").toLowerCase();
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 864e5);
  if (days === 1) return "Yesterday";
  if (days < 7) return d.toLocaleDateString("en-GB", { weekday: "short" });
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export const clockTime = (s: string) =>
  parseUtc(s).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, "").toLowerCase();

/** Divider label between days inside a thread. */
export function dayLabel(s: string) {
  const d = parseUtc(s), now = new Date();
  if (sameDay(d, now)) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "Yesterday";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// One shared unread counter for the whole page (the header, menu and phone tab bar all show it), so there is a
// single poll instead of one per badge.
let unread = 0;
let pollingFor: number | null = null; // user id being polled
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(n: number) => void>();

function fetchUnread() {
  api<{ count: number }>("/conversations/unread")
    .then((r) => { unread = r.count; listeners.forEach((l) => l(unread)); })
    .catch(() => {});
}

/** Call after reading a thread so badges update straight away instead of on the next poll. */
export const refreshUnread = () => { if (pollingFor !== null) fetchUnread(); };

function start(userId: number) {
  if (pollingFor === userId) return;
  stop();
  pollingFor = userId;
  fetchUnread();
  timer = setInterval(fetchUnread, 20_000);
  window.addEventListener("focus", fetchUnread);
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
  pollingFor = null;
  unread = 0;
  window.removeEventListener("focus", fetchUnread);
}

/** Total unread messages for the logged-in user (polled every 20 seconds, shared by every badge). */
export function useUnreadMessages(): number {
  const { user } = useUser();
  const [count, setCount] = useState(unread);
  useEffect(() => {
    if (!user) { setCount(0); return; }
    listeners.add(setCount);
    start(user.id);
    setCount(unread);
    return () => {
      listeners.delete(setCount);
      if (listeners.size === 0) stop();
    };
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return user ? count : 0;
}

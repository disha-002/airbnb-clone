"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import type { PublicProfile, Trip, User } from "@/lib/types";
import Avatar from "./Avatar";
import { MedalIcon } from "./ListingIcons";
import { StarIcon } from "./icons";

const seenKey = (u: User) => `profilePrivacySeen:${u.id}`;

/** "Choose who can see your profile": Airbnb shows this once, the first time you open your profile. */
function PrivacyIntro({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 animate-[fade-in_0.2s_ease-out] bg-black/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="privacy-title"
        className="relative w-full animate-[rise_0.35s_cubic-bezier(0.2,0,0,1)_both] rounded-t-3xl bg-surface px-6 pb-6 pt-14 text-center shadow-2xl md:max-w-[480px] md:rounded-3xl md:px-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        {/* Phone mock-up of a profile page, drawn in CSS. */}
        <div aria-hidden className="mx-auto h-[190px] w-[168px] overflow-hidden rounded-2xl border border-hairline">
          <div className="mx-auto mt-6 h-full w-[86px] rounded-t-lg bg-soft px-2 pt-2">
            <div className="flex items-center gap-1.5 rounded-md bg-surface p-2 shadow-[0_2px_6px_rgba(0,0,0,0.12)]">
              <span className="flex h-[22px] w-[22px] items-end justify-center overflow-hidden rounded-full bg-[#e6e1f0]"><span className="h-3 w-3 translate-y-1 rounded-full bg-[#9a96a6]" /></span>
              <span className="flex-1 space-y-1"><span className="block h-1 w-3/4 rounded bg-hairline" /><span className="block h-1 rounded bg-hairline" /></span>
            </div>
            <span className="mt-3 block h-1.5 w-8 rounded bg-hairline" />
            <span className="mt-2 block h-1 rounded bg-hairline" />
            <span className="mt-1.5 block h-1 rounded bg-hairline" />
            <span className="mt-3 block h-1.5 w-8 rounded bg-hairline" />
            <span className="mt-2 grid grid-cols-2 gap-1"><span className="h-7 rounded-sm bg-hairline" /><span className="h-7 rounded-sm bg-hairline" /><span className="h-7 rounded-sm bg-hairline" /><span className="h-7 rounded-sm bg-hairline" /></span>
          </div>
        </div>
        <h2 id="privacy-title" className="mt-7 text-[26px] font-semibold leading-tight tracking-tight">Choose who can see your profile</h2>
        <p className="mt-5 text-base text-muted">
          We’ve added new ways for you to manage your profile’s privacy.{" "}
          <button onClick={() => toast("Profile privacy help is coming soon")} className="font-medium text-ink/80 underline">Learn more</button>
        </p>
        <button onClick={onClose} autoFocus className="mt-8 h-14 w-full rounded-lg bg-ink text-base font-semibold text-surface transition active:scale-[0.99]">Continue</button>
      </div>
    </div>,
    document.body,
  );
}

const ChatIcon = () => (
  <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
    <path d="M5 5h22v16H14l-6 5v-5H5z" /><path d="M10 11h12M10 15h8" />
  </svg>
);
const PeopleIcon = () => (
  <svg viewBox="0 0 40 40" className="h-10 w-10" fill="none" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="11" r="4" fill="#f1c9a5" stroke="none" /><path d="M5 34V24a7 7 0 0 1 14 0v10" fill="#5b8fd1" stroke="none" />
    <circle cx="28" cy="11" r="4" fill="#c99a76" stroke="none" /><path d="M21 34V24a7 7 0 0 1 14 0v10" fill="#e3b341" stroke="none" />
  </svg>
);

const hostingSince = (iso: string) => {
  const months = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / (30.44 * 864e5)));
  return months < 12 ? { value: months, label: months === 1 ? "Month hosting" : "Months hosting" }
    : { value: Math.floor(months / 12), label: months < 24 ? "Year hosting" : "Years hosting" };
};

/**
 * Your own profile page ("About me" card, "Complete your profile", connections). Guests get it at
 * /users/profile; in hosting mode it is /host/profile, under the hosting header, and a host's
 * card also shows their reviews, rating and time hosting.
 */
export default function ProfileView({ hosting = false }: { hosting?: boolean }) {
  const { user, ready } = useUser();
  const toast = useToast();
  const [tab, setTab] = useState<"about" | "connections">("about");
  const [collapsed, setCollapsed] = useState(false);
  const [intro, setIntro] = useState(false);
  const [reviews, setReviews] = useState<Trip[] | null>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [hostStats, setHostStats] = useState<PublicProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    try { setIntro(localStorage.getItem(seenKey(user)) !== "yes"); } catch { setIntro(true); }
    setShowReviews(false); setReviews(null); setHostStats(null);
    if (user.role === "host") api<PublicProfile>(`/users/${user.id}/profile`).then(setHostStats).catch(() => {});
  }, [user]);

  const closeIntro = () => { if (user) { try { localStorage.setItem(seenKey(user), "yes"); } catch {} } setIntro(false); };

  const toggleReviews = () => {
    setShowReviews((v) => !v);
    if (reviews === null) api<Trip[]>("/trips").then((t) => setReviews(t.filter((x) => x.reviewed))).catch(() => setReviews([]));
  };

  if (ready && !user)
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Log in to see your profile</h1>
        <Link href={`/login?redirect=${encodeURIComponent(hosting ? "/host/profile" : "/users/profile")}`} className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );
  if (!user) return <div className="mx-auto mt-10 h-64 max-w-[1000px] animate-pulse rounded-2xl bg-soft" />;

  const firstName = user.name.split(" ")[0];
  const isHost = user.role === "host";
  const roleLabel = isHost ? (user.is_superhost ? "Superhost" : "Host") : "Guest";
  const since = hostingSince(user.created_at);
  const stats = isHost ? [
    { value: hostStats ? String(hostStats.review_count) : "–", label: hostStats?.review_count === 1 ? "Review" : "Reviews" },
    { value: hostStats?.rating != null ? hostStats.rating.toFixed(2) : "–", label: "Rating", star: hostStats?.rating != null },
    { value: String(since.value), label: since.label },
  ] : [];
  const soon = (what: string) => () => toast(`${what} is coming soon`);
  const navItem = (key: typeof tab) =>
    `flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left text-lg font-medium transition-colors ${tab === key ? "bg-soft" : "hover:bg-soft/60"}`;

  return (
    <div className="min-h-[calc(100vh-84px)] md:grid md:grid-cols-[auto_1fr]">
      {intro && <PrivacyIntro onClose={closeIntro} />}

      <aside className={`border-hairline px-5 pt-8 md:min-h-[calc(100vh-84px)] md:border-r md:pt-12 ${collapsed ? "md:w-[120px] md:px-6" : "md:w-[34vw] md:max-w-[560px] md:pl-[12vw] md:pr-10"}`}>
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-[32px] font-semibold tracking-tight">Profile</h1>}
          <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-10 w-10 items-center justify-center rounded-full hover:bg-soft md:flex">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 8v8" strokeLinecap="round" /></svg>
          </button>
        </div>
        <nav className="mt-6 flex gap-2 md:mt-8 md:flex-col">
          <button onClick={() => setTab("about")} className={navItem("about")} aria-current={tab === "about" ? "page" : undefined}>
            <Avatar user={user} className="h-10 w-10 rounded-lg text-base" />{!collapsed && "About me"}
          </button>
          <button onClick={() => setTab("connections")} className={navItem("connections")} aria-current={tab === "connections" ? "page" : undefined}>
            <PeopleIcon />{!collapsed && "Connections"}
          </button>
        </nav>
      </aside>

      <main className="min-w-0 px-5 pb-20 pt-8 md:px-[8vw] md:pt-12">
        {tab === "about" ? (
          <div className="max-w-[880px] animate-[fade-in_0.3s_ease-out_both]">
            <div className="flex items-center gap-6">
              <h2 className="text-[32px] font-semibold tracking-tight">About me</h2>
              <button onClick={soon("Editing your profile")} className="rounded-lg bg-soft px-3 py-1.5 text-sm font-semibold hover:bg-ink/10">Edit</button>
            </div>

            <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
              <div className={`flex w-full shrink-0 animate-[rise_0.4s_cubic-bezier(0.2,0,0,1)_both] items-center gap-6 rounded-3xl bg-surface px-8 py-8 shadow-[0_6px_20px_rgba(0,0,0,0.2)] ${isHost ? "max-w-[400px]" : "max-w-[340px]"}`}>
                <div className="flex flex-1 flex-col items-center text-center">
                  <div className="relative">
                    <Avatar user={user} className="h-[104px] w-[104px] text-5xl" />
                    {user.is_superhost && (
                      <span className="absolute bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-rausch">
                        <MedalIcon className="h-4 w-4 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-[32px] font-bold leading-tight tracking-tight">{firstName}</p>
                  <p className={`flex items-center gap-1 text-sm ${isHost ? "font-medium" : "text-muted"}`}>{user.is_superhost && <MedalIcon className="h-3.5 w-3.5" />}{roleLabel}</p>
                </div>
                {isHost && (
                  <dl className="w-[96px] shrink-0 divide-y divide-hairline">
                    {stats.map((s) => (
                      <div key={s.label} className="py-2.5 first:pt-0 last:pb-0">
                        <dt className="sr-only">{s.label}</dt>
                        <dd className="flex items-center gap-1 text-[22px] font-bold leading-tight">{s.value}{s.star && <StarIcon className="h-3.5 w-3.5" />}</dd>
                        <dd className="text-[10px] font-semibold">{s.label}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
              <div className="max-w-[340px]">
                <h3 className="text-[22px] font-semibold tracking-tight">Complete your profile</h3>
                <p className="mt-3 text-base leading-6 text-muted">Your Airbnb profile is an important part of every reservation. Create yours to help other hosts and guests get to know you.</p>
                <button onClick={soon("Completing your profile")}
                  className="mt-6 h-12 rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 text-base font-semibold text-white transition active:scale-[0.98]">
                  Get started
                </button>
              </div>
            </div>

            <hr className="my-10 border-hairline" />
            <button onClick={toggleReviews} aria-expanded={showReviews} className="flex items-center gap-4 text-lg hover:underline">
              <ChatIcon />Show reviews I’ve written
            </button>
            {isHost && (
              <Link href={`/users/show/${user.id}`} className="mt-6 flex items-center gap-4 text-lg hover:underline">
                <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="16" cy="16" r="4" /><path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z" /></svg>
                View my public profile
              </Link>
            )}
            {showReviews && (
              <div className="mt-6 animate-[fade-in_0.2s_ease-out]">
                {reviews === null ? <p className="text-muted">Loading…</p>
                  : reviews.length === 0 ? <p className="text-muted">You haven’t written any reviews yet. After a stay, you can review it from Trips.</p>
                  : (
                    <ul className="space-y-3">
                      {reviews.map((t) => (
                        <li key={t.id}>
                          <Link href={`/listings/${t.listing.id}`} className="block rounded-xl border border-hairline p-4 hover:bg-soft">
                            <p className="font-semibold">{t.listing.title}</p>
                            <p className="text-sm text-muted">{t.listing.city} · stayed {t.check_in}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-[560px] animate-[fade-in_0.3s_ease-out_both]">
            <h2 className="text-[32px] font-semibold tracking-tight">Connections</h2>
            <p className="mt-4 text-base leading-6 text-muted">When you join an experience or invite someone on a trip, you’ll find the profiles of other guests here.</p>
            <Link href="/" className="mt-6 inline-block rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] px-6 py-3 text-base font-semibold text-white">Book a trip</Link>
          </div>
        )}
      </main>
    </div>
  );
}

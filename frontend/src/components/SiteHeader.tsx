"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBanner from "./AppBanner";
import Avatar from "./Avatar";
import ProductTabs, { PRODUCT_TABS, useActiveTab } from "./ProductTabs";
import SearchPill from "./SearchPill";
import { HeartIcon, Logo, UserIcon } from "./icons";
import { api } from "@/lib/api";
import type { Trip } from "@/lib/types";
import { useUnreadMessages } from "@/lib/messaging";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

function DesktopTabs() {
  const active = useActiveTab();
  return (
    <nav className="flex gap-8">
      {PRODUCT_TABS.map((t) => (
        <Link key={t.label} href={t.href}
          className={`group flex h-[60px] items-center gap-1.5 border-b-2 text-sm font-medium leading-[18px] transition-colors ${t.label === active ? "border-ink font-semibold text-ink" : "border-transparent text-muted hover:text-ink"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={t.icon} alt="" className="h-12 w-auto transition-transform duration-200 ease-out group-hover:scale-110 group-active:scale-95" />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/** `hosting`: inside the host area the first link becomes "Switch to travelling" and the host-signup card is hidden.
 *  Outside it, hosts see "Switch to hosting" instead of "Become a host". */
function AccountMenu({ hosting = false }: { hosting?: boolean }) {
  const { user, logout } = useUser();
  const toast = useToast();
  const { openLogin, openHostChoice } = useAuthModal();
  // guests (logged in, not hosts) get the "What would you like to host?" popup
  const hostGate = (e: React.MouseEvent) => { if (user && user.role !== "host") { e.preventDefault(); openHostChoice(); } };
  // logged-out visitors get the login popup instead of a page change
  const gate = (e: React.MouseEvent) => { if (!user) { e.preventDefault(); openLogin(); } };
  const [open, setOpen] = useState(false);
  const [theme, setThemeState] = useState<Theme>("system");
  useEffect(() => setThemeState(getTheme()), []);
  const pickTheme = (t: Theme) => { setTheme(t); setThemeState(t); };
  // Upcoming trip count next to "Trips", refreshed each time the menu opens (so new bookings show up).
  const [upcoming, setUpcoming] = useState(0);
  const unread = useUnreadMessages();
  useEffect(() => {
    if (!open || !user) return;
    const today = new Date().toISOString().slice(0, 10);
    api<Trip[]>("/trips").then((t) => setUpcoming(t.filter((x) => x.status === "confirmed" && x.check_out > today).length)).catch(() => {});
  }, [open, user]);
  const row = "block w-full px-6 py-2.5 text-left text-sm hover:bg-soft";
  const iconRow = "flex w-full items-center gap-3 px-6 py-2.5 text-left text-sm font-medium hover:bg-soft";
  const soon = (what: string) => () => toast(`${what} is coming soon`);
  const hostHref = user ? (user.role === "host" ? "/host" : "/login") : "/login?redirect=%2Fbecome-a-host";
  // Hosts on the travel side get "Switch to hosting"; guests and visitors get "Become a host".
  const isHost = user?.role === "host";
  const circle = "flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-ink/[0.06] transition-colors hover:bg-ink/10";

  return (
    <div className="relative flex items-center gap-2">
      {hosting ? (
        <Link href="/" className="mr-1 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold hover:bg-soft">Switch to travelling</Link>
      ) : (
        <Link href={hostHref} onClick={hostGate} className="mr-1 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold hover:bg-soft">
          {isHost ? "Switch to hosting" : "Become a host"}
        </Link>
      )}
      <Link href={user ? (hosting ? "/host/profile" : "/users/profile") : "#"} onClick={gate} aria-label={user ? "Profile" : "Log in or sign up"} className={circle}>
        {user ? <Avatar user={user} className="h-full w-full text-base" /> : <UserIcon className="h-[22px] w-[22px]" />}
      </Link>
      <button onClick={() => setOpen(!open)} aria-label={unread ? `Main navigation menu, ${unread} unread messages` : "Main navigation menu"} aria-expanded={open} className={`relative ${circle} overflow-visible`}>
        {unread > 0 && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-rausch" />}
        <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M2 16h28M2 24h28M2 8h28" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[52px] z-50 w-[264px] overflow-hidden rounded-2xl bg-surface py-2 text-ink shadow-[0_6px_20px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
            onClick={() => setOpen(false)}>
            {user && (
              <>
                <Link href="/wishlist" className={iconRow}><HeartIcon className="h-5 w-5" />Wishlists</Link>
                <Link href="/trips" className={iconRow}>
                  <Logo className="h-5 w-5" />Trips
                  {upcoming > 0 && <span className="ml-auto rounded-full bg-soft px-2 py-0.5 text-xs font-semibold">{upcoming} upcoming</span>}
                </Link>
                <Link href={hosting ? "/host/messages" : "/messages"} className={iconRow}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4V5Z" /></svg>Messages
                  {unread > 0 && <span className="ml-auto rounded-full bg-rausch px-2 py-0.5 text-xs font-semibold text-white">{unread}</span>}
                </Link>
                <Link href={hosting ? "/host/profile" : "/users/profile"} className={iconRow}>
                  <Avatar user={user} className="h-5 w-5 text-[10px]" />Profile
                </Link>
                <hr className="mx-6 my-2 border-hairline" />
                <button onClick={soon("Notifications")} className={row}>Notifications</button>
                <Link href="/account-settings" className={row}>Account settings</Link>
              </>
            )}
            <button onClick={soon("Languages & currency")} className={`${row} flex items-center gap-2.5`}>
              <svg viewBox="0 0 32 32" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="16" cy="16" r="14" /><path d="M2 16h28M16 2c-4.4 4.2-5.3 9.1-5.3 14s.9 9.8 5.3 14c4.4-4.2 5.3-9.1 5.3-14S20.4 6.2 16 2Z" /></svg>
              Languages &amp; currency
            </button>
            <button onClick={soon("Help Centre")} className={`${row} flex items-center gap-2.5`}>
              <svg viewBox="0 0 32 32" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="16" cy="16" r="14" /><path d="M12.2 12.2a3.9 3.9 0 1 1 5.5 3.5c-1 .5-1.7 1.4-1.7 2.5v.8" /><circle cx="16" cy="23" r=".6" fill="currentColor" /></svg>
              Help Centre
            </button>
            {user && (
              <div className="flex items-center justify-between gap-2 px-6 py-2 text-sm" onClick={(e) => e.stopPropagation()}>
                <span>Theme</span>
                <div role="radiogroup" aria-label="Theme" className="flex rounded-full bg-soft p-0.5">
                  {(["system", "light", "dark"] as const).map((t) => (
                    <button key={t} role="radio" aria-checked={theme === t} onClick={() => pickTheme(t)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${theme === t ? "bg-surface shadow-sm" : "text-muted"}`}>
                      {t === "system" ? "Auto" : t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="mx-6 my-2 border-hairline" />
            {!hosting && isHost && <Link href="/host" className={row}>Switch to hosting</Link>}
            {!hosting && !isHost && <Link href={hostHref} onClick={hostGate} className="flex items-center justify-between gap-3 px-6 py-2.5 hover:bg-soft">
              <div>
                <p className="text-sm font-semibold">Become a host</p>
                <p className="mt-0.5 text-xs leading-[1.4] text-muted">It’s easy to start hosting and earn extra income.</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/become-host.png" alt="" className="h-16 w-auto shrink-0" />
            </Link>}

            {!hosting && <hr className="mx-6 my-2 border-hairline" />}
            <button onClick={soon("Refer a host")} className={row}>Refer a host</button>
            <button onClick={soon("Find a co-host")} className={row}>Find a co-host</button>
            {user && <button onClick={soon("Gift cards")} className={row}>Gift cards</button>}

            <hr className="mx-6 my-2 border-hairline" />
            {user
              ? <button onClick={logout} className={row}>Log out</button>
              : <button onClick={openLogin} className={row}>Log in or sign up</button>}
          </div>
        </>
      )}
    </div>
  );
}

export default function SiteHeader() {
  const { user } = useUser();
  const path = usePathname();
  const isHosting = path === "/host" || path.startsWith("/host/");
  const hostUnread = useUnreadMessages();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  // Clicking the compact pill opens the full tabs + search bar again; scrolling or the backdrop closes it.
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [path]);

  useEffect(() => {
    const on = () => { setScrolled(window.scrollY > 8); setExpanded(false); };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Host area: Today / Calendar / Listings / Messages, like Airbnb's hosting header.
  if (isHosting) {
    const tabs = [
      { label: "Today", href: "/host", active: path === "/host" },
      { label: "Calendar", href: "/host/calendar", active: path.startsWith("/host/calendar") },
      { label: "Listings", href: "/host/listings", active: path.startsWith("/host/listings") || path.startsWith("/host/new") || /^\/host\/\d+/.test(path) },
      { label: "Messages", href: "/host/messages", active: path.startsWith("/host/messages") },
    ];
    return (
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-x-4 px-5 md:grid md:h-20 md:grid-cols-[1fr_auto_1fr] md:flex-nowrap md:px-10 min-[1440px]:px-12">
          <Link href="/host" className="flex h-16 items-center gap-1 text-rausch md:h-auto" aria-label="Airbnb hosting">
            <Logo className="h-8 w-8" /><span className="hidden text-[26px] font-bold tracking-tight lg:inline">airbnb</span>
          </Link>
          <nav className="no-scrollbar order-3 flex w-full justify-start gap-1 overflow-x-auto pb-2 md:order-none md:w-auto md:justify-center md:pb-0" aria-label="Hosting">
            {tabs.map((t) => (
              <Link key={t.label} href={t.href} aria-current={t.active ? "page" : undefined}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors ${t.active ? "bg-soft font-semibold text-ink" : "text-muted hover:bg-soft hover:text-ink"}`}>
                {t.label}
                {t.label === "Messages" && hostUnread > 0 && <span className="rounded-full bg-rausch px-1.5 py-px text-[11px] font-semibold leading-4 text-white">{hostUnread}</span>}
              </Link>
            ))}
          </nav>
          <div className="md:justify-self-end"><AccountMenu hosting /></div>
        </div>
      </header>
    );
  }

  // Listing page on laptops: logo, compact search pill and account menu. It scrolls away with the
  // page; the listing's own section nav takes over (see ListingView). Phones keep the slim header.
  // the listing wizard has its own full-screen header (logo, Questions?, Save & exit)
  if (path.startsWith("/become-a-host")) return null;

  if (path.startsWith("/listings/") || path.startsWith("/messages")) {
    return (
      <header>
        <div className="sticky top-0 z-30 border-b border-hairline bg-surface md:hidden">
          <div className="flex h-16 items-center justify-between px-5">
            <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-2xl hover:bg-soft">‹</button>
            <Link href="/" className="text-rausch"><Logo className="h-8 w-8" /></Link>
            <Link href="/login" aria-label="Account"><UserIcon className="h-7 w-7 text-muted" /></Link>
          </div>
        </div>
        <div className="hidden border-b border-hairline bg-surface md:block">
          <div className="mx-auto grid h-20 max-w-[1760px] grid-cols-[1fr_auto_1fr] items-center px-10 min-[1440px]:px-12">
            <Link href="/" className="flex items-center gap-1 text-rausch">
              <Logo className="h-8 w-8" /><span className="text-[26px] font-bold tracking-tight">airbnb</span>
            </Link>
            <Suspense fallback={<div className="h-12" />}><SearchPill variant="compact" onExpand={() => setExpanded(true)} /></Suspense>
            <div className="flex justify-end"><AccountMenu /></div>
          </div>
        </div>
        {expanded && (
          <>
            <div className="fixed inset-0 z-40 hidden bg-black/30 md:block" onClick={() => setExpanded(false)} />
            <div className="fixed inset-x-0 top-0 z-50 hidden h-[196px] animate-[drop_0.25s_ease-out] border-b border-hairline/60 bg-gradient-to-b from-surface from-40% to-soft md:block">
              <div className="relative mx-auto flex h-[88px] max-w-[1760px] items-center justify-between px-10 min-[1440px]:px-12">
                <Link href="/" className="relative z-10 flex items-center gap-1 text-rausch">
                  <Logo className="h-8 w-8" /><span className="text-[26px] font-bold tracking-tight">airbnb</span>
                </Link>
                <div className="absolute left-1/2 top-[14px] -translate-x-1/2"><DesktopTabs /></div>
                <div className="relative z-10"><AccountMenu /></div>
              </div>
              <div className="absolute inset-x-0 top-[100px] px-10">
                <Suspense fallback={<div className="h-[66px]" />}><SearchPill variant="bar" /></Suspense>
              </div>
            </div>
          </>
        )}
      </header>
    );
  }

  // Checkout ("Confirm and pay"): just the logo, like Airbnb's.
  if (path.startsWith("/checkout")) {
    return (
      <header className="border-b border-hairline bg-surface">
        <div className="flex h-16 items-center px-5 md:h-20 md:px-6">
          <Link href="/" className="flex items-center gap-1 text-rausch">
            <Logo className="h-8 w-8" /><span className="hidden text-[26px] font-bold tracking-tight md:inline">airbnb</span>
          </Link>
        </div>
      </header>
    );
  }

  // Login and the profile page: logo and account menu only, no tabs or search.
  if (path.startsWith("/login") || path.startsWith("/users/")) {
    return (
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface">
        <div className="mx-auto flex h-[84px] max-w-[1760px] items-center justify-between px-5 md:px-10 min-[1440px]:px-12">
          <Link href="/" className="flex items-center gap-1 text-rausch">
            <Logo className="h-9 w-9" /><span className="hidden text-[28px] font-bold tracking-tight md:inline">airbnb</span>
          </Link>
          <AccountMenu />
        </div>
      </header>
    );
  }

  const compact = scrolled && !expanded;

  return (
    <header>
      <AppBanner />

      {/* Phone */}
      <div className="sticky top-0 z-30 bg-surface pb-1 pt-4 md:hidden">
        <div className="px-5"><Suspense fallback={<div className="h-[60px]" />}><SearchPill variant="pill" /></Suspense></div>
        <div className="mt-3"><ProductTabs /></div>
      </div>

      {/* Laptop: big tabs + search bar that morph into the compact pill on scroll, like Airbnb.
          The outer div reserves the expanded height so the page doesn't jump while the bar animates. */}
      {expanded && <div className="fixed inset-0 z-20 hidden bg-black/30 md:block" onClick={() => setExpanded(false)} />}
      <div className="hidden h-[196px] md:block">
        <div className={`fixed inset-x-0 top-0 z-30 border-b bg-surface transition-[height,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${compact ? "h-20 border-hairline shadow-[0_1px_2px_rgba(0,0,0,0.08)]" : "h-[196px] border-hairline/60 bg-gradient-to-b from-surface from-40% to-soft"}`}>
          <div className={`relative mx-auto flex max-w-[1760px] items-center justify-between px-10 min-[1440px]:px-12 transition-[height] duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${compact ? "h-20" : "h-[88px]"}`}>
            <Link href="/" className="relative z-10 flex items-center gap-1 text-rausch">
              <Logo className="h-8 w-8" /><span className="text-[26px] font-bold tracking-tight">airbnb</span>
            </Link>

            <div className={`absolute left-1/2 top-[14px] -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${compact ? "pointer-events-none -translate-y-10 scale-75 opacity-0" : "opacity-100"}`}>
              <DesktopTabs />
            </div>

            <div className={`absolute left-1/2 top-4 -translate-x-1/2 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${compact ? "opacity-100" : "pointer-events-none translate-y-[88px] scale-x-[1.6] scale-y-[1.35] opacity-0"}`}>
              <Suspense fallback={<div className="h-12" />}><SearchPill variant="compact" onExpand={() => setExpanded(true)} /></Suspense>
            </div>

            <div className="relative z-10"><AccountMenu /></div>
          </div>

          <div className={`absolute inset-x-0 top-[100px] origin-top px-10 transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)] ${compact ? "pointer-events-none -translate-y-[80px] scale-x-[0.6] scale-y-[0.75] opacity-0" : "opacity-100"}`}>
            <Suspense fallback={<div className="h-[66px]" />}><SearchPill variant="bar" /></Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}

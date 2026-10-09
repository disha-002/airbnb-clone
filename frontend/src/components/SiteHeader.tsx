"use client";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppBanner from "./AppBanner";
import ProductTabs from "./ProductTabs";
import SearchPill from "./SearchPill";
import { Logo, UserIcon } from "./icons";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useAuthModal } from "@/context/AuthModalContext";

const TABS = [
  { label: "All", icon: "🌍", soon: false },
  { label: "Homes", icon: "🏠", soon: false },
  { label: "Experiences", icon: "🎈", soon: true },
  { label: "Services", icon: "🛎️", soon: true },
];

function DesktopTabs() {
  const toast = useToast();
  return (
    <nav className="flex gap-9">
      {TABS.map((t, i) => (
        <button key={t.label} onClick={() => t.soon && toast(`${t.label} are coming soon`)}
          className={`flex items-center gap-2 border-b-[3px] pb-2 pt-1 text-[17px] ${i === 0 ? "border-ink font-semibold" : "border-transparent text-muted hover:text-ink"}`}>
          <span className="text-[44px] leading-none">{t.icon}</span>{t.label}
        </button>
      ))}
    </nav>
  );
}

function AccountMenu() {
  const { user, logout } = useUser();
  const toast = useToast();
  const { openLogin, openHostChoice } = useAuthModal();
  // guests (logged in, not hosts) get the "What would you like to host?" popup
  const hostGate = (e: React.MouseEvent) => { if (user && user.role !== "host") { e.preventDefault(); openHostChoice(); } };
  // logged-out visitors get the login popup instead of a page change
  const gate = (e: React.MouseEvent) => { if (!user) { e.preventDefault(); openLogin(); } };
  const [open, setOpen] = useState(false);
  const row = "block w-full px-4 py-3 text-left text-sm hover:bg-soft";
  const soon = (what: string) => () => toast(`${what} is coming soon`);

  return (
    <div className="relative flex items-center gap-2">
      <Link href={user ? (user.role === "host" ? "/host" : "/login") : "/login?redirect=%2Fbecome-a-host"} onClick={hostGate} className="mr-2 rounded-full px-4 py-3 text-sm font-medium hover:bg-soft">
        {user?.role === "host" ? "Switch to hosting" : "Become a host"}
      </Link>
      <Link href={user ? "/login" : "#"} onClick={gate} aria-label="Account" className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-black/5 hover:bg-black/10">
        {user?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : <UserIcon className="h-7 w-7" />}
      </Link>
      <button onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-14 z-50 w-[264px] overflow-hidden rounded-2xl bg-white py-2 text-ink shadow-[0_2px_16px_rgba(0,0,0,0.2)]"
            onClick={() => setOpen(false)}>
            {user && (
              <>
                <Link href="/trips" className={row}>Trips</Link>
                <Link href="/wishlist" className={row}>Wishlists</Link>
                <hr className="mx-4 my-2 border-hairline" />
              </>
            )}
            <button onClick={soon("Languages & currency")} className={`${row} flex items-center gap-3`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9.5" /><path d="M2.5 12h19M12 2.5c3 3 3 16.5 0 19M12 2.5c-3 3-3 16.5 0 19" /></svg>
              Languages &amp; currency
            </button>
            <button onClick={soon("Help Centre")} className={`${row} flex items-center gap-3`}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" /></svg>
              Help Centre
            </button>

            <hr className="mx-4 my-2 border-hairline" />
            <Link href={user ? (user.role === "host" ? "/host" : "/login") : "/login?redirect=%2Fbecome-a-host"} onClick={hostGate} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-soft">
              <div>
                <p className="text-sm font-semibold">{user?.role === "host" ? "Hosting dashboard" : "Become a host"}</p>
                <p className="mt-0.5 text-sm leading-snug text-muted">It’s easy to start hosting and earn extra income.</p>
              </div>
              <span className="text-5xl leading-none" aria-hidden>🙋‍♀️</span>
            </Link>

            <hr className="mx-4 my-2 border-hairline" />
            <button onClick={soon("Refer a host")} className={row}>Refer a host</button>
            <button onClick={soon("Find a co-host")} className={row}>Find a co-host</button>

            <hr className="mx-4 my-2 border-hairline" />
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
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Listing + checkout pages use a slim header, like Airbnb's.
  if (path.startsWith("/listings/") || path.startsWith("/checkout")) {
    return (
      <header className="sticky top-0 z-30 border-b border-hairline bg-white">
        <div className="mx-auto flex h-16 max-w-[1760px] items-center justify-between px-5 md:px-10">
          <button onClick={() => router.back()} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full text-2xl hover:bg-soft md:hidden">‹</button>
          <Link href="/" className="flex items-center gap-1 text-rausch">
            <Logo className="h-8 w-8" /><span className="hidden text-2xl font-bold tracking-tight md:inline">airbnb</span>
          </Link>
          <Link href="/login" className="flex items-center gap-2 rounded-full border border-hairline py-1.5 pl-3 pr-2 text-sm font-medium">
            {user ? user.name.split(" ")[0] : "Log in"}
            <UserIcon className="h-7 w-7 text-muted" />
          </Link>
        </div>
      </header>
    );
  }

  if (path.startsWith("/login")) {
    return (
      <header className="sticky top-0 z-30 border-b border-hairline bg-white">
        <div className="mx-auto flex h-[84px] max-w-[1760px] items-center justify-between px-5 md:px-10">
          <Link href="/" className="flex items-center gap-1 text-rausch">
            <Logo className="h-9 w-9" /><span className="hidden text-[28px] font-bold tracking-tight md:inline">airbnb</span>
          </Link>
          <AccountMenu />
        </div>
      </header>
    );
  }

  return (
    <header>
      <AppBanner />

      {/* Phone */}
      <div className="sticky top-0 z-30 bg-white pb-1 pt-4 md:hidden">
        <div className="px-5"><Suspense fallback={<div className="h-[60px]" />}><SearchPill variant="pill" /></Suspense></div>
        <div className="mt-3"><ProductTabs /></div>
      </div>

      {/* Laptop: big tabs + search bar at the top, collapsing to a compact pill on scroll */}
      <div className={`sticky top-0 z-30 hidden bg-white md:block ${scrolled ? "border-b border-hairline shadow-sm" : "border-b border-hairline/60"}`}>
        <div className="mx-auto grid max-w-[1760px] grid-cols-[1fr_auto_1fr] items-center px-10 pt-4">
          <Link href="/" className="flex items-center gap-1 text-rausch">
            <Logo className="h-9 w-9" /><span className="text-[28px] font-bold tracking-tight">airbnb</span>
          </Link>
          <div className={scrolled ? "pb-4" : ""}>
            {scrolled
              ? <Suspense fallback={<div className="h-12" />}><SearchPill variant="compact" /></Suspense>
              : <DesktopTabs />}
          </div>
          <div className={`flex justify-end ${scrolled ? "pb-4" : ""}`}><AccountMenu /></div>
        </div>
        {!scrolled && (
          <div className="px-10 pb-5 pt-3"><Suspense fallback={<div className="h-[66px]" />}><SearchPill variant="bar" /></Suspense></div>
        )}
      </div>
    </header>
  );
}

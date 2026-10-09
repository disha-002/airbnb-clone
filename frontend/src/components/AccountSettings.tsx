"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { Logo } from "./icons";

const ico = (d: React.ReactNode) => (
  <svg viewBox="0 0 32 32" className="h-6 w-6 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
type Row = { label: string; value: string; action: string };
type Section = { key: string; title: string; icon: React.ReactNode; badge?: string; rows: (name: string, email: string) => Row[] };

const mask = (e: string) => { const [l, d] = e.split("@"); return l.length > 2 ? `${l[0]}***${l.slice(-1)}@${d}` : `${l[0]}***@${d}`; };

const SECTIONS: Section[] = [
  { key: "personal", title: "Personal information", icon: ico(<g><circle cx="16" cy="11" r="5" /><path d="M5 28c1-6 5.500-9 11-9s10 3 11 9" /></g>),
    rows: (n, e) => [
      { label: "Legal name", value: n, action: "Edit" },
      { label: "Preferred first name", value: "Not provided", action: "Add" },
      { label: "Email address", value: mask(e), action: "Edit" },
      { label: "Phone numbers", value: "Add a number so confirmed guests and Airbnb can get in touch. You can add other numbers and choose how they’re used.", action: "Add" },
      { label: "Identity verification", value: "Not started", action: "Start" },
      { label: "Residential address", value: "Not provided", action: "Add" },
      { label: "Mailing address", value: "Not provided", action: "Add" },
      { label: "Emergency contact", value: "Not provided", action: "Add" },
    ] },
  { key: "security", title: "Login & security", icon: ico(<g><path d="M16 3 5 7v8c0 7 4.500 11.500 11 14 6.500-2.500 11-7 11-14V7z" /></g>),
    rows: () => [
      { label: "Password", value: "Last updated a while ago", action: "Update" },
      { label: "Social accounts", value: "Not connected", action: "Connect" },
      { label: "Device history", value: "See where you’re logged in", action: "View" },
      { label: "Deactivate your account", value: "Take care of that now", action: "Deactivate" },
    ] },
  { key: "privacy", title: "Privacy", icon: ico(<g><path d="M11 17V7a2 2 0 0 1 4 0v8M15 15V5a2 2 0 0 1 4 0v10M19 15V8a2 2 0 0 1 4 0v10c0 5-3 9-8 9-4 0-6-2-8-6l-3-5a2 2 0 0 1 3-2l3 3" /></g>),
    rows: () => [
      { label: "Read receipts", value: "Let others know when you’ve read their messages", action: "Edit" },
      { label: "Show your home city", value: "On your public profile", action: "Edit" },
      { label: "Request your personal data", value: "Get a copy of what we hold about you", action: "Request" },
    ] },
  { key: "notifications", title: "Notifications", icon: ico(<g><path d="M8 24V14a8 8 0 0 1 16 0v10l2 2H6z" /><path d="M13 28h6" /></g>),
    rows: () => [
      { label: "Offers and updates", value: "Email", action: "Edit" },
      { label: "Account activity and policies", value: "Email and SMS", action: "Edit" },
      { label: "Reminders", value: "Email", action: "Edit" },
      { label: "Messages", value: "Email", action: "Edit" },
    ] },
  { key: "taxes", title: "Taxes", icon: ico(<g><rect x="6" y="3" width="20" height="26" rx="3" /><path d="M10 9h12M11 15h2M15 15h2M19 15h2M11 20h2M15 20h2M19 20h2" /></g>),
    rows: () => [{ label: "Tax information", value: "Not provided", action: "Add" }, { label: "Tax documents", value: "None yet", action: "View" }] },
  { key: "payments", title: "Payments", badge: "New", icon: ico(<g><rect x="3" y="8" width="26" height="16" rx="2" /><circle cx="16" cy="16" r="3.500" /></g>),
    rows: () => [{ label: "Your payments", value: "Keep track of all your payments and refunds", action: "Manage" }, { label: "Payment methods", value: "Add a payment method using our secured payment system", action: "Add" }, { label: "Coupons and credits", value: "0 coupons", action: "View" }] },
  { key: "languages", title: "Languages & translation", badge: "New", icon: ico(<g><circle cx="16" cy="16" r="13" /><path d="M3 16h26M16 3c-5 4-5 22 0 26M16 3c5 4 5 22 0 26" /></g>),
    rows: () => [{ label: "Preferred language", value: "English (IN)", action: "Edit" }, { label: "Preferred currency", value: "Indian Rupee (₹)", action: "Edit" }, { label: "Automatic translation", value: "On", action: "Edit" }] },
  { key: "booking", title: "Booking permissions", icon: ico(<g><path d="M3 20h5l4 3h8l5-4a2 2 0 0 0-3-2.500l-3 2M3 18v8h5" /><path d="M13 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 8h8M19 12h6" /></g>),
    rows: () => [{ label: "Let others book for you", value: "Not set up", action: "Add" }] },
  { key: "work", title: "Travel for work", icon: ico(<g><path d="M4 26h24M7 26V16h18v10M10 16V9h12v7M16 3v6" /></g>),
    rows: () => [{ label: "Work email", value: "Not provided", action: "Add" }, { label: "Business trips", value: "Set up an Airbnb for Work profile", action: "Start" }] },
];

export default function AccountSettings() {
  const { user, ready } = useUser();
  const router = useRouter();
  const toast = useToast();
  const [active, setActive] = useState("personal");
  const [tick, setTick] = useState(0);
  const section = SECTIONS.find((s) => s.key === active)!;

  const wrap = "fixed inset-0 z-[70] overflow-y-auto bg-surface text-ink";
  if (ready && !user)
    return (
      <div className={`${wrap} flex flex-col items-center justify-center px-5 text-center`}>
        <h1 className="text-2xl font-semibold">Log in to manage your account</h1>
        <Link href="/login?redirect=%2Faccount-settings" className="mt-6 rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );
  if (!user) return <div className={wrap} />;

  const pick = (k: string) => { setActive(k); setTick((t) => t + 1); };

  return (
    <div className={wrap}>
      <header className="flex h-[84px] items-center justify-between border-b border-hairline px-6 md:px-12">
        <Link href="/" aria-label="Airbnb home" className="text-rausch"><Logo className="h-10 w-10" /></Link>
        <button onClick={() => router.push("/account")} className="rounded-full bg-soft px-6 py-3.5 text-base font-semibold transition hover:bg-ink/10 active:scale-95">Done</button>
      </header>

      <div className="md:grid md:min-h-[calc(100vh-84px)] md:grid-cols-[33%_1fr]">
        <nav className="border-hairline px-6 pb-8 pt-10 md:border-r md:px-12 md:pt-12">
          <h1 className="mb-8 text-[32px] font-semibold tracking-tight md:text-[40px]">Account settings</h1>
          <ul className="space-y-1 md:max-w-[473px]">
            {SECTIONS.map((s) => (
              <li key={s.key}>
                <button onClick={() => pick(s.key)}
                  className={`flex w-full items-center gap-4 rounded-xl px-5 py-[18px] text-left text-xl transition-colors duration-200 ${active === s.key ? "bg-soft font-medium" : "hover:bg-soft/70"}`}>
                  {s.icon}
                  <span>{s.title}</span>
                  {s.badge && <span className="rounded-full bg-[#fde8ee] px-2.5 py-0.5 text-xs font-semibold text-[#d70466]">{s.badge}</span>}
                </button>
              </li>
            ))}
          </ul>
          <hr className="my-6 border-hairline md:max-w-[473px]" />
          <Link href="/account" className="block px-5 text-base font-semibold underline md:max-w-[473px]">Back to account</Link>
        </nav>

        <section key={tick} className="animate-[fade-in_0.25s_ease-out_both] px-6 pb-20 pt-4 md:px-[10%] md:pt-12">
          <div className="md:max-w-[965px]">
            <h2 className="mb-6 text-[32px] font-semibold tracking-tight md:text-[40px]">{section.title}</h2>
            {section.rows(user.name, user.email).map((r, i) => (
              <div key={r.label} className="flex animate-[rise_0.35s_ease-out_both] items-start justify-between gap-6 border-b border-hairline py-6" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="min-w-0 max-w-[640px]">
                  <p className="text-xl font-semibold">{r.label}</p>
                  <p className={`mt-1 text-lg ${/^(Not |Add |None)/.test(r.value) || r.label === "Phone numbers" ? "text-muted" : "text-muted"}`}>{r.value}</p>
                </div>
                <button onClick={() => toast(`${r.label} can’t be changed in this demo`)} className="shrink-0 text-lg font-semibold underline transition hover:text-muted">{r.action}</button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

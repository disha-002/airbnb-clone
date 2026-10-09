"use client";
import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { useRouter } from "next/navigation";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo";
import Avatar from "./Avatar";

/* eslint-disable @next/next/no-img-element */
const ico = (d: React.ReactNode) => (
  <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const CARDS = [
  { key: "personal", title: "Personal info", text: "Provide personal details and how we can reach you", icon: ico(<g><rect x="3" y="6" width="26" height="20" rx="3" /><circle cx="11" cy="14" r="3" /><path d="M6 23c.7-3 2.5-4.5 5-4.5s4.3 1.5 5 4.5M19 13h6M19 18h6" /></g>) },
  { key: "security", title: "Login & security", text: "Update your password and secure your account", icon: ico(<g><path d="M16 3 5 7v8c0 7 4.5 11.5 11 14 6.5-2.5 11-7 11-14V7z" /><path d="m11 16 4 4 6-7" /></g>) },
  { key: "payments", title: "Payments & payouts", text: "Review payments, payouts, coupons and gift cards", icon: ico(<g><rect x="3" y="7" width="26" height="18" rx="3" /><path d="M3 13h26M8 20h6" /></g>) },
  { key: "notifications", title: "Notifications", text: "Choose notification preferences and how you want to be contacted", icon: ico(<g><path d="M8 24V14a8 8 0 0 1 16 0v10l2 2H6z" /><path d="M13 28h6" /></g>) },
  { key: "privacy", title: "Privacy & sharing", text: "Manage your personal data, connected services and data-sharing settings", icon: ico(<g><circle cx="16" cy="16" r="4" /><path d="M2 16s5-9 14-9 14 9 14 9-5 9-14 9S2 16 2 16Z" /></g>) },
  { key: "preferences", title: "Global preferences", text: "Set your default language, currency and timezone", icon: ico(<g><circle cx="16" cy="16" r="13" /><path d="M3 16h26M16 3c-5 4-5 22 0 26M16 3c5 4 5 22 0 26" /></g>) },
];

const FIELDS = (name: string, email: string) => [
  { label: "Legal name", value: name, hint: "This is the name on your travel document, which could be a government ID or passport." },
  { label: "Preferred first name", value: "Not provided", hint: "This is how your first name will appear to other people on Airbnb." },
  { label: "Email address", value: email, hint: "Use an address you’ll always have access to." },
  { label: "Phone numbers", value: "Add a number so confirmed hosts and Airbnb can get in touch.", hint: "" },
  { label: "Identity verification", value: "Not started", hint: "" },
  { label: "Address", value: "Not provided", hint: "" },
  { label: "Emergency contact", value: "Not provided", hint: "" },
];

export default function AccountView() {
  const { users, user, ready, login, logout } = useUser();
  const router = useRouter();
  const toast = useToast();
  const [view, setView] = useState<string | null>(null);

  if (ready && !user)
    return (
      <div className="px-5 py-20 text-center">
        <h1 className="text-2xl font-semibold">Log in to manage your account</h1>
        <Link href="/login?redirect=%2Faccount" className="mt-6 inline-block rounded-lg bg-rausch px-6 py-3 font-semibold text-white">Log in</Link>
      </div>
    );
  if (!user) return <div className="mx-auto h-64 max-w-[1000px] animate-pulse rounded-2xl bg-soft" />;

  const soon = (what: string) => () => toast(`${what} is coming soon`);
  const crumb = "text-sm";

  if (view === "personal")
    return (
      <div className="mx-auto max-w-[1000px] animate-[slide-in_0.3s_cubic-bezier(0.2,0,0,1)_both] px-5 pb-20 md:px-10">
        <p className={`${crumb} mt-8`}>
          <button onClick={() => setView(null)} className="font-semibold underline">Account</button> <span className="mx-1 text-muted">›</span> Personal info
        </p>
        <h1 className="mb-8 mt-4 text-[32px] font-semibold tracking-tight">Personal info</h1>
        <div className="gap-20 md:grid md:grid-cols-[1fr_340px]">
          <div>
            {FIELDS(user.name, user.email).map((f, i) => (
              <div key={f.label} className="flex items-start justify-between gap-6 border-b border-hairline py-6 animate-[rise_0.4s_ease-out_both]" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="min-w-0">
                  <p className="text-lg">{f.label}</p>
                  <p className={`mt-1 text-base ${f.value.startsWith("Not") || f.value.startsWith("Add") ? "text-muted" : ""}`}>{f.value}</p>
                  {f.hint && <p className="mt-1 text-sm text-muted">{f.hint}</p>}
                </div>
                <button onClick={soon("Editing profile details")} className="shrink-0 text-base font-semibold underline transition hover:text-muted">
                  {f.value.startsWith("Not") || f.value.startsWith("Add") ? "Add" : "Edit"}
                </button>
              </div>
            ))}
          </div>
          <aside className="mt-10 h-fit rounded-2xl border border-hairline p-6 md:mt-0">
            <svg viewBox="0 0 32 32" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="6" y="14" width="20" height="14" rx="2" /><path d="M10 14V10a6 6 0 0 1 12 0v4" /></svg>
            <h2 className="mt-4 text-lg font-semibold">Why isn’t my info shown here?</h2>
            <p className="mt-2 text-sm text-muted">We’re hiding some account details to protect your identity.</p>
            <hr className="my-5 border-hairline" />
            <h2 className="text-lg font-semibold">Which details can be edited?</h2>
            <p className="mt-2 text-sm text-muted">Contact info and personal details can be edited. If this info was used to verify your identity, you’ll need to get verified again.</p>
            <hr className="my-5 border-hairline" />
            <h2 className="text-lg font-semibold">What info is shared with others?</h2>
            <p className="mt-2 text-sm text-muted">Airbnb only releases contact information for hosts and guests after a reservation is confirmed.</p>
          </aside>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-[1000px] animate-[fade-in_0.3s_ease-out_both] px-5 pb-20 md:px-10">
      <p className={`${crumb} mt-8`}><Link href="/" className="font-semibold underline">Home</Link> <span className="mx-1 text-muted">›</span> Account</p>
      <div className="mb-10 mt-4 flex items-center gap-5">
        <Avatar user={user} className="h-16 w-16 text-2xl" />
        <div>
          <h1 className="text-[32px] font-semibold leading-9 tracking-tight">Account</h1>
          <p className="mt-1 text-base"><span className="font-semibold">{user.name}</span>, {user.email} · <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.role === "host" ? "bg-rausch/10 text-rausch" : "bg-soft text-muted"}`}>{user.role === "host" ? (user.is_superhost ? "Superhost" : "Host") : "Guest"}</span></p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((c, i) => (
          <button key={c.key} onClick={() => router.push("/account-settings")}
            className="flex h-[168px] animate-[rise_0.45s_cubic-bezier(0.2,0,0,1)_both] flex-col justify-between rounded-2xl bg-surface p-5 text-left shadow-[0_1px_4px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.14)] active:scale-[0.99]"
            style={{ animationDelay: `${i * 60}ms` }}>
            {c.icon}
            <div><p className="text-base font-semibold">{c.title}</p><p className="mt-1 text-sm leading-5 text-muted">{c.text}</p></div>
          </button>
        ))}
      </div>

      <hr className="my-10 border-hairline" />
      <h2 className="text-lg font-semibold">Need to deactivate your account?</h2>
      <button onClick={soon("Account deactivation")} className="mt-2 text-base underline">Take care of that now</button>
      <div className="mt-10 flex flex-wrap gap-3">
        {(() => {
          const other: DemoRole = user.role === "host" ? "guest" : "host";
          const target = users.find((u) => u.email === DEMO_ACCOUNTS[other].email);
          return target && (
            <button onClick={() => { login(target.id); toast(`Switched to the demo ${other} account`); router.push(other === "host" ? "/host" : "/"); }}
              className="rounded-lg border border-ink px-5 py-2.5 text-sm font-semibold transition hover:bg-soft">Switch to demo {other}</button>
          );
        })()}
        <button onClick={() => { logout(); toast("Logged out"); }} className="rounded-lg border border-ink px-5 py-2.5 text-sm font-semibold transition hover:bg-soft">Log out</button>
      </div>
    </div>
  );
}

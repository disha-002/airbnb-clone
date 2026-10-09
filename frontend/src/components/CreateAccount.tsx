"use client";
import { useEffect, useRef, useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import type { User } from "@/lib/types";

const ageOn = (dob: string, today = new Date()) => {
  const [y, m, d] = dob.split("-").map(Number);
  return today.getFullYear() - y - (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d) ? 1 : 0);
};
const prettyDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const X = () => <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;
const Back = () => <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;

/**
 * Airbnb's "Let's create your account" step, shown once to a brand-new email sign-up before they
 * are logged in: legal name (pre-filled from the email), date of birth (18+), marketing opt-out.
 * The title moves into the sticky top bar once the big heading scrolls away.
 */
export default function CreateAccount({ account, onDone, onBack, onClose }: {
  account: User;
  onDone: (u: User) => void;
  onBack: () => void;
  onClose?: () => void;
}) {
  const { completeAccount } = useUser();
  const toast = useToast();
  const [first, ...rest] = account.name.split(" ");
  const [firstName, setFirstName] = useState(first ?? "");
  const [lastName, setLastName] = useState(rest.join(" "));
  const [dob, setDob] = useState("");
  const [optOut, setOptOut] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; dob?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setScrolled(!e.isIntersecting), { rootMargin: "-64px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!firstName.trim() || !lastName.trim()) next.name = "First and last name are required.";
    if (!dob) next.dob = "Select your date of birth to continue.";
    else if (dob > today) next.dob = "Enter a valid date of birth.";
    else if (ageOn(dob) < 18) next.dob = "You must be 18 or older to use Airbnb. Other people won’t see your birthday.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const u = await completeAccount(account.id, { first_name: firstName.trim(), last_name: lastName.trim(), date_of_birth: dob, marketing_opt_out: optOut });
      onDone(u);
    } catch (err) {
      setErrors({ form: (err as Error).message || "Something went wrong. Try again." });
    } finally { setBusy(false); }
  };

  const openPicker = () => {
    const el = dateRef.current;
    if (!el) return;
    try { el.showPicker(); } catch { el.focus(); }
  };

  const soon = (what: string) => () => toast(`${what} is coming soon`);
  const link = "font-medium text-[#004cc4] underline dark:text-[#6ea8ff]";
  const fieldBox = (focusable = true) =>
    `relative block px-4 pb-2.5 pt-6 ${focusable ? "focus-within:z-10 focus-within:rounded-lg focus-within:ring-2 focus-within:ring-ink" : ""}`;
  const floatLabel = "absolute left-4 top-2.5 text-xs text-muted";
  const input = "w-full bg-transparent text-base outline-none";

  return (
    <div>
      <div className={`sticky top-0 z-20 flex h-16 items-center justify-between rounded-t-3xl bg-surface px-6 transition-[border-color] md:px-8 ${scrolled ? "border-b border-hairline" : "border-b border-transparent"}`}>
        <button type="button" onClick={onBack} aria-label="Back" className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft"><Back /></button>
        <p aria-hidden={!scrolled} className={`text-base font-semibold transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}>Let’s create your account</p>
        {onClose ? <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft"><X /></button> : <span className="w-9" />}
      </div>

      <form onSubmit={submit} noValidate className="px-6 pb-6 md:px-8">
        <div className="pb-2 pt-3 text-center">
          <h2 ref={titleRef} className="text-[28px] font-semibold leading-tight tracking-tight md:text-[32px]">Let’s create your account</h2>
          <p className="mt-2 text-base text-muted md:text-lg">This information is required to book or host.</p>
        </div>

        <h3 className="mt-7 text-lg font-semibold">Legal name</h3>
        <div className={`mt-3 rounded-lg border ${errors.name ? "border-rausch" : "border-[#b0b0b0]"}`}>
          <label className={fieldBox()}>
            <span className={floatLabel}>First name</span>
            <input value={firstName} onChange={(e) => { setFirstName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }}
              autoComplete="given-name" className={input} aria-invalid={!!errors.name} />
          </label>
          <div className="border-t border-[#b0b0b0]" />
          <label className={fieldBox()}>
            <span className={floatLabel}>Last name</span>
            <input value={lastName} onChange={(e) => { setLastName(e.target.value); setErrors((x) => ({ ...x, name: undefined })); }}
              autoComplete="family-name" className={input} aria-invalid={!!errors.name} />
          </label>
        </div>
        {errors.name && <p className="mt-2 text-sm text-rausch">{errors.name}</p>}
        <p className="mt-2 text-sm leading-5 text-muted">
          Make sure it matches the name on your government ID. If you go by another name, you can{" "}
          <button type="button" onClick={soon("Preferred first names")} className="font-semibold text-ink underline">add a preferred first name</button>.
        </p>

        <h3 className="mt-7 text-lg font-semibold">Date of birth</h3>
        <div onClick={openPicker}
          className={`relative mt-3 flex h-[58px] cursor-pointer items-center rounded-lg border px-4 focus-within:ring-2 focus-within:ring-ink ${errors.dob ? "border-rausch" : "border-[#b0b0b0]"}`}>
          <span className={`text-base ${dob ? "" : "text-muted"}`}>{dob ? prettyDate(dob) : "Select a date"}</span>
          {/* The real input sits invisibly over the field so keyboards and screen readers still reach it. */}
          <input ref={dateRef} type="date" value={dob} max={today} min="1900-01-01" aria-label="Date of birth" aria-invalid={!!errors.dob}
            onChange={(e) => { setDob(e.target.value); setErrors((x) => ({ ...x, dob: undefined })); }}
            className="absolute inset-0 cursor-pointer opacity-0" />
        </div>
        {errors.dob && <p className="mt-2 text-sm text-rausch">{errors.dob}</p>}

        <h3 className="mt-7 text-lg font-semibold">Email</h3>
        <div className={`mt-3 rounded-lg border border-[#dddddd] bg-soft ${fieldBox(false)}`}>
          <span className={floatLabel}>Email</span>
          <input value={account.email} disabled aria-label="Email" className={`${input} text-muted`} />
        </div>
        <p className="mt-2 text-sm text-muted">We’ll email you trip confirmations and receipts.</p>

        <p className="mt-7 text-sm">All pre-filled information came from your email address.</p>

        <div className="mt-6 rounded-xl bg-soft p-5 text-sm leading-5">
          <p>Airbnb will send you promotions such as deals and marketing notifications. You can opt out at any time via account settings or within marketing emails.</p>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4">
            I don’t want to receive Airbnb promotions.
            <input type="checkbox" checked={optOut} onChange={(e) => setOptOut(e.target.checked)}
              className="h-6 w-6 shrink-0 cursor-pointer appearance-none rounded-md border border-[#b0b0b0] bg-surface bg-center bg-no-repeat checked:border-ink checked:bg-ink checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M5 12l5 5 9-10%22/></svg>')] checked:[background-size:14px]" />
          </label>
        </div>

        <p className="mt-6 text-sm leading-5">
          By selecting <span className="font-semibold">Agree and continue</span>, I agree to Airbnb’s{" "}
          <button type="button" onClick={soon("Terms of Service")} className={link}>Terms of Service</button>,{" "}
          <button type="button" onClick={soon("Payments Terms of Service")} className={link}>Payments Terms of Service</button> and{" "}
          <button type="button" onClick={soon("Nondiscrimination Policy")} className={link}>Nondiscrimination Policy</button>, and acknowledge the{" "}
          <button type="button" onClick={soon("Privacy Policy")} className={link}>Privacy Policy</button>.
        </p>

        {errors.form && <p className="mt-4 text-sm text-rausch">{errors.form}</p>}
        <button type="submit" disabled={busy}
          className="mt-7 h-14 w-full rounded-lg bg-ink text-base font-semibold text-surface transition active:scale-[0.99] disabled:opacity-60 md:text-lg">
          {busy ? "Creating your account…" : "Agree and continue"}
        </button>
      </form>
    </div>
  );
}

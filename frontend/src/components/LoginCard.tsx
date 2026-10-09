"use client";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import type { User } from "@/lib/types";
import { DEMO_ACCOUNTS, type DemoRole } from "@/lib/demo";
import { Logo } from "./icons";
import CreateAccount from "./CreateAccount";

type Role = User["role"];

const GoogleG = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" aria-label="Google">
    <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3a7.2 7.2 0 0 1-10.7-3.78H1.4v3.1A12 12 0 0 0 12 24Z" />
    <path fill="#FBBC05" d="M5.37 14.31a7.2 7.2 0 0 1 0-4.62v-3.1H1.4a12 12 0 0 0 0 10.82l3.97-3.1Z" />
    <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.4 6.59l3.97 3.1A7.2 7.2 0 0 1 12 4.77Z" />
  </svg>
);
const AppleLogo = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-label="Apple">
    <path d="M16.37 12.6c-.03-2.5 2.04-3.7 2.13-3.76-1.16-1.7-2.97-1.93-3.61-1.96-1.54-.16-3 .9-3.78.9-.78 0-1.98-.88-3.26-.86-1.68.03-3.22.98-4.09 2.48-1.74 3.02-.45 7.5 1.25 9.95.83 1.2 1.82 2.55 3.12 2.5 1.25-.05 1.72-.81 3.23-.81s1.94.81 3.26.78c1.35-.02 2.2-1.22 3.02-2.43.95-1.39 1.34-2.74 1.37-2.81-.03-.01-2.62-1.01-2.65-4Zm-2.5-7.35c.69-.84 1.16-2 1.03-3.16-.99.04-2.2.66-2.91 1.5-.64.74-1.2 1.92-1.05 3.05 1.1.09 2.23-.56 2.93-1.39Z" />
  </svg>
);

/**
 * The "Log in or sign up" card, shared by the popup and the /login page. Auth is mocked: the
 * field comes pre-filled with a demo account (guest or host), so logging in is one click.
 */
const agreedKey = (u: User) => `communityCommitment:${u.email}`;
const hasAgreed = (u: User) => { try { return localStorage.getItem(agreedKey(u)) === "yes"; } catch { return false; } };

/** "Everyone belongs here": Airbnb asks each account to accept its Community Commitment once. */
function CommunityCommitment({ onAgree, onDecline }: { onAgree: () => void; onDecline: () => void }) {
  return (
    <div className="relative text-center">
      <button onClick={onDecline} aria-label="Back" className="absolute -left-2 -top-10 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
      </button>
      <Logo className="mx-auto h-12 w-12 text-rausch" />
      <h2 className="mt-4 text-[26px] font-semibold tracking-tight">Everyone belongs here</h2>
      <p className="mt-6 text-base leading-6">
        When you join Airbnb, we ask you to agree to our <span className="font-medium underline">Community Commitment</span>:
      </p>
      <p className="mt-5 text-base leading-6">
        I will treat everyone in the Airbnb community with respect, without judgement or bias, whatever their race,
        religion, national origin, ethnicity, skin colour, disability, sex, gender identity, sexual orientation or age.
      </p>
      <button onClick={onAgree}
        className="mt-7 h-12 w-full rounded-lg bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-base font-semibold text-white active:scale-[0.99]">
        Agree and continue
      </button>
      <button onClick={onDecline} className="mt-3 h-12 w-full rounded-lg bg-soft text-base font-semibold hover:bg-ink/10">Decline</button>
    </div>
  );
}

export type LoginStep = "login" | "create" | "commitment";

export default function LoginCard({ onDone, onStepChange, onClose }: {
  onDone: (role: Role, firstLogin: boolean) => void;
  /** Lets the dialog swap its chrome: the create and commitment screens draw their own back/close buttons. */
  onStepChange?: (step: LoginStep) => void;
  /** Close button for the create-account screen (only when shown in a dialog). */
  onClose?: () => void;
}) {
  const { login, loginWithEmail } = useUser();
  const toast = useToast();
  const [creating, setCreating] = useState<User | null>(null); // new email, before "Let's create your account"
  const [pending, setPending] = useState<User | null>(null); // account waiting on the commitment
  const [demo, setDemo] = useState<DemoRole>("guest");
  const [value, setValue] = useState<string>(DEMO_ACCOUNTS.guest.email);
  const [error, setError] = useState<string | null>(null);

  const pick = (r: DemoRole) => { setDemo(r); setValue(DEMO_ACCOUNTS[r].email); setError(null); };

  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim().toLowerCase();
    if (!v) { setError("Enter an email to continue."); return; }
    setBusy(true);
    try {
      const u = await loginWithEmail(v);
      if (u.account_complete === false) { setCreating(u); onStepChange?.("create"); }
      else if (hasAgreed(u)) finish(u, false, true);
      else { setPending(u); onStepChange?.("commitment"); }
    } catch (err) {
      setError((err as Error).message || "Something went wrong. Try again.");
    } finally { setBusy(false); }
  };

  const finish = (u: User, firstLogin = false, loggedIn = false) => {
    if (!loggedIn) login(u.id);
    toast(`Welcome, ${u.name.split(" ")[0]}! You’re logged in as a ${u.role}.`);
    onDone(u.role, firstLogin);
  };

  if (creating)
    return (
      <CreateAccount account={creating} onClose={onClose}
        onBack={() => { setCreating(null); onStepChange?.("login"); }}
        onDone={(u) => {
          setCreating(null);
          if (hasAgreed(u)) finish(u, true, true);
          else { setPending(u); onStepChange?.("commitment"); }
        }} />
    );

  if (pending)
    return (
      <CommunityCommitment
        onAgree={() => { try { localStorage.setItem(agreedKey(pending), "yes"); } catch {} finish(pending, true, true); }}
        onDecline={() => {
          setPending(null); onStepChange?.("login");
          toast("You need to accept the Community Commitment to use Airbnb");
        }}
      />
    );

  return (
    <>
      <div className="flex flex-col items-center">
        <Logo className="h-12 w-12 text-rausch" />
        <h2 className="mb-8 mt-4 text-[26px] font-semibold tracking-tight">Log in or sign up</h2>
      </div>

      <form onSubmit={submit}>
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-muted">Demo account</span>
          <div role="radiogroup" aria-label="Demo account" className="flex rounded-full bg-soft p-0.5">
            {(Object.keys(DEMO_ACCOUNTS) as DemoRole[]).map((r) => (
              <button key={r} type="button" role="radio" aria-checked={demo === r} onClick={() => pick(r)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold ${demo === r ? "bg-surface shadow-sm" : "text-muted"}`}>
                {DEMO_ACCOUNTS[r].label}
              </button>
            ))}
          </div>
        </div>
        <input value={value} onChange={(e) => { setValue(e.target.value); setError(null); }}
          placeholder="Email" aria-label="Email" type="email" autoComplete="email"
          className={`h-[58px] w-full rounded-xl border px-4 text-base outline-none focus:border-2 focus:border-ink ${error ? "border-rausch" : "border-[#b0b0b0]"}`} />
        {error && <p className="mt-2 text-sm text-rausch">{error}</p>}
        <button type="submit" disabled={busy}
          className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-base font-semibold text-white active:scale-[0.99] disabled:opacity-60">
          {busy ? "Continuing…" : "Continue"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4 text-sm"><span className="h-px flex-1 bg-hairline" />or<span className="h-px flex-1 bg-hairline" /></div>

      <div className="flex justify-center gap-4">
        <button onClick={() => toast("Google sign-in is coming soon")} aria-label="Continue with Google"
          className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-hairline hover:bg-soft"><GoogleG /></button>
        <button onClick={() => toast("Apple sign-in is coming soon")} aria-label="Continue with Apple"
          className="flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-hairline hover:bg-soft"><AppleLogo /></button>
      </div>
    </>
  );
}

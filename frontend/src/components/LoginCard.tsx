"use client";
import { useState } from "react";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/context/ToastContext";
import { Logo } from "./icons";

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
 * The "Log in or sign up" card, shared by the popup and the /login page. Auth is mocked:
 * typing a demo account's email (e.g. maya@demo.com) logs in; demo accounts are also one-click.
 */
export default function LoginCard({ onDone }: { onDone: () => void }) {
  const { users, login } = useUser();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const signIn = (id: number, name: string) => {
    login(id);
    toast(`Welcome, ${name.split(" ")[0]}!`);
    onDone();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = value.trim().toLowerCase();
    if (!v) { setError("Enter a phone number or email to continue."); return; }
    const match = users.find((u) => u.email.toLowerCase() === v);
    if (!match) { setError("This is a demo, so only the demo accounts below can log in."); return; }
    signIn(match.id, match.name);
  };

  return (
    <>
      <div className="flex flex-col items-center">
        <Logo className="h-12 w-12 text-rausch" />
        <h2 className="mb-8 mt-4 text-[26px] font-semibold tracking-tight">Log in or sign up</h2>
      </div>

      <form onSubmit={submit}>
        <input value={value} onChange={(e) => { setValue(e.target.value); setError(null); }}
          placeholder="Phone number or email" aria-label="Phone number or email"
          className={`h-[60px] w-full rounded-xl border px-4 text-[17px] outline-none focus:border-2 focus:border-ink ${error ? "border-rausch" : "border-ink/40"}`} />
        {error && <p className="mt-2 text-sm text-rausch">{error}</p>}
        <button type="submit"
          className="mt-4 h-12 w-full rounded-xl bg-gradient-to-r from-[#E61E4D] to-[#D70466] text-base font-semibold text-white active:scale-[0.99]">
          Continue
        </button>
      </form>

      <div className="my-5 flex items-center gap-4 text-sm"><span className="h-px flex-1 bg-hairline" />or<span className="h-px flex-1 bg-hairline" /></div>

      <div className="flex justify-center gap-4">
        <button onClick={() => toast("Google sign-in is coming soon")} aria-label="Continue with Google"
          className="flex h-[60px] w-[60px] items-center justify-center rounded-xl border border-hairline hover:bg-soft"><GoogleG /></button>
        <button onClick={() => toast("Apple sign-in is coming soon")} aria-label="Continue with Apple"
          className="flex h-[60px] w-[60px] items-center justify-center rounded-xl border border-hairline hover:bg-soft"><AppleLogo /></button>
      </div>

      <div className="mt-8 border-t border-hairline pt-5">
        <p className="mb-3 text-sm font-semibold">Demo accounts</p>
        <ul className="space-y-2">
          {users.map((u) => (
            <li key={u.id}>
              <button onClick={() => signIn(u.id, u.name)}
                className="flex w-full items-center gap-3 rounded-xl border border-hairline px-3 py-2 text-left hover:border-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.avatar_url} alt="" className="h-9 w-9 rounded-full bg-soft" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{u.name}</span>
                  <span className="block truncate text-xs text-muted">{u.email}</span>
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.role === "host" ? "bg-rausch/10 text-rausch" : "bg-soft text-muted"}`}>
                  {u.role === "host" ? (u.is_superhost ? "Superhost" : "Host") : "Guest"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

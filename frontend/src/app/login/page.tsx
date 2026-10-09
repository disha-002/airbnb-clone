"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoginCard, { type LoginStep } from "@/components/LoginCard";

/** Account page for logged-in users; full-page login (with redirect) otherwise. */
function LoginInner() {
  const { user, ready } = useUser();
  const router = useRouter();
  const redirect = useSearchParams().get("redirect"); // e.g. /host from "Become a host"
  const [step, setStep] = useState<LoginStep>("login");
  // Were they already logged in when the page loaded? Someone who logs in *here* gets logged in
  // part-way through (before the Community Commitment), so they must stay on the card and be sent
  // on by onDone (guests home, hosts to the dashboard), not bounced to /account.
  const arrivedLoggedIn = useRef<boolean | null>(null);
  if (ready && arrivedLoggedIn.current === null) arrivedLoggedIn.current = !!user;
  const alreadyIn = ready && arrivedLoggedIn.current === true && !!user;

  // Logged-in visitors go to the redirect target, or the account page instead of a bare card.
  useEffect(() => { if (alreadyIn) router.replace(redirect ?? "/account"); }, [alreadyIn, redirect, router]);
  if (!ready || alreadyIn) return <div className="mx-auto h-64 max-w-[1000px] animate-pulse rounded-2xl bg-soft" />;

  return (
    <div className="relative min-h-[calc(100vh-84px)] bg-surface">
      <div className="relative z-10 flex justify-center px-4 py-10 md:py-16">
        <div className={`w-full max-w-[480px] rounded-3xl border border-hairline bg-surface shadow-[0_8px_28px_rgba(0,0,0,0.08)] ${step === "create" ? "" : "px-6 pb-10 pt-14 md:px-8"}`}>
          <LoginCard onStepChange={setStep} onDone={(role) => router.push(redirect ?? (role === "host" ? "/host" : "/"))} />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="px-5 py-10 text-muted">Loading…</p>}>
      <LoginInner />
    </Suspense>
  );
}

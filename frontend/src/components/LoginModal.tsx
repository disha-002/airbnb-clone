"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoginCard, { type LoginStep } from "./LoginCard";
import { useToast } from "@/context/ToastContext";

/** Popup version of the login card (profile icon / "Log in or sign up"). */
export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const path = usePathname();
  const toast = useToast();
  const [step, setStep] = useState<LoginStep | "promo">("login");
  useEffect(() => { if (open) setStep("login"); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;

  // New guests land on the home page once the welcome offer is closed, unless they were mid-booking.
  const closeOffer = () => { onClose(); if (!path.startsWith("/checkout") && !path.startsWith("/listings")) router.push("/"); };

  // After the Community Commitment, new guests get the welcome offer (like Airbnb's "Take 10% off your next stay").
  if (step === "promo")
    return (
      <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
        <div className="absolute inset-0 animate-[fade-in_0.2s_ease-out] bg-black/50" onClick={closeOffer} />
        <div role="dialog" aria-label="Take 10% off your next stay"
          className="relative w-full animate-[rise_0.35s_cubic-bezier(0.2,0,0,1)_both] overflow-hidden rounded-t-3xl bg-surface shadow-2xl md:max-w-[480px] md:rounded-3xl">
          <div className="flex h-[300px] items-center justify-center bg-gradient-to-b from-[#fbd9e6] via-[#fde8ee] to-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/homes.png" alt="" className="h-60 w-auto animate-[float_4s_ease-in-out_infinite] drop-shadow-xl" />
          </div>
          <button onClick={closeOffer} aria-label="Close" className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#222] shadow hover:scale-105">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <div className="px-8 pb-8 text-center">
            <h2 className="text-[32px] font-semibold leading-9 tracking-tight">Take 10% off your next stay</h2>
            <p className="mt-3 text-lg text-muted">For new guests in selected countries only.<br /><button onClick={() => toast("Offer terms are coming soon")} className="underline">Terms apply</button></p>
            <button onClick={() => { toast("Offer claimed: 10% off your next stay"); closeOffer(); }}
              className="mt-8 h-14 w-full rounded-xl bg-gradient-to-r from-[#E61E4D] via-[#E31C5F] to-[#D70466] text-lg font-semibold text-white transition active:scale-[0.98]">
              Claim offer
            </button>
          </div>
        </div>
      </div>
    );

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-label="Log in or sign up"
        className={`relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl md:max-w-[480px] md:rounded-3xl ${step === "create" ? "" : "px-6 pb-8 pt-16 md:px-8"}`}>
        {step === "login" && <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full hover:bg-soft">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>}
        {/* Hosts land on their dashboard, except mid-booking where they stay on the page. */}
        <LoginCard onStepChange={setStep} onClose={onClose} onDone={(role, firstLogin) => { if (firstLogin && role === "guest") { setStep("promo"); return; } onClose(); if (role === "host" && !path.startsWith("/checkout") && !path.startsWith("/listings")) router.push("/host"); }} />
      </div>
    </div>
  );
}

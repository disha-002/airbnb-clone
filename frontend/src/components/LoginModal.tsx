"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginCard from "./LoginCard";

/** Popup version of the login card (profile icon / "Log in or sign up"). */
export default function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div role="dialog" aria-label="Log in or sign up"
        className="relative max-h-[94vh] w-full overflow-y-auto rounded-t-3xl bg-surface px-6 pb-8 pt-16 shadow-2xl md:max-w-[480px] md:rounded-3xl md:px-8">
        <button onClick={onClose} aria-label="Close" className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-2xl hover:bg-soft">×</button>
        <LoginCard onDone={(role) => { onClose(); if (role === "host") router.push("/host"); }} />
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";
import { Logo } from "./icons";

export default function AppBanner() {
  const [open, setOpen] = useState(true);
  const toast = useToast();
  if (!open) return null;
  return (
    <div className="flex items-center gap-3 border-b border-hairline px-3 py-3 md:hidden">
      <button onClick={() => setOpen(false)} aria-label="Close" className="px-1 text-xl text-muted">×</button>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rausch text-white"><Logo className="h-7 w-7" /></div>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="font-semibold">Get the app</p>
        <p className="truncate text-sm text-muted">The fastest, easiest way to Airbnb</p>
      </div>
      <button onClick={() => toast("Mobile app coming soon")} className="rounded-full bg-[#1E7F4F] px-5 py-2.5 font-semibold text-white">Use app</button>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "./icons";
import SearchModal from "./SearchModal";
import { fmtShort } from "@/lib/dates";

/**
 * pill    - phone: single "Start your search" pill
 * bar     - laptop, top of page: Where / When / Who
 * compact - laptop, after scrolling: Anywhere | Anytime | Add guests
 */
export default function SearchPill({ variant }: { variant: "pill" | "bar" | "compact" }) {
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);

  const q = sp.get("q");
  const ci = sp.get("check_in");
  const co = sp.get("check_out");
  const guests = Number(sp.get("guests") ?? 0);

  const dates = ci && co ? `${fmtShort(ci)} – ${fmtShort(co)}` : null;
  const guestText = guests ? `${guests} guest${guests > 1 ? "s" : ""}` : null;
  const hasSearch = !!(q || dates || guestText);
  const summary = [q || "Anywhere", dates || "Any week", guestText || "1 guest"].join(" · ");

  const redBtn = (size: string) => (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-rausch text-white`}>
      <SearchIcon className="h-4 w-4" />
    </span>
  );

  let trigger: React.ReactNode;
  if (variant === "pill") {
    trigger = (
      <button onClick={() => setOpen(true)}
        className="mx-auto flex h-[60px] w-full max-w-xl items-center justify-center gap-2.5 rounded-full bg-white px-4 text-[17px] font-medium shadow-pill ring-1 ring-black/5">
        <SearchIcon className="h-5 w-5 shrink-0" />
        <span className="truncate">{hasSearch ? summary : "Start your search"}</span>
      </button>
    );
  } else if (variant === "bar") {
    trigger = (
      <button onClick={() => setOpen(true)}
        className="mx-auto flex h-[66px] w-full max-w-[850px] items-center rounded-full bg-white pl-8 pr-2.5 text-left shadow-pill ring-1 ring-black/10 hover:shadow-lg">
        <div className="flex-[1.2] border-r border-hairline pr-4"><p className="text-xs font-semibold">Where</p><p className="truncate text-sm text-muted">{q || "Search destinations"}</p></div>
        <div className="flex-1 border-r border-hairline px-6"><p className="text-xs font-semibold">When</p><p className="truncate text-sm text-muted">{dates || "Add dates"}</p></div>
        <div className="flex-1 px-6"><p className="text-xs font-semibold">Who</p><p className="truncate text-sm text-muted">{guestText || "Add guests"}</p></div>
        {redBtn("h-[50px] w-[50px]")}
      </button>
    );
  } else {
    trigger = (
      <button onClick={() => setOpen(true)}
        className="flex h-12 items-center rounded-full bg-white pl-4 pr-2 text-sm font-medium shadow-pill ring-1 ring-black/10 hover:shadow-lg">
        <span className="mr-1 text-[32px] leading-none">🏠</span>
        <span className="pr-3">{q || "Anywhere"}</span>
        <span className="h-6 border-l border-hairline" />
        <span className="px-4">{dates || "Anytime"}</span>
        <span className="h-6 border-l border-hairline" />
        <span className={`px-4 ${guestText ? "" : "font-normal text-muted"}`}>{guestText || "Add guests"}</span>
        {redBtn("h-8 w-8")}
      </button>
    );
  }

  return (
    <>
      {trigger}
      <SearchModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

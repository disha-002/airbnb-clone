"use client";
import { useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/types";
import { ShareIcon } from "./ListingIcons";
import { HeartIcon } from "./icons";

/* eslint-disable @next/next/no-img-element */
const ROOMS = ["Living room", "Full kitchen", "Bedroom", "Full bathroom", "Exterior", "Additional photos"];

export default function PhotoTour({ photos, title, onClose }: { photos: Photo[]; title: string; onClose: () => void }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const refs = useRef<(HTMLElement | null)[]>([]);

  const size = Math.max(1, Math.ceil(photos.length / ROOMS.length));
  const groups = ROOMS.map((name, g) => ({ name, items: photos.slice(g * size, (g + 1) * size).map((p, i) => ({ p, index: g * size + i })) }))
    .filter((g) => g.items.length);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") lightbox === null ? onClose() : setLightbox(null);
      if (lightbox !== null && e.key === "ArrowRight") setLightbox((i) => Math.min(photos.length - 1, (i ?? 0) + 1));
      if (lightbox !== null && e.key === "ArrowLeft") setLightbox((i) => Math.max(0, (i ?? 0) - 1));
    };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [lightbox, onClose, photos.length]);

  const share = () => { try { navigator.clipboard?.writeText(window.location.href); } catch {} };

  const circle = "flex h-11 w-11 items-center justify-center rounded-full border border-[#222] text-[#222] hover:bg-[#f7f7f7]";

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white text-[#222]">
      <div className="flex items-center justify-between px-6 py-5">
        <button onClick={onClose} aria-label="Back" className={circle}>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <button onClick={share} className="flex items-center gap-2 rounded-lg px-3 py-2 underline hover:bg-[#f7f7f7]"><ShareIcon className="h-4 w-4" /> Share</button>
          <button onClick={() => setSaved(!saved)} className="flex items-center gap-2 rounded-lg px-3 py-2 underline hover:bg-[#f7f7f7]">
            <HeartIcon className="h-4 w-4" fill={saved ? "#FF385C" : "none"} /> Save
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-6 pb-20 md:px-0">
        <h1 className="mt-6 text-[26px] font-semibold">Photo tour</h1>
        <div className="no-scrollbar mt-9 flex gap-5 overflow-x-auto pb-2">
          {groups.map((g, gi) => (
            <button key={g.name} onClick={() => refs.current[gi]?.scrollIntoView({ behavior: "smooth", block: "start" })} className="w-[141px] shrink-0 text-left">
              <img src={g.items[0].p.url} alt={g.name} className="h-[93px] w-[141px] rounded-sm object-cover shadow-md" />
              <span className="mt-3 block text-base">{g.name}</span>
            </button>
          ))}
        </div>

        {groups.map((g, gi) => (
          <section key={g.name} ref={(el) => { refs.current[gi] = el; }} className="mt-14 scroll-mt-6 md:grid md:grid-cols-[526px_1fr] md:gap-0">
            <h2 className="mb-4 text-[26px] font-semibold md:mb-0">{g.name}</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {g.items.map(({ p, index }, i) => (
                <button key={p.id} onClick={() => setLightbox(index)} className={i === 0 ? "col-span-2" : ""}>
                  <img src={p.url} alt={title} className="w-full object-cover" style={{ aspectRatio: i === 0 ? "3 / 2" : "4 / 3" }} />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-black text-white">
          <div className="relative flex items-center justify-between px-10 py-8">
            <button onClick={() => setLightbox(null)} className="flex items-center gap-2 text-base font-semibold hover:opacity-80">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg> Close
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 text-lg">{lightbox + 1} / {photos.length}</span>
            <div className="flex items-center gap-5">
              <button onClick={share} aria-label="Share"><ShareIcon className="h-5 w-5" /></button>
              <button onClick={() => setSaved(!saved)} aria-label="Save"><HeartIcon className="h-5 w-5" fill={saved ? "#FF385C" : "none"} /></button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-24 pb-16">
            <img src={photos[lightbox].url} alt={title} className="max-h-full max-w-full object-contain" />
            {lightbox > 0 && (
              <button onClick={() => setLightbox(lightbox - 1)} aria-label="Previous" className="absolute left-10 flex h-14 w-14 items-center justify-center rounded-full border border-white hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
              </button>
            )}
            {lightbox < photos.length - 1 && (
              <button onClick={() => setLightbox(lightbox + 1)} aria-label="Next" className="absolute right-10 flex h-14 w-14 items-center justify-center rounded-full border border-white hover:bg-white/10">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

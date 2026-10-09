"use client";
import { useState } from "react";
import PhotoTour from "./PhotoTour";
import type { Photo } from "@/lib/types";
import { GridDotsIcon } from "./ListingIcons";

/* eslint-disable @next/next/no-img-element */
export default function Gallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const five = photos.slice(0, 5);

  return (
    <>
      {/* Phone: swipeable strip */}
      <div className="relative md:hidden">
        <div
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
          onScroll={(e) => setIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {photos.map((p) => <img key={p.id} src={p.url} alt={title} className="aspect-[4/3] w-full shrink-0 snap-center object-cover" />)}
        </div>
        <span className="absolute bottom-3 right-3 rounded-md bg-black/70 px-2.5 py-1 text-xs font-medium text-white">{idx + 1} / {photos.length}</span>
      </div>

      {/* Laptop: 1 large + 4 small */}
      <div className="relative hidden aspect-[1120/423] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl md:grid">
        {five.map((p, i) => (
          <button key={p.id} onClick={() => setOpen(true)} className={`overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
            <img src={p.url} alt={title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03] hover:brightness-90" />
          </button>
        ))}
        <button onClick={() => setOpen(true)}
          className="absolute bottom-6 right-6 flex items-center gap-2 rounded-lg border border-ink/10 bg-white px-4 py-[7px] text-xs font-semibold text-[#222] shadow-sm hover:bg-[#f7f7f7]">
          <GridDotsIcon className="h-3.5 w-3.5" /> Show all photos
        </button>
      </div>

      {open && <PhotoTour photos={photos} title={title} onClose={() => setOpen(false)} />}
    </>
  );
}

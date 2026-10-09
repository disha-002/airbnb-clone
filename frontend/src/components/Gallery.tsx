"use client";
import { useState } from "react";
import Modal from "./Modal";
import type { Photo } from "@/lib/types";

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
      <div className="relative hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {five.map((p, i) => (
          <button key={p.id} onClick={() => setOpen(true)} className={`overflow-hidden ${i === 0 ? "col-span-2 row-span-2" : ""}`}>
            <img src={p.url} alt={title} className="h-full w-full object-cover transition hover:brightness-90" />
          </button>
        ))}
        <button onClick={() => setOpen(true)} className="absolute bottom-4 right-4 rounded-lg border border-ink bg-surface px-4 py-2 text-sm font-semibold shadow">
          Show all photos
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Photos" wide>
        <div className="space-y-3">
          {photos.map((p) => <img key={p.id} src={p.url} alt={title} className="w-full rounded-xl" />)}
        </div>
      </Modal>
    </>
  );
}
